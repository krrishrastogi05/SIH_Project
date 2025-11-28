import { z } from "zod";

export const approveRejectSchemeSchema = z.object({
  schemeId: z.string().min(1),
  remarks: z.string().optional()
});

export const approveRejectVerificationSchema = z.object({
  verificationId: z.string().min(1),
  remarks: z.string().optional()
});

export type ApproveRejectSchemeInput = z.infer<typeof approveRejectSchemeSchema>;
export type ApproveRejectVerificationInput = z.infer<typeof approveRejectVerificationSchema>;
