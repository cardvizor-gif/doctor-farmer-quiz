import { COOKIE_NAME } from "@shared/const";
import { dealInputSchema, dealStageSchema } from "@shared/deal";
import {
  farmInputSchema,
  farmSalesStages,
  proposalInputSchema,
  proposalStatuses,
} from "@shared/farm";
import { FARM_IMPORT_MAX_ROWS } from "@shared/farmImport";
import { TRPCError } from "@trpc/server";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { sdk } from "./_core/sdk";
import {
  allPermissionCodes,
  permissionCodes,
  type PermissionCode,
} from "../shared/permissions";
import { canOverseeRole, type RegionalMembershipRole } from "../shared/regions";
import { ENV } from "./_core/env";
import { hashPassword, verifyPassword } from "./password";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "./_core/trpc";

const orderItemSchema = z.object({
  productName: z.string().trim().min(1, "Укажите товар").max(255),
  unit: z.string().trim().min(1, "Укажите единицу измерения").max(24),
  quantity: z
    .number()
    .positive("Количество должно быть больше нуля")
    .max(10_000_000),
  unitPrice: z
    .number()
    .min(0, "Цена не может быть отрицательной")
    .max(1_000_000_000),
});

const orderRequestInputSchema = z
  .object({
    farmId: z.number().int().positive(),
    dealId: z.number().int().positive().nullable().optional(),
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
    items: z
      .array(orderItemSchema)
      .min(1, "Добавьте хотя бы одну позицию")
      .max(33),
  })
  .superRefine((input, ctx) => {
    if (input.edoStatus === "yes" && !input.edoProvider?.trim())
      ctx.addIssue({
        code: "custom",
        path: ["edoProvider"],
        message: "Укажите оператора ЭДО",
      });
  });

const shipmentInputSchema = z.object({
  requestId: z.number().int().positive(),
  shipmentDate: z.date(),
  documentNumber: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(10_000).nullable().optional(),
  items: z
    .array(
      z.object({
        requestItemId: z.number().int().positive(),
        quantity: z
          .number()
          .positive("Количество должно быть больше нуля")
          .max(10_000_000),
        unitPrice: z
          .number()
          .min(0, "Цена не может быть отрицательной")
          .max(1_000_000_000),
      })
    )
    .min(1, "Добавьте хотя бы одну отгружаемую позицию")
    .max(33),
});

const supportAttachmentSchema = z
  .object({
    fileName: z.string().trim().min(1, "Укажите имя файла").max(255),
    mimeType: z.enum([
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
    ]),
    dataBase64: z
      .string()
      .min(4, "Файл не удалось прочитать")
      .max(7_000_000, "Размер вложения превышает 5 МБ"),
  })
  .superRefine((attachment, ctx) => {
    const decodedSize = Buffer.from(attachment.dataBase64, "base64").byteLength;
    if (!decodedSize || decodedSize > 5 * 1024 * 1024)
      ctx.addIssue({
        code: "custom",
        path: ["dataBase64"],
        message: "Размер каждого вложения не должен превышать 5 МБ",
      });
  });

const catalogImportRowSchema = z.object({
  catalogId: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(255),
  preparativeForm: z.string().trim().max(80).nullable().optional(),
  category: z.string().trim().max(120).nullable().optional(),
  productGroup: z.string().trim().max(120).nullable().optional(),
  active: z.number().int().min(0).max(1).nullable().optional(),
  registrationStatus: z.string().trim().max(80).nullable().optional(),
  effectiveFrom: z.date().nullable().optional(),
  effectiveTo: z.date().nullable().optional(),
  pricePrepayment: z.number().nonnegative().nullable().optional(),
  price5050: z.number().nonnegative().nullable().optional(),
  price7030: z.number().nonnegative().nullable().optional(),
  priceDeferred: z.number().nonnegative().nullable().optional(),
  fullData: z.record(z.string(), z.unknown()),
});

const supportTicketInputSchema = z.object({
  subject: z.string().trim().max(255).nullable().optional(),
  message: z.string().trim().min(5, "Опишите вопрос подробнее").max(10_000),
  pagePath: z.string().trim().min(1).max(255),
  attachments: z
    .array(supportAttachmentSchema)
    .max(3, "К обращению можно приложить не более трёх файлов")
    .optional(),
});

