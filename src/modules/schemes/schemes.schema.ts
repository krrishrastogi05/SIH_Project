import { z } from "zod";

// Schema for Dynamic Fields (Text/Files)
const extraFieldsSchema = z.object({
  textFields: z.array(z.object({ 
    id: z.number(), 
    label: z.string() 
  })),
  fileFields: z.array(z.object({ 
    id: z.number(), 
    label: z.string() 
  })),
});

// Main Create Scheme Schema
export const createSchemeSchema = z.object({
  schemeId: z.string().min(1, "Scheme Code is required"),
  title: z.string().min(1, "Title is required"),
  schemeType: z.string(), // education, housing, etc.
  
  baseCriteria: z.record(z.any()), // Flexible JSON for criteria
  extraFields: extraFieldsSchema,  // The dynamic form config
  
  location: z.object({
    state: z.string(),
    district: z.string(),
    pincode: z.string().optional(),
  }),
});

export type CreateSchemeInput = z.infer<typeof createSchemeSchema>;