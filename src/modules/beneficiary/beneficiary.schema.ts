// backend/src/modules/beneficiary/beneficiary.schema.ts
import { z } from "zod";

// Schema for the body of the 'apply' request
export const applySchema = z.object({
  schemeId: z.string({ required_error: "Scheme ID is required" }),
  // applicationData will contain the dynamic form fields
  applicationData: z.record(z.any()).optional(),
});

// Schema for the body of the 'uploadDocs' request
export const uploadDocsSchema = z.object({
  schemeId: z.string({ required_error: "Scheme ID is required" }),
  documents: z.array(
    z.object({
      name: z.string(), // e.g., "Aadhar Card"
      url: z.string().url(), // The URL from your file upload service (e.g., Cloudinary)
    })
  ),
});

export type ApplyInput = z.infer<typeof applySchema>;
export type UploadDocsInput = z.infer<typeof uploadDocsSchema>;
