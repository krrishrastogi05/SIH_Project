import { z } from "zod";
import { SchemeStatus } from "@prisma/client";

const baseEducationSchema = z.object({
  incomeLevel: z.string().min(1),
  minEducation: z.string().min(1),
});

const baseHousingSchema = z.object({
  incomeLevel: z.string().min(1),
  criteria: z.string(),
});

const baseEmploymentSchema = z.object({
  minEducation: z.string().min(1),
  ageLimit: z.string().min(1),
});

const baseFinancialSchema = z.object({
  incomeLevel: z.string().min(1),
  purpose: z.string(),
});

const extraFieldsSchema = z.object({
  textFields: z.array(z.object({ id: z.number(), label: z.string() })),
  fileFields: z.array(z.object({ id: z.number(), label: z.string() })),
});

const locationSchema = z.object({
  state: z.string().min(1),
  district: z.string().min(1),
  pincode: z.string().min(1),
});

export const createSchemeSchema = z.discriminatedUnion("schemeType", [
  z.object({
    schemeId: z.string().min(1),
    title: z.string().min(1),
    schemeType: z.literal("education"),
    baseCriteria: baseEducationSchema,
    extraFields: extraFieldsSchema,
    location: locationSchema,
  }),
  z.object({
    schemeId: z.string().min(1),
    title: z.string().min(1),
    schemeType: z.literal("housing"),
    baseCriteria: baseHousingSchema,
    extraFields: extraFieldsSchema,
    location: locationSchema,
  }),
  z.object({
    schemeId: z.string().min(1),
    title: z.string().min(1),
    schemeType: z.literal("employment"),
    baseCriteria: baseEmploymentSchema,
    extraFields: extraFieldsSchema,
    location: locationSchema,
  }),
  z.object({
    schemeId: z.string().min(1),
    title: z.string().min(1),
    schemeType: z.literal("financial"),
    baseCriteria: baseFinancialSchema,
    extraFields: extraFieldsSchema,
    location: locationSchema,
  }),
]);

// Add this new schema for validating query parameters
export const listSchemesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("10"),
    schemeType: z.string().optional(),
    state: z.string().optional(),
    district: z.string().optional(),
  }),
});

export const schemeIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type CreateSchemeInput = z.infer<typeof createSchemeSchema>;

export const updateSchemeStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(SchemeStatus),
  }),
});

export type UpdateSchemeStatusInput = z.infer<
  typeof updateSchemeStatusSchema
>["body"];
