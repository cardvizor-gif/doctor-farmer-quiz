import { z } from "zod";

export const farmSalesStages = ["lead", "diagnostics", "proposal", "negotiation", "client"] as const;
export const proposalStatuses = ["draft", "sent", "approved", "declined"] as const;

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const farmInputSchema = z.object({
  name: z.string().trim().min(2, "Укажите название хозяйства").max(255),
  district: optionalText(160),
  settlement: optionalText(160),
  contactName: optionalText(160),
  contactRole: optionalText(160),
  phone: optionalText(64),
  email: z.string().trim().email("Укажите корректный e-mail").max(320).nullable().optional().or(z.literal("")),
  totalArea: z.coerce.number().min(0, "Площадь не может быть отрицательной").max(10_000_000).default(0),
  crops: optionalText(1_000),
  technology: optionalText(160),
  salesStage: z.enum(farmSalesStages).default("lead"),
  potentialValue: z.coerce.number().min(0, "Потенциал не может быть отрицательным").max(1_000_000_000).default(0),
  nextAction: optionalText(1_000),
  nextActionAt: optionalText(32),
  notes: optionalText(10_000),
});

export const proposalInputSchema = z.object({
  farmId: z.coerce.number().int().positive(),
  title: z.string().trim().min(2, "Укажите название предложения").max(255),
  crop: z.string().trim().min(2, "Укажите культуру").max(160),
  technology: optionalText(160),
  area: z.coerce.number().positive("Площадь должна быть больше нуля").max(10_000_000),
  costPerHectare: z.coerce.number().min(0).max(1_000_000_000).default(0),
  totalCost: z.coerce.number().min(0).max(1_000_000_000).default(0),
  status: z.enum(proposalStatuses).default("draft"),
  schemeJson: z.string().min(2).max(100_000),
  notes: optionalText(10_000),
});

export type FarmInput = z.infer<typeof farmInputSchema>;
export type ProposalInput = z.infer<typeof proposalInputSchema>;
