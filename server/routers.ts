import { COOKIE_NAME } from "@shared/const";
import { farmInputSchema, proposalInputSchema, proposalStatuses } from "@shared/farm";
import { FARM_IMPORT_MAX_ROWS } from "@shared/farmImport";
import { TRPCError } from "@trpc/server";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { sdk } from "./_core/sdk";
import { allPermissionCodes, permissionCodes, type PermissionCode } from "../shared/permissions";
import { canOverseeRole, type RegionalMembershipRole } from "../shared/regions";
import { ENV } from "./_core/env";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const orderItemSchema = z.object({
  productName: z.string().trim().min(1, "Укажите товар").max(255),
  unit: z.string().trim().min(1, "Укажите единицу измерения").max(24),
  quantity: z.number().positive("Количество должно быть больше нуля").max(10_000_000),
  unitPrice: z.number().min(0, "Цена не может быть отрицательной").max(1_000_000_000),
});

const orderRequestInputSchema = z.object({
  farmId: z.number().int().positive(),
  requestDate: z.date(),
  buyerName: z.string().trim().min(1, "Укажите покупателя").max(255),
  segment: z.enum(["agroholding", "dealer", "large", "medium", "small"]),
  paymentTerms: z.string().trim().min(1, "Укажите условия оплаты").max(32),
  paymentDueDate: z.date().nullable().optional(),
  supplyDocuments: z.string().trim().max(2_000).nullable().optional(),
  deliveryDueDate: z.date().nullable().optional(),
  edoStatus: z.enum(["yes", "no"]),
  edoProvider: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(10_000).nullable().optional(),
  status: z.enum(["draft", "submitted"]),
  items: z.array(orderItemSchema).min(1, "Добавьте хотя бы одну позицию").max(33),
}).superRefine((input, ctx) => {
  if (input.edoStatus === "yes" && !input.edoProvider?.trim()) ctx.addIssue({ code: "custom", path: ["edoProvider"], message: "Укажите оператора ЭДО" });
});

const shipmentInputSchema = z.object({
  requestId: z.number().int().positive(),
  shipmentDate: z.date(),
  documentNumber: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(10_000).nullable().optional(),
  items: z.array(z.object({
    requestItemId: z.number().int().positive(),
    quantity: z.number().positive("Количество должно быть больше нуля").max(10_000_000),
    unitPrice: z.number().min(0, "Цена не может быть отрицательной").max(1_000_000_000),
  })).min(1, "Добавьте хотя бы одну отгружаемую позицию").max(33),
});

const supportAttachmentSchema = z.object({
  fileName: z.string().trim().min(1, "Укажите имя файла").max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/csv"]),
  dataBase64: z.string().min(4, "Файл не удалось прочитать").max(7_000_000, "Размер вложения превышает 5 МБ"),
}).superRefine((attachment, ctx) => {
  const decodedSize = Buffer.from(attachment.dataBase64, "base64").byteLength;
  if (!decodedSize || decodedSize > 5 * 1024 * 1024) ctx.addIssue({ code: "custom", path: ["dataBase64"], message: "Размер каждого вложения не должен превышать 5 МБ" });
});

const supportTicketInputSchema = z.object({
  subject: z.string().trim().max(255).nullable().optional(),
  message: z.string().trim().min(5, "Опишите вопрос подробнее").max(10_000),
  pagePath: z.string().trim().min(1).max(255),
  attachments: z.array(supportAttachmentSchema).max(3, "К обращению можно приложить не более трёх файлов").optional(),
});

function managerIdentity(user: { displayName?: string | null; name?: string | null; email?: string | null }) {
  return {
    name: user.displayName?.trim() || user.name?.trim() || user.email?.split("@")[0] || "Менеджер",
    email: user.email,
  };
}

