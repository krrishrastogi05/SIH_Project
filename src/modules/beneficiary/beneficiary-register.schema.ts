import { z } from "zod";

export const beneficiaryRegisterSchema = z.object({
  // Basic Info
  name: z.string().min(2, "Name must be at least 2 characters"),
  aadhaar: z.string().length(12, "Aadhaar must be 12 digits").regex(/^\d+$/, "Aadhaar must contain only numbers"),
  age: z.number().int().min(18, "Must be at least 18 years old").max(100),
  gender: z.enum(["Male", "Female", "Other"]),
  phone: z.string().length(10, "Phone must be 10 digits").regex(/^\d+$/, "Phone must contain only numbers"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  
  // Address
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
  
  // Financial Info
  income: z.number().int().min(0, "Income cannot be negative"),
  bankAccount: z.string().min(9, "Invalid bank account number"),
  ifsc: z.string().length(11, "IFSC code must be 11 characters"),
  
  // Education
  educationLevel: z.enum(["MATRICULATION", "HIGHER_SECONDARY", "GRADUATION", "POST_GRADUATION"]),
  
  // Optional Documents - can be undefined or empty string
  casteCert: z.string().url().optional().or(z.literal("")).transform(val => val || undefined),
  incomeCert: z.string().url().optional().or(z.literal("")).transform(val => val || undefined),
  profileImage: z.string().url().optional().or(z.literal("")).transform(val => val || undefined),
});

export type BeneficiaryRegisterInput = z.infer<typeof beneficiaryRegisterSchema>;
