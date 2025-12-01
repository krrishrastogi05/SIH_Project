// backend/src/modules/auth/phone-login.schema.ts
import { z } from "zod";

// Phone-based login schema for beneficiaries
export const phoneLoginSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot be more than 15 digits"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export type PhoneLoginInput = z.infer<typeof phoneLoginSchema>;
