import { z } from "zod";

export const dealStages = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "sent",
  "negotiation",
  "confirmed",
  "won",
  "lost",
] as const;

export const dealStageSchema = z.enum(dealStages);

export const dealInputSchema = z.object({
  farmId: z.number().int().positive(),
  workspaceId: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(2, "Укажите название сделки").max(255),
  season: z.string().trim().max(32).nullable().optional(),
  crop: z.string().trim().max(160).nullable().optional(),
  area: z.coerce.number().min(0).max(10_000_000).default(0),
  potentialValue: z.coerce.number().min(0).max(1_000_000_000).default(0),
  probability: z.number().int().min(0).max(100).default(50),
  stage: dealStageSchema.default("new"),
  nextAction: z.string().trim().max(2_000).nullable().optional(),
  nextActionAt: z.coerce.date().nullable().optional(),
  lostReason: z.string().trim().max(255).nullable().optional(),
});

export type DealInput = z.infer<typeof dealInputSchema>;
export type DealStage = (typeof dealStages)[number];
