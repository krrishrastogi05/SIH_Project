import { z } from "zod";

export const createPosterSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["GOV", "NGO"]),
  phone: z.string().min(6),
  email: z.string().email().optional(),
  state: z.string().min(1).optional(),
  district: z.string().min(1).optional(),
  block: z.string().min(1).optional()
});

export const createSchemeSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  incomeRequired: z.boolean(),
  minIncome: z.number().int().nonnegative().nullable().optional(),
  maxIncome: z.number().int().positive().nullable().optional(),
  regionType: z.string().min(1),
  state: z.string().min(1),
  district: z.string().min(1),
  block: z.string().min(1),
  jobType: z.string().min(1),
  paymentInfo: z.record(z.any()).optional(),
  additionalDocs: z.record(z.any()).optional()
});

export type CreatePosterInput = z.infer<typeof createPosterSchema>;
export type CreateSchemeInput = z.infer<typeof createSchemeSchema>;