const isSuperuser = (user: { openId: string; isSuperuser?: number | boolean | null }) => Boolean(user.isSuperuser) || user.openId === ENV.ownerOpenId;
const getEffectivePermissions = async (user: { openId: string; isSuperuser?: number | boolean | null }) => isSuperuser(user) ? allPermissionCodes : await db.getUserPermissions(user.openId);
const permissionProcedure = (permission: PermissionCode) => protectedProcedure.use(async ({ ctx, next }) => {
  const permissions = await getEffectivePermissions(ctx.user);
  if (!permissions.includes(permission)) throw new TRPCError({ code: "FORBIDDEN", message: "Недостаточно прав для этого раздела" });
  return next();
});
const teamProcedure = (permission: "team.read" | "team.manage" | "team.transfer") => protectedProcedure.use(async ({ ctx, next }) => {
  const permissions = await getEffectivePermissions(ctx.user);
  if (!permissions.includes(permission)) throw new TRPCError({ code: "FORBIDDEN", message: "Недостаточно прав администратора команды" });
  return next();
});
const superuserProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isSuperuser(ctx.user)) throw new TRPCError({ code: "FORBIDDEN", message: "Операция доступна только суперпользователю" });
  return next();
});
const workspaceProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const permissions = await getEffectivePermissions(ctx.user);
  if (!isSuperuser(ctx.user) && !permissions.includes("workspace.manage")) throw new TRPCError({ code: "FORBIDDEN", message: "Недостаточно прав для управления рабочими пространствами" });
  return next();
});

