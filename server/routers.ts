import { COOKIE_NAME } from "@shared/const";
import { farmInputSchema, proposalInputSchema, proposalStatuses } from "@shared/farm";
import { FARM_IMPORT_MAX_ROWS } from "@shared/farmImport";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
  farms: router({
    list: protectedProcedure.query(({ ctx }) => db.listFarms(ctx.user.openId)),
    byId: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
      const farm = await db.getFarmById(input.id, ctx.user.openId);
      if (!farm) throw new TRPCError({ code: "NOT_FOUND", message: "Хозяйство не найдено" });
      return farm;
    }),
    create: protectedProcedure.input(farmInputSchema).mutation(async ({ input, ctx }) => {
      const farm = await db.createFarm(input, ctx.user.openId);
      if (!farm) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Не удалось создать карточку хозяйства" });
      return farm;
    }),
    bulkCreate: protectedProcedure.input(z.object({ farms: z.array(farmInputSchema).min(1).max(FARM_IMPORT_MAX_ROWS) })).mutation(async ({ input, ctx }) => {
      return db.createFarms(input.farms, ctx.user.openId);
    }),
    update: protectedProcedure.input(farmInputSchema.extend({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const { id, ...farmInput } = input;
      const farm = await db.updateFarm(id, farmInput, ctx.user.openId);
      if (!farm) throw new TRPCError({ code: "NOT_FOUND", message: "Хозяйство не найдено" });
      return farm;
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => db.removeFarm(input.id, ctx.user.openId)),
    claimLegacy: adminProcedure.mutation(({ ctx }) => db.claimLegacyFarms(ctx.user.openId)),
  }),
  proposals: router({
    list: protectedProcedure.input(z.object({ farmId: z.number().int().positive().optional() }).optional()).query(({ input, ctx }) => db.listProposals(ctx.user.openId, input?.farmId)),
    byId: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
      const proposal = await db.getProposalById(input.id, ctx.user.openId);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND", message: "Коммерческое предложение не найдено" });
      return proposal;
    }),
    create: protectedProcedure.input(proposalInputSchema).mutation(async ({ input, ctx }) => {
      const farm = await db.getFarmById(input.farmId, ctx.user.openId);
      if (!farm) throw new TRPCError({ code: "NOT_FOUND", message: "Сначала выберите существующее хозяйство" });
      const proposal = await db.createProposal(input, ctx.user.openId);
      if (!proposal) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Не удалось сохранить коммерческое предложение" });
      return proposal;
    }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(proposalStatuses) })).mutation(async ({ input, ctx }) => {
      const proposal = await db.updateProposalStatus(input.id, input.status, ctx.user.openId);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND", message: "Коммерческое предложение не найдено" });
      return proposal;
    }),
  }),
});

export type AppRouter = typeof appRouter;
