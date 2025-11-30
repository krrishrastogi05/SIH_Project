// backend/src/modules/verification/verification.schema.ts
import { z } from "zod";

export const uploadKycSchema = z.object({
  aadhaar: z.string().min(12).max(12),
  casteCert: z.string().url(),
  incomeCert: z.string().url(),
  profileImage: z.string().url(),
  education: z.string().optional(),
  skill: z.string().optional(),
  bankAccount: z.string().optional(),
  ifsc: z.string().optional()
});

export const aadhaarVerifySchema = z.object({
  aadhaar: z.string().min(12).max(12)
});

export type UploadKycInput = z.infer<typeof uploadKycSchema>;
export type AadhaarVerifyInput = z.infer<typeof aadhaarVerifySchema>;