function managerIdentity(user: {
  displayName?: string | null;
  name?: string | null;
  email?: string | null;
}) {
  return {
    name:
      user.displayName?.trim() ||
      user.name?.trim() ||
      user.email?.split("@")[0] ||
      "Менеджер",
    email: user.email,
  };
}

const isSuperuser = (user: {
  openId: string;
  isSuperuser?: number | boolean | null;
}) => Boolean(user.isSuperuser) || user.openId === ENV.ownerOpenId;

function sanitizeUser<T extends { passwordHash?: string | null }>(user: T) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
const getEffectivePermissions = async (user: {
  openId: string;
  isSuperuser?: number | boolean | null;
}) =>
  isSuperuser(user)
    ? allPermissionCodes
    : await db.getUserPermissions(user.openId);
const maxDiscountByPaymentTerm = {
  prepayment: 2,
  payment5050: 2,
  payment7030: 3,
  deferred: 5,
} as const;
function assertProposalDiscountLimit(schemeJson: string) {
  let context: Record<string, unknown>;
  try {
    context = JSON.parse(schemeJson) as Record<string, unknown>;
  } catch {
    return;
  }
  const rawTerm = String(context.paymentTerm ?? "");
  const term = rawTerm === "payment3070" ? "payment7030" : rawTerm;
  if (!(term in maxDiscountByPaymentTerm)) return;
  const discount = Number(context.discountPercent ?? 0);
  if (
    !Number.isFinite(discount) ||
    discount < 0 ||
    discount >
      maxDiscountByPaymentTerm[term as keyof typeof maxDiscountByPaymentTerm]
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Скидка превышает допустимый лимит для выбранного условия оплаты (максимум ${maxDiscountByPaymentTerm[term as keyof typeof maxDiscountByPaymentTerm]}%)`,
    });
  }
}

const permissionProcedure = (permission: PermissionCode) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const permissions = await getEffectivePermissions(ctx.user);
    if (!permissions.includes(permission))
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для этого раздела",
      });
    return next();
  });
const teamProcedure = (
  permission: "team.read" | "team.manage" | "team.transfer"
) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const permissions = await getEffectivePermissions(ctx.user);
    if (!permissions.includes(permission))
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав администратора команды",
      });
    return next();
  });
const superuserProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isSuperuser(ctx.user))
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Операция доступна только суперпользователю",
    });
  return next();
});
const workspaceProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const permissions = await getEffectivePermissions(ctx.user);
  if (!isSuperuser(ctx.user) && !permissions.includes("workspace.manage"))
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Недостаточно прав для управления рабочими пространствами",
    });
  return next();
});

const regionalRoleSchema = z.enum([
  "manager",
  "rop",
  "cluster_director",
  "deputy_ceo",
  "ceo",
]);
const salesTaskStatusSchema = z.enum([
  "todo",
  "in_progress",
  "done",
  "cancelled",
]);
const salesTaskPrioritySchema = z.enum(["low", "normal", "high"]);

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  notifications: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.listNotificationsForUser(ctx.user.openId)
    ),
    unreadCount: protectedProcedure.query(({ ctx }) =>
      db.countUnreadNotifications(ctx.user.openId)
    ),
    markRead: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input, ctx }) =>
        db.markNotificationRead(ctx.user.openId, input.id)
      ),
    markAllRead: protectedProcedure.mutation(({ ctx }) =>
      db.markAllNotificationsRead(ctx.user.openId)
    ),
  }),
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      const permissions = await getEffectivePermissions(ctx.user);
      return { ...sanitizeUser(ctx.user), permissions, isSuperuser: isSuperuser(ctx.user) };
    }),
    updateProfile: protectedProcedure
      .input(
        z.object({
          displayName: z
            .string()
            .trim()
            .min(2, "Укажите имя не короче 2 символов")
            .max(120, "Имя не должно превышать 120 символов"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await db.updateUserDisplayName(
          ctx.user.openId,
          input.displayName
        );
        if (!user)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Пользователь не найден",
          });
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
    request: publicProcedure
      .input(
        z.object({
          requestedName: z.string().trim().min(2, "Укажите имя").max(120),
          position: z.string().trim().min(2, "Укажите должность").max(160),
          email: z.string().trim().email("Укажите рабочий e-mail").max(320),
          regionId: z.number().int().positive(),
        })
      )
      .mutation(async ({ input }) => {
        await db.requestAccess(input);
        return { accepted: true } as const;
      }),
    list: superuserProcedure.query(() => db.listAccessRequests()),
    approve: superuserProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        const code = Array.from(
          randomBytes(10),
          byte => alphabet[byte % alphabet.length]
        ).join("");
        const codeHash = createHash("sha256").update(code).digest("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const request = await db.approveAccessRequest(
          input.id,
          ctx.user.openId,
          code,
          codeHash,
          expiresAt
        );
        if (!request)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Заявка не найдена или уже обработана",
          });
        return { request, code, expiresAt };
      }),
    history: superuserProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(({ input }) => db.listInviteCodeHistory(input.id)),
    reissue: superuserProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        const code = Array.from(
          randomBytes(10),
          byte => alphabet[byte % alphabet.length]
        ).join("");
        const codeHash = createHash("sha256").update(code).digest("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const request = await db.reissueAccessRequest(
          input.id,
          ctx.user.openId,
          code,
          codeHash,
          expiresAt
        );
        if (!request)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Заявка не найдена или недоступна для восстановления",
          });
        return { request, code, expiresAt };
      }),
    reject: superuserProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const request = await db.rejectAccessRequest(input.id, ctx.user.openId);
        if (!request)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Заявка не найдена или уже обработана",
          });
        return request;
      }),
    activate: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email().max(320),
          code: z
            .string()
            .trim()
            .length(10, "Код должен состоять из 10 символов"),
          password: z
            .string()
            .min(8, "Пароль должен содержать минимум 8 символов")
            .max(128),
          passwordConfirmation: z.string().max(128),
        })
        .refine(input => input.password === input.passwordConfirmation, {
          path: ["passwordConfirmation"],
          message: "Пароли не совпадают",
        })
      )
      .mutation(async ({ input, ctx }) => {
        const invite = await db.findActiveInvite(input.email);
        const attemptedHash = createHash("sha256")
          .update(input.code.toUpperCase())
          .digest("hex");
        const hashesMatch =
          invite?.inviteCodeHash &&
          timingSafeEqual(
            Buffer.from(invite.inviteCodeHash),
            Buffer.from(attemptedHash)
          );
        if (!invite || !hashesMatch)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Неверный или истёкший код приглашения",
          });

        const openId = invite.localOpenId ?? `invite_${randomBytes(16).toString("hex")}`;
        const consumed = await db.consumeInvite(
          invite.id,
          attemptedHash,
          openId
        );
        if (!consumed)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Код уже использован или истёк",
          });
        await db.upsertUser({
          openId,
          name: invite.requestedName,
          displayName: invite.requestedName,
          position: invite.position,
          primaryRegionId: invite.regionId,
          email: invite.email,
          loginMethod: "invite",
          lastSignedIn: new Date(),
        });
        const user = await db.getUserByOpenId(openId);
        if (!user)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Не удалось активировать кабинет",
          });
        const passwordUser = await db.setUserPassword(openId, hashPassword(input.password));
        const sessionToken = await sdk.createSessionToken(openId, {
          name: invite.requestedName,
          expiresInMs: 30 * 24 * 60 * 60 * 1000,
        });
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        return sanitizeUser(passwordUser ?? user);
      }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email().max(320),
          password: z.string().min(1).max(128),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user || user.status === "archived" || !user.passwordHash || !verifyPassword(input.password, user.passwordHash))
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Неверный e-mail или пароль",
          });
        await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.displayName || user.name || user.email || "Сотрудник",
          expiresInMs: 30 * 24 * 60 * 60 * 1000,
        });
        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        return sanitizeUser(user);
      }),
  }),
  activity: router({
    ping: protectedProcedure.mutation(({ ctx }) =>
      db.recordUserActivity(ctx.user.openId)
    ),
    forUser: superuserProcedure
      .input(z.object({ openId: z.string().trim().min(1).max(64) }))
      .query(({ input }) => db.getUserActivity(input.openId)),
  }),
  workspace: router({
    regions: protectedProcedure.query(() => db.listRegions()),
    list: workspaceProcedure.query(() => db.listWorkspaces()),
    mine: permissionProcedure("sales.read").query(({ ctx }) =>
      db.listWorkspacesForUser(ctx.user.openId)
    ),
    create: workspaceProcedure
      .input(
        z.object({
          name: z.string().trim().min(2).max(160),
          regionId: z.number().int().positive(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          return await db.createWorkspace(
            input.name,
            input.regionId,
            ctx.user.openId
          );
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              error instanceof Error
                ? error.message
                : "Не удалось создать рабочее пространство",
          });
        }
      }),
    assign: workspaceProcedure
      .input(
        z.object({
          workspaceId: z.number().int().positive(),
          userOpenId: z.string().trim().min(1).max(64),
          membershipRole: regionalRoleSchema,
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          return await db.upsertWorkspaceMember(
            input.workspaceId,
            input.userOpenId,
            input.membershipRole,
            ctx.user.openId
          );
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              error instanceof Error
                ? error.message
                : "Не удалось назначить сотрудника",
          });
        }
      }),
    removeMember: workspaceProcedure
      .input(
        z.object({
          workspaceId: z.number().int().positive(),
          userOpenId: z.string().trim().min(1).max(64),
        })
      )
      .mutation(({ input }) =>
        db.removeWorkspaceMember(input.workspaceId, input.userOpenId)
      ),
  }),
  dashboard: router({
    overview: protectedProcedure.query(({ ctx }) =>
      db.getDashboardOverview({
        openId: ctx.user.openId,
        role: ctx.user.role,
        isSuperuser: ctx.user.isSuperuser,
        name: ctx.user.displayName || ctx.user.name,
        position: ctx.user.position,
      })
    ),
  }),
  sales: router({
    overview: permissionProcedure("sales.read").query(async ({ ctx }) => {
      const memberships = await db.listWorkspacesForUser(ctx.user.openId);
      const workspaces = isSuperuser(ctx.user)
        ? await db.listWorkspaces()
        : memberships;
      const workspaceIds = workspaces.map(item => item.workspace.id);
      const leadershipWorkspaceIds = memberships
        .filter(item => item.membership.membershipRole !== "manager")
        .map(item => item.workspace.id);
      const tasks = isSuperuser(ctx.user)
        ? await db.listWorkspaceTasks(workspaceIds)
        : leadershipWorkspaceIds.length
          ? [
              ...(await db.listWorkspaceTasks(leadershipWorkspaceIds)),
              ...(await db.listWorkspaceTasksForUser(ctx.user.openId)),
            ].filter(
              (item, index, all) =>
                all.findIndex(
                  candidate => candidate.task.id === item.task.id
                ) === index
            )
          : await db.listWorkspaceTasksForUser(ctx.user.openId);
      const members = await db.listWorkspaceMembers(workspaceIds);
      const visibleOwnerIds = isSuperuser(ctx.user)
        ? members.map(item => item.user.openId)
        : members
            .filter(item =>
              leadershipWorkspaceIds.length > 0
                ? leadershipWorkspaceIds.includes(item.membership.workspaceId)
                : item.user.openId === ctx.user.openId
            )
            .map(item => item.user.openId);
      if (!visibleOwnerIds.includes(ctx.user.openId)) visibleOwnerIds.push(ctx.user.openId);
      const farms = await db.listSalesFarms(Array.from(new Set(visibleOwnerIds)));
      const deals = await db.listSalesDeals(Array.from(new Set(visibleOwnerIds)));
      return { workspaces, tasks, members, farms, deals };
    }),
    createTask: permissionProcedure("sales.write")
      .input(
        z.object({
          workspaceId: z.number().int().positive(),
          assigneeOpenId: z.string().trim().min(1).max(64),
          farmId: z.number().int().positive().nullable().optional(),
          dealId: z.number().int().positive().nullable().optional(),
          title: z.string().trim().min(2, "Укажите задачу").max(255),
          description: z.string().trim().max(10_000).nullable().optional(),
          dueAt: z.date().nullable().optional(),
          priority: salesTaskPrioritySchema.default("normal"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (input.farmId) {
          const farm = await db.getFarmById(input.farmId, ctx.user.openId);
          if (!farm)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Хозяйство не найдено или недоступно",
            });
        }
        if (input.dealId) {
          const deal = await db.getDealById(input.dealId, ctx.user.openId);
          if (!deal)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Сделка не найдена или недоступна",
            });
        }
        const workspaceMember = await db.getWorkspaceMember(
          input.workspaceId,
          ctx.user.openId
        );
        const assigneeMember = await db.getWorkspaceMember(
          input.workspaceId,
          input.assigneeOpenId
        );
        if (!workspaceMember || !assigneeMember)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Нет доступа к этому рабочему пространству",
          });
        const permissions = await getEffectivePermissions(ctx.user);
        if (
          input.assigneeOpenId !== ctx.user.openId &&
          !isSuperuser(ctx.user) &&
          (!permissions.includes("sales.assign") ||
            !canOverseeRole(
              workspaceMember.membershipRole as RegionalMembershipRole,
              assigneeMember.membershipRole as RegionalMembershipRole
            ))
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Нельзя ставить задачи этому сотруднику",
          });
        }
        const task = await db.createSalesTask({
          ...input,
          creatorOpenId: ctx.user.openId,
          description: input.description ?? null,
          dueAt: input.dueAt ?? null,
          priority: input.priority,
        });
        return task;
      }),
    updateStatus: permissionProcedure("sales.write")
      .input(
        z.object({
          id: z.number().int().positive(),
          status: salesTaskStatusSchema,
        })
      )
      .mutation(async ({ input, ctx }) => {
        const task = await db.getSalesTaskById(input.id);
        if (!task)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Задача не найдена",
          });
        if (task.assigneeOpenId !== ctx.user.openId && !isSuperuser(ctx.user))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Изменять можно только свои задачи",
          });
        return db.updateSalesTaskStatus(input.id, input.status);
      }),
  }),
  deals: router({
    list: permissionProcedure("sales.read").query(async ({ ctx }) => {
      const memberships = await db.listWorkspacesForUser(ctx.user.openId);
      const members = await db.listWorkspaceMembers(
        (isSuperuser(ctx.user) ? await db.listWorkspaces() : memberships).map(item => item.workspace.id)
      );
      const leadershipWorkspaceIds = memberships
        .filter(item => item.membership.membershipRole !== "manager")
        .map(item => item.workspace.id);
      const ownerOpenIds = isSuperuser(ctx.user)
        ? members.map(item => item.user.openId)
        : members.filter(item => leadershipWorkspaceIds.includes(item.membership.workspaceId) || item.user.openId === ctx.user.openId).map(item => item.user.openId);
      if (!ownerOpenIds.includes(ctx.user.openId)) ownerOpenIds.push(ctx.user.openId);
      return db.listSalesDeals(Array.from(new Set(ownerOpenIds)));
    }),
    create: permissionProcedure("sales.write")
      .input(dealInputSchema)
      .mutation(async ({ input, ctx }) => {
        const farm = await db.getFarmById(input.farmId, ctx.user.openId);
        if (!farm) throw new TRPCError({ code: "NOT_FOUND", message: "Хозяйство не найдено или недоступно" });
        if (input.workspaceId) {
          const membership = await db.getWorkspaceMember(input.workspaceId, ctx.user.openId);
          if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Нет доступа к рабочему пространству" });
        }
        return db.createDeal(input, ctx.user.openId);
      }),
    updateStage: permissionProcedure("sales.write")
      .input(z.object({ id: z.number().int().positive(), stage: dealStageSchema }))
      .mutation(async ({ input, ctx }) => {
        const deal = await db.getDealById(input.id, ctx.user.openId);
        if (!deal) throw new TRPCError({ code: "NOT_FOUND", message: "Сделка не найдена или недоступна" });
        return db.updateDealStage(input.id, input.stage, ctx.user.openId);
      }),
  }),
  admin: router({
    publishNews: superuserProcedure
      .input(
        z.object({
          title: z.string().trim().min(2).max(255),
          body: z.string().trim().min(2).max(2_000),
          href: z.string().trim().max(255).optional(),
        })
      )
      .mutation(({ input }) =>
        db.publishNewsNotification(input.title, input.body, input.href || "/")
      ),
    team: teamProcedure("team.read").query(() => db.listTeamMembers()),
    teamFarms: teamProcedure("team.read").query(() => db.listTeamFarms()),
    memberWorkspace: teamProcedure("team.read")
      .input(z.object({ openId: z.string().trim().min(1).max(64) }))
      .query(async ({ input }) => {
        const workspace = await db.getTeamMemberWorkspace(input.openId);
        if (!workspace)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Сотрудник не найден",
          });
        return workspace;
      }),
    updateAccess: adminProcedure
      .input(
        z.object({
          openId: z.string().trim().min(1).max(64),
          role: z.enum(["user", "admin"]),
          permissions: z
            .array(z.enum(permissionCodes))
            .max(permissionCodes.length),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const permissions = await getEffectivePermissions(ctx.user);
        if (!permissions.includes("team.manage"))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Недостаточно прав для управления командой",
          });
        if (!isSuperuser(ctx.user)) {
          if (input.role !== "user")
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "Только суперпользователь может назначать администраторов",
            });
          const target = await db.getUserByOpenId(input.openId);
          if (target?.role === "admin" || input.openId === ctx.user.openId)
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "Делегированный администратор не может менять права администратора или свои права",
            });
        }
        const updated = await db.updateUserAccess(
          input.openId,
          input.role,
          input.permissions,
          ctx.user.openId
        );
        if (!updated)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Сотрудник не найден",
          });
        return updated;
      }),
    transferData: teamProcedure("team.transfer")
      .input(
        z.object({
          sourceOpenId: z.string().trim().min(1).max(64),
          targetOpenId: z.string().trim().min(1).max(64),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          return await db.transferUserData(
            input.sourceOpenId,
            input.targetOpenId,
            ctx.user.openId
          );
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              error instanceof Error
                ? error.message
                : "Не удалось передать базу сотрудника",
          });
        }
      }),
    archiveUser: adminProcedure
      .input(z.object({ openId: z.string().trim().min(1).max(64) }))
      .mutation(async ({ input, ctx }) => {
        if (!isSuperuser(ctx.user))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Архивировать сотрудников может только суперпользователь",
          });
        try {
          return await db.archiveUser(input.openId, ctx.user.openId);
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              error instanceof Error
                ? error.message
                : "Не удалось архивировать сотрудника",
          });
        }
      }),
    restoreUser: adminProcedure
      .input(z.object({ openId: z.string().trim().min(1).max(64) }))
      .mutation(async ({ input, ctx }) => {
        if (!isSuperuser(ctx.user))
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Восстанавливать сотрудников может только суперпользователь",
          });
        try {
          const restored = await db.restoreArchivedUser(
            input.openId,
            ctx.user.openId
          );
          if (!restored)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Сотрудник не найден",
            });
          return restored;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              error instanceof Error
                ? error.message
                : "Не удалось восстановить сотрудника",
          });
        }
      }),
    deleteUser: adminProcedure
      .input(z.object({ openId: z.string().trim().min(1).max(64) }))
      .mutation(async ({ input, ctx }) => {
        if (!isSuperuser(ctx.user))
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Удалять сотрудников может только суперпользователь",
          });
        try {
          const deleted = await db.deleteUserAccount(input.openId);
          if (!deleted)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Сотрудник не найден",
            });
          return deleted;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              error instanceof Error
                ? error.message
                : "Не удалось удалить сотрудника",
          });
        }
      }),
  }),
  farms: router({
    list: permissionProcedure("farms.read").query(({ ctx }) =>
      db.listFarms(ctx.user.openId)
    ),
    tasks: permissionProcedure("farms.read")
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        const farm = await db.getFarmById(input.id, ctx.user.openId);
        if (!farm)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Хозяйство не найдено",
          });
        return db.listFarmTasks(input.id, ctx.user.openId);
      }),
    byId: permissionProcedure("farms.read")
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        const farm = await db.getFarmById(input.id, ctx.user.openId);
        if (!farm)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Хозяйство не найдено",
          });
        return farm;
      }),
    create: permissionProcedure("farms.write")
      .input(farmInputSchema)
      .mutation(async ({ input, ctx }) => {
        const farm = await db.createFarm(input, ctx.user.openId);
        if (!farm)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Не удалось создать карточку хозяйства",
          });
        return farm;
      }),
    bulkCreate: permissionProcedure("farms.write")
      .input(
        z.object({
          farms: z.array(farmInputSchema).min(1).max(FARM_IMPORT_MAX_ROWS),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return db.createFarms(input.farms, ctx.user.openId);
      }),
    update: permissionProcedure("farms.write")
      .input(farmInputSchema.extend({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...farmInput } = input;
        const farm = await db.updateFarm(id, farmInput, ctx.user.openId);
        if (!farm)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Хозяйство не найдено",
          });
        return farm;
      }),
    updateStage: permissionProcedure("farms.write")
      .input(
        z.object({
          id: z.number().int().positive(),
          salesStage: z.enum(farmSalesStages),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const farm = await db.updateFarmStage(input.id, input.salesStage, ctx.user.openId);
        if (!farm)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Хозяйство не найдено или недоступно",
          });
        return farm;
      }),
    remove: permissionProcedure("farms.write")
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input, ctx }) => db.removeFarm(input.id, ctx.user.openId)),
    claimLegacy: adminProcedure.mutation(({ ctx }) =>
      db.claimLegacyFarms(ctx.user.openId)
    ),
  }),
  proposals: router({
    list: permissionProcedure("proposals.read")
      .input(
        z.object({ farmId: z.number().int().positive().optional() }).optional()
      )
      .query(({ input, ctx }) =>
        db.listProposals(ctx.user.openId, input?.farmId)
      ),
    byId: permissionProcedure("proposals.read")
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        const proposal = await db.getProposalById(input.id, ctx.user.openId);
        if (!proposal)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Коммерческое предложение не найдено",
          });
        return proposal;
      }),
    create: permissionProcedure("proposals.write")
      .input(proposalInputSchema)
      .mutation(async ({ input, ctx }) => {
        assertProposalDiscountLimit(input.schemeJson);
        const farm = await db.getFarmById(input.farmId, ctx.user.openId);
        if (!farm)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Сначала выберите существующее хозяйство",
          });
        if (input.dealId) {
          const deal = await db.getDealById(input.dealId, ctx.user.openId);
          if (!deal || deal.deal.farmId !== input.farmId)
            throw new TRPCError({ code: "BAD_REQUEST", message: "Сделка не относится к выбранному хозяйству" });
        }
        const proposal = await db.createProposal(input, ctx.user.openId);
        if (!proposal)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Не удалось сохранить коммерческое предложение",
          });
        return proposal;
      }),
    update: permissionProcedure("proposals.write")
      .input(
        proposalInputSchema.safeExtend({ id: z.number().int().positive() })
      )
      .mutation(async ({ input, ctx }) => {
        assertProposalDiscountLimit(input.schemeJson);
        const { id, ...payload } = input;
        const proposal = await db.updateProposal(id, payload, ctx.user.openId);
        if (!proposal)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Коммерческое предложение не найдено или недоступно",
          });
        return proposal;
      }),
    remove: permissionProcedure("proposals.write")
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const proposal = await db.removeProposal(input.id, ctx.user.openId);
        if (!proposal)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Коммерческое предложение не найдено или недоступно",
          });
        return proposal;
      }),
    updateStatus: permissionProcedure("proposals.write")
      .input(
        z.object({
          id: z.number().int().positive(),
          status: z.enum(proposalStatuses),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const proposal = await db.updateProposalStatus(
          input.id,
          input.status,
          ctx.user.openId
        );
        if (!proposal)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Коммерческое предложение не найдено",
          });
        return proposal;
      }),
  }),
  catalog: router({
    active: protectedProcedure.query(() => db.listCatalogProducts(false)),
    list: permissionProcedure("catalog.manage").query(() =>
      db.listCatalogProducts(true)
    ),
    history: permissionProcedure("catalog.manage").query(() =>
      db.listCatalogImportBatches()
    ),
    import: permissionProcedure("catalog.manage")
      .input(
        z.object({
          fileName: z.string().trim().max(255).optional(),
          rows: z
            .array(catalogImportRowSchema)
            .min(1, "Файл не содержит строк")
            .max(2_000),
        })
      )
      .mutation(({ input, ctx }) =>
        db.applyCatalogImport(
          input.rows,
          input.fileName ?? "Номенклатура.xlsx",
          ctx.user.openId
        )
      ),
  }),
  support: router({
    list: permissionProcedure("support.create").query(async ({ ctx }) => {
      const permissions = await getEffectivePermissions(ctx.user);
      return db.listSupportTickets(
        ctx.user.openId,
        isSuperuser(ctx.user) || permissions.includes("support.manage")
      );
    }),
    byId: permissionProcedure("support.create")
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        const permissions = await getEffectivePermissions(ctx.user);
        const ticket = await db.getSupportTicketById(
          input.id,
          ctx.user.openId,
          isSuperuser(ctx.user) || permissions.includes("support.manage")
        );
        if (!ticket)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Обращение не найдено",
          });
        return ticket;
      }),
    create: permissionProcedure("support.create")
      .input(supportTicketInputSchema)
      .mutation(({ input, ctx }) =>
        db.createSupportTicket(input, ctx.user.openId)
      ),
    reply: permissionProcedure("support.manage")
      .input(
        z.object({
          id: z.number().int().positive(),
          message: z
            .string()
            .trim()
            .min(1, "Введите текст ответа")
            .max(10_000, "Ответ не должен превышать 10 000 символов"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const ticket = await db.replySupportTicket({
          ticketId: input.id,
          message: input.message,
          responderOpenId: ctx.user.openId,
        });
        if (!ticket)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Обращение не найдено",
          });
        return ticket;
      }),
    updateStatus: permissionProcedure("support.manage")
      .input(
        z.object({
          id: z.number().int().positive(),
          status: z.enum(["new", "in_progress", "resolved"]),
        })
      )
      .mutation(async ({ input }) => {
        const ticket = await db.updateSupportTicketStatus(
          input.id,
          input.status
        );
        if (!ticket)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Обращение не найдено",
          });
        return ticket;
      }),
  }),
  orderRequests: router({
    list: permissionProcedure("orders.read").query(({ ctx }) =>
      db.listOrderRequests(ctx.user.openId)
    ),
    byId: permissionProcedure("orders.read")
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        const request = await db.getOrderRequestById(input.id, ctx.user.openId);
        if (!request)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Заявка не найдена",
          });
        return request;
      }),
    create: permissionProcedure("orders.write")
      .input(orderRequestInputSchema)
      .mutation(async ({ input, ctx }) => {
        if (input.dealId) {
          const deal = await db.getDealById(input.dealId, ctx.user.openId);
          if (!deal || deal.deal.farmId !== input.farmId)
            throw new TRPCError({ code: "BAD_REQUEST", message: "Сделка не относится к выбранному хозяйству" });
        }
        const request = await db.createOrderRequest(
          input,
          ctx.user.openId,
          managerIdentity(ctx.user)
        );
        if (!request)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Выберите существующее хозяйство",
          });
        return request;
      }),
    update: permissionProcedure("orders.write")
      .input(
        orderRequestInputSchema.safeExtend({ id: z.number().int().positive() })
      )
      .mutation(async ({ input, ctx }) => {
        const { id, ...payload } = input;
        const request = await db.updateOrderRequest(
          id,
          payload,
          ctx.user.openId,
          managerIdentity(ctx.user)
        );
        if (!request)
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Заявка не найдена, имеет отгрузки или недоступна для изменения",
          });
        return request;
      }),
    remove: permissionProcedure("orders.write")
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const request = await db.removeOrderRequest(input.id, ctx.user.openId);
        if (!request)
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Удалять можно только свою сохранённую заявку без отгрузок",
          });
        return request;
      }),
    createShipment: permissionProcedure("orders.write")
      .input(shipmentInputSchema)
      .mutation(async ({ input, ctx }) => {
        const { requestId, ...payload } = input;
        const request = await db.createShipment(
          requestId,
          payload,
          ctx.user.openId
        );
        if (!request)
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Заявка недоступна, не передана в бухгалтерию или количество превышает остаток",
          });
        return request;
      }),
  }),
});

export type AppRouter = typeof appRouter;
