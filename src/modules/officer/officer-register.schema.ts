// backend/src/modules/officer/officer-register.schema.ts
import { z } from "zod";

export const officerRegisterSchema = z.object({
  // Basic Info
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .length(10, "Phone must be 10 digits")
    .regex(/^\d+$/, "Phone must contain only numbers"),
  password: z.string().min(6, "Password must be at least 6 characters"),

  // Location
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
});

export type OfficerRegisterInput = z.infer<typeof officerRegisterSchema>;