const regionalRoleSchema = z.enum(["manager", "rop", "cluster_director", "deputy_ceo", "ceo"]);
const salesTaskStatusSchema = z.enum(["todo", "in_progress", "done", "cancelled"]);
const salesTaskPrioritySchema = z.enum(["low", "normal", "high"]);

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      const permissions = await getEffectivePermissions(ctx.user);
      return { ...ctx.user, permissions, isSuperuser: isSuperuser(ctx.user) };
    }),
    updateProfile: protectedProcedure.input(z.object({ displayName: z.string().trim().min(2, "Укажите имя не короче 2 символов").max(120, "Имя не должно превышать 120 символов") })).mutation(async ({ input, ctx }) => {
      const user = await db.updateUserDisplayName(ctx.user.openId, input.displayName);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Пользователь не найден" });
      return user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  access: router({
    regions: publicProcedure.query(() => db.listRegions()),
    request: publicProcedure.input(z.object({
      requestedName: z.string().trim().min(2, "Укажите имя").max(120),
      position: z.string().trim().min(2, "Укажите должность").max(160),
      email: z.string().trim().email("Укажите рабочий e-mail").max(320),
      regionId: z.number().int().positive(),
    })).mutation(async ({ input }) => {
      await db.requestAccess(input);
      return { accepted: true } as const;
    }),
    list: superuserProcedure.query(() => db.listAccessRequests()),
    approve: superuserProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const code = Array.from(randomBytes(10), byte => alphabet[byte % alphabet.length]).join("");
      const codeHash = createHash("sha256").update(code).digest("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const request = await db.approveAccessRequest(input.id, ctx.user.openId, code, codeHash, expiresAt);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Заявка не найдена или уже обработана" });
      return { request, code, expiresAt };
    }),
    history: superuserProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => db.listInviteCodeHistory(input.id)),
    reissue: superuserProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const code = Array.from(randomBytes(10), byte => alphabet[byte % alphabet.length]).join("");
      const codeHash = createHash("sha256").update(code).digest("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const request = await db.reissueAccessRequest(input.id, ctx.user.openId, code, codeHash, expiresAt);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Заявка не найдена или уже активирована" });
      return { request, code, expiresAt };
    }),
    reject: superuserProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const request = await db.rejectAccessRequest(input.id, ctx.user.openId);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Заявка не найдена или уже обработана" });
      return request;
    }),
    activate: publicProcedure.input(z.object({ email: z.string().trim().email().max(320), code: z.string().trim().length(10, "Код должен состоять из 10 символов") })).mutation(async ({ input, ctx }) => {
      const invite = await db.findActiveInvite(input.email);
      const attemptedHash = createHash("sha256").update(input.code.toUpperCase()).digest("hex");
      const hashesMatch = invite?.inviteCodeHash && timingSafeEqual(Buffer.from(invite.inviteCodeHash), Buffer.from(attemptedHash));
      if (!invite || !hashesMatch) throw new TRPCError({ code: "UNAUTHORIZED", message: "Неверный или истёкший код приглашения" });

      const openId = `invite_${randomBytes(16).toString("hex")}`;
      const consumed = await db.consumeInvite(invite.id, attemptedHash, openId);
      if (!consumed) throw new TRPCError({ code: "UNAUTHORIZED", message: "Код уже использован или истёк" });
      await db.upsertUser({ openId, name: invite.requestedName, displayName: invite.requestedName, position: invite.position, primaryRegionId: invite.regionId, email: invite.email, loginMethod: "invite", lastSignedIn: new Date() });
      const user = await db.getUserByOpenId(openId);
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Не удалось активировать кабинет" });
      const sessionToken = await sdk.createSessionToken(openId, { name: invite.requestedName, expiresInMs: 30 * 24 * 60 * 60 * 1000 });
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: 30 * 24 * 60 * 60 * 1000 });
      return user;
    }),
  }),
  activity: router({
    ping: protectedProcedure.mutation(({ ctx }) => db.recordUserActivity(ctx.user.openId)),
    forUser: superuserProcedure.input(z.object({ openId: z.string().trim().min(1).max(64) })).query(({ input }) => db.getUserActivity(input.openId)),
  }),
  workspace: router({
    regions: protectedProcedure.query(() => db.listRegions()),
    list: workspaceProcedure.query(() => db.listWorkspaces()),
    mine: permissionProcedure("sales.read").query(({ ctx }) => db.listWorkspacesForUser(ctx.user.openId)),
    create: workspaceProcedure.input(z.object({ name: z.string().trim().min(2).max(160), regionId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      try {
        return await db.createWorkspace(input.name, input.regionId, ctx.user.openId);
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Не удалось создать рабочее пространство" });
      }
    }),
    assign: workspaceProcedure.input(z.object({ workspaceId: z.number().int().positive(), userOpenId: z.string().trim().min(1).max(64), membershipRole: regionalRoleSchema })).mutation(async ({ input, ctx }) => {
      try {
        return await db.upsertWorkspaceMember(input.workspaceId, input.userOpenId, input.membershipRole, ctx.user.openId);
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Не удалось назначить сотрудника" });
      }
    }),
    removeMember: workspaceProcedure.input(z.object({ workspaceId: z.number().int().positive(), userOpenId: z.string().trim().min(1).max(64) })).mutation(({ input }) => db.removeWorkspaceMember(input.workspaceId, input.userOpenId)),
  }),
  sales: router({
    overview: permissionProcedure("sales.read").query(async ({ ctx }) => {
      const memberships = await db.listWorkspacesForUser(ctx.user.openId);
      const workspaces = isSuperuser(ctx.user) ? await db.listWorkspaces() : memberships;
      const workspaceIds = workspaces.map((item) => item.workspace.id);
      const leadershipWorkspaceIds = memberships.filter((item) => item.membership.membershipRole !== "manager").map((item) => item.workspace.id);
      const tasks = isSuperuser(ctx.user) ? await db.listWorkspaceTasks(workspaceIds) : leadershipWorkspaceIds.length ? [...await db.listWorkspaceTasks(leadershipWorkspaceIds), ...await db.listWorkspaceTasksForUser(ctx.user.openId)].filter((item, index, all) => all.findIndex((candidate) => candidate.task.id === item.task.id) === index) : await db.listWorkspaceTasksForUser(ctx.user.openId);
      const members = await db.listWorkspaceMembers(workspaceIds);
      return { workspaces, tasks, members };
    }),
    createTask: permissionProcedure("sales.write").input(z.object({
      workspaceId: z.number().int().positive(),
      assigneeOpenId: z.string().trim().min(1).max(64),
      title: z.string().trim().min(2, "Укажите задачу").max(255),
      description: z.string().trim().max(10_000).nullable().optional(),
      dueAt: z.date().nullable().optional(),
      priority: salesTaskPrioritySchema.default("normal"),
    })).mutation(async ({ input, ctx }) => {
      const workspaceMember = await db.getWorkspaceMember(input.workspaceId, ctx.user.openId);
      const assigneeMember = await db.getWorkspaceMember(input.workspaceId, input.assigneeOpenId);
      if (!workspaceMember || !assigneeMember) throw new TRPCError({ code: "FORBIDDEN", message: "Нет доступа к этому рабочему пространству" });
      const permissions = await getEffectivePermissions(ctx.user);
      if (input.assigneeOpenId !== ctx.user.openId && !isSuperuser(ctx.user) && (!permissions.includes("sales.assign") || !canOverseeRole(workspaceMember.membershipRole as RegionalMembershipRole, assigneeMember.membershipRole as RegionalMembershipRole))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Нельзя ставить задачи этому сотруднику" });
      }
      const task = await db.createSalesTask({ ...input, creatorOpenId: ctx.user.openId, description: input.description ?? null, dueAt: input.dueAt ?? null, priority: input.priority });
      return task;
    }),
    updateStatus: permissionProcedure("sales.write").input(z.object({ id: z.number().int().positive(), status: salesTaskStatusSchema })).mutation(async ({ input, ctx }) => {
      const task = await db.getSalesTaskById(input.id);
      if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Задача не найдена" });
      if (task.assigneeOpenId !== ctx.user.openId && !isSuperuser(ctx.user)) throw new TRPCError({ code: "FORBIDDEN", message: "Изменять можно только свои задачи" });
      return db.updateSalesTaskStatus(input.id, input.status);
    }),
  }),
  admin: router({
    team: teamProcedure("team.read").query(() => db.listTeamMembers()),
    teamFarms: teamProcedure("team.read").query(() => db.listTeamFarms()),
    memberWorkspace: teamProcedure("team.read").input(z.object({ openId: z.string().trim().min(1).max(64) })).query(async ({ input }) => {
      const workspace = await db.getTeamMemberWorkspace(input.openId);
      if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "Сотрудник не найден" });
      return workspace;
    }),
    updateAccess: adminProcedure.input(z.object({
      openId: z.string().trim().min(1).max(64),
      role: z.enum(["user", "admin"]),
      permissions: z.array(z.enum(permissionCodes)).max(permissionCodes.length),
    })).mutation(async ({ input, ctx }) => {
      const permissions = await getEffectivePermissions(ctx.user);
      if (!permissions.includes("team.manage")) throw new TRPCError({ code: "FORBIDDEN", message: "Недостаточно прав для управления командой" });
      if (!isSuperuser(ctx.user)) {
        if (input.role !== "user") throw new TRPCError({ code: "FORBIDDEN", message: "Только суперпользователь может назначать администраторов" });
        const target = await db.getUserByOpenId(input.openId);
        if (target?.role === "admin" || input.openId === ctx.user.openId) throw new TRPCError({ code: "FORBIDDEN", message: "Делегированный администратор не может менять права администратора или свои права" });
      }
      const updated = await db.updateUserAccess(input.openId, input.role, input.permissions, ctx.user.openId);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Сотрудник не найден" });
      return updated;
    }),
    transferAndArchive: teamProcedure("team.transfer").input(z.object({
      sourceOpenId: z.string().trim().min(1).max(64),
      targetOpenId: z.string().trim().min(1).max(64),
    })).mutation(async ({ input, ctx }) => {
      try {
        return await db.transferAndArchiveUser(input.sourceOpenId, input.targetOpenId, ctx.user.openId);
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Не удалось передать базу сотрудника" });
      }
    }),
    restoreUser: adminProcedure.input(z.object({ openId: z.string().trim().min(1).max(64) })).mutation(async ({ input, ctx }) => {
      if (!isSuperuser(ctx.user)) throw new TRPCError({ code: "FORBIDDEN", message: "Восстанавливать сотрудников может только суперпользователь" });
      try {
        const restored = await db.restoreArchivedUser(input.openId, ctx.user.openId);
        if (!restored) throw new TRPCError({ code: "NOT_FOUND", message: "Сотрудник не найден" });
        return restored;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Не удалось восстановить сотрудника" });
      }
    }),
    deleteUser: adminProcedure.input(z.object({ openId: z.string().trim().min(1).max(64) })).mutation(async ({ input, ctx }) => {
      if (!isSuperuser(ctx.user)) throw new TRPCError({ code: "FORBIDDEN", message: "Удалять сотрудников может только суперпользователь" });
      try {
        const deleted = await db.deleteUserAccount(input.openId);
        if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Сотрудник не найден" });
        return deleted;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Не удалось удалить сотрудника" });
      }
    }),
  }),
  farms: router({
    list: permissionProcedure("farms.read").query(({ ctx }) => db.listFarms(ctx.user.openId)),
    byId: permissionProcedure("farms.read").input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
      const farm = await db.getFarmById(input.id, ctx.user.openId);
      if (!farm) throw new TRPCError({ code: "NOT_FOUND", message: "Хозяйство не найдено" });
      return farm;
    }),
    create: permissionProcedure("farms.write").input(farmInputSchema).mutation(async ({ input, ctx }) => {
      const farm = await db.createFarm(input, ctx.user.openId);
      if (!farm) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Не удалось создать карточку хозяйства" });
      return farm;
    }),
    bulkCreate: permissionProcedure("farms.write").input(z.object({ farms: z.array(farmInputSchema).min(1).max(FARM_IMPORT_MAX_ROWS) })).mutation(async ({ input, ctx }) => {
      return db.createFarms(input.farms, ctx.user.openId);
    }),
    update: permissionProcedure("farms.write").input(farmInputSchema.extend({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const { id, ...farmInput } = input;
      const farm = await db.updateFarm(id, farmInput, ctx.user.openId);
      if (!farm) throw new TRPCError({ code: "NOT_FOUND", message: "Хозяйство не найдено" });
      return farm;
    }),
    remove: permissionProcedure("farms.write").input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => db.removeFarm(input.id, ctx.user.openId)),
    claimLegacy: adminProcedure.mutation(({ ctx }) => db.claimLegacyFarms(ctx.user.openId)),
  }),
  proposals: router({
    list: permissionProcedure("proposals.read").input(z.object({ farmId: z.number().int().positive().optional() }).optional()).query(({ input, ctx }) => db.listProposals(ctx.user.openId, input?.farmId)),
    byId: permissionProcedure("proposals.read").input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
      const proposal = await db.getProposalById(input.id, ctx.user.openId);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND", message: "Коммерческое предложение не найдено" });
      return proposal;
    }),
    create: permissionProcedure("proposals.write").input(proposalInputSchema).mutation(async ({ input, ctx }) => {
      const farm = await db.getFarmById(input.farmId, ctx.user.openId);
      if (!farm) throw new TRPCError({ code: "NOT_FOUND", message: "Сначала выберите существующее хозяйство" });
      const proposal = await db.createProposal(input, ctx.user.openId);
      if (!proposal) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Не удалось сохранить коммерческое предложение" });
      return proposal;
    }),
    update: permissionProcedure("proposals.write").input(proposalInputSchema.safeExtend({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const { id, ...payload } = input;
      const proposal = await db.updateProposal(id, payload, ctx.user.openId);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND", message: "Коммерческое предложение не найдено или недоступно" });
      return proposal;
    }),
    remove: permissionProcedure("proposals.write").input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const proposal = await db.removeProposal(input.id, ctx.user.openId);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND", message: "Коммерческое предложение не найдено или недоступно" });
      return proposal;
    }),
    updateStatus: permissionProcedure("proposals.write").input(z.object({ id: z.number().int().positive(), status: z.enum(proposalStatuses) })).mutation(async ({ input, ctx }) => {
      const proposal = await db.updateProposalStatus(input.id, input.status, ctx.user.openId);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND", message: "Коммерческое предложение не найдено" });
      return proposal;
    }),
  }),
  support: router({
    list: permissionProcedure("support.create").query(({ ctx }) => db.listSupportTickets(ctx.user.openId, ctx.user.role === "admin")),
    byId: permissionProcedure("support.create").input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
      const ticket = await db.getSupportTicketById(input.id, ctx.user.openId, ctx.user.role === "admin");
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Обращение не найдено" });
      return ticket;
    }),
    create: permissionProcedure("support.create").input(supportTicketInputSchema).mutation(({ input, ctx }) => db.createSupportTicket(input, ctx.user.openId)),
    updateStatus: permissionProcedure("support.manage").input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "in_progress", "resolved"]) })).mutation(async ({ input }) => {
      const ticket = await db.updateSupportTicketStatus(input.id, input.status);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Обращение не найдено" });
      return ticket;
    }),
  }),
  orderRequests: router({
    list: permissionProcedure("orders.read").query(({ ctx }) => db.listOrderRequests(ctx.user.openId)),
    byId: permissionProcedure("orders.read").input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
      const request = await db.getOrderRequestById(input.id, ctx.user.openId);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Заявка не найдена" });
      return request;
    }),
    create: permissionProcedure("orders.write").input(orderRequestInputSchema).mutation(async ({ input, ctx }) => {
      const request = await db.createOrderRequest(input, ctx.user.openId, managerIdentity(ctx.user));
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Выберите существующее хозяйство" });
      return request;
    }),
    update: permissionProcedure("orders.write").input(orderRequestInputSchema.safeExtend({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const { id, ...payload } = input;
      const request = await db.updateOrderRequest(id, payload, ctx.user.openId, managerIdentity(ctx.user));
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Черновик заявки не найден или уже передан в бухгалтерию" });
      return request;
    }),
    remove: permissionProcedure("orders.write").input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const request = await db.removeOrderRequest(input.id, ctx.user.openId);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Удалять можно только свои черновики без отгрузок" });
      return request;
    }),
    createShipment: permissionProcedure("orders.write").input(shipmentInputSchema).mutation(async ({ input, ctx }) => {
      const { requestId, ...payload } = input;
      const request = await db.createShipment(requestId, payload, ctx.user.openId);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Заявка недоступна, не передана в бухгалтерию или количество превышает остаток" });
      return request;
    }),
  }),
});

export type AppRouter = typeof appRouter;
