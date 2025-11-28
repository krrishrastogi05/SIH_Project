import { z } from "zod";

export const submitVerificationSchema = z.object({
  verificationId: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
  remarks: z.string().optional(),
  documents: z.record(z.string().url()).optional() // cloudinary URLs
});

export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;
