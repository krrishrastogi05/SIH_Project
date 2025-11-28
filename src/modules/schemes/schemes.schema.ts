import { z } from "zod";

export const listSchemesQuerySchema = z.object({
  state: z.string().optional(),
  district: z.string().optional(),
  block: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
});

export const schemeIdParamSchema = z.object({
  id: z.string().min(1)
});

// Can be reused later by poster/officer modules
export const createSchemeSchema = z.object({
  posterId: z.string().min(1),
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

export type ListSchemesQueryInput = z.infer<typeof listSchemesQuerySchema>;
export type SchemeIdParamInput = z.infer<typeof schemeIdParamSchema>;
export type CreateSchemeInput = z.infer<typeof createSchemeSchema>;
