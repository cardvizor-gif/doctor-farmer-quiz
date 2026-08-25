import { COOKIE_NAME } from "@shared/const";
import { farmInputSchema, proposalInputSchema, proposalStatuses } from "@shared/farm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  farms: router({
    list: publicProcedure.query(() => db.listFarms()),
    byId: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      const farm = await db.getFarmById(input.id);
      if (!farm) throw new TRPCError({ code: "NOT_FOUND", message: "Хозяйство не найдено" });
      return farm;
    }),
    create: publicProcedure.input(farmInputSchema).mutation(async ({ input }) => {
      const farm = await db.createFarm(input);
      if (!farm) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Не удалось создать карточку хозяйства" });
      return farm;
    }),
    update: publicProcedure.input(farmInputSchema.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const { id, ...farmInput } = input;
      const farm = await db.updateFarm(id, farmInput);
      if (!farm) throw new TRPCError({ code: "NOT_FOUND", message: "Хозяйство не найдено" });
      return farm;
    }),
    remove: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.removeFarm(input.id)),
  }),
  proposals: router({
    list: publicProcedure.input(z.object({ farmId: z.number().int().positive().optional() }).optional()).query(({ input }) => db.listProposals(input?.farmId)),
    byId: publicProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      const proposal = await db.getProposalById(input.id);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND", message: "Коммерческое предложение не найдено" });
      return proposal;
    }),
    create: publicProcedure.input(proposalInputSchema).mutation(async ({ input }) => {
      const farm = await db.getFarmById(input.farmId);
      if (!farm) throw new TRPCError({ code: "NOT_FOUND", message: "Сначала выберите существующее хозяйство" });
      const proposal = await db.createProposal(input);
      if (!proposal) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Не удалось сохранить коммерческое предложение" });
      return proposal;
    }),
    updateStatus: publicProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(proposalStatuses) })).mutation(async ({ input }) => {
      const proposal = await db.updateProposalStatus(input.id, input.status);
      if (!proposal) throw new TRPCError({ code: "NOT_FOUND", message: "Коммерческое предложение не найдено" });
      return proposal;
    }),
  }),
});

export type AppRouter = typeof appRouter;
