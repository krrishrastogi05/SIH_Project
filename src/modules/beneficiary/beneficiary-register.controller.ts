import { Request, Response } from "express";
import { BeneficiaryRegisterService } from "./beneficiary-register.service.js";
import { beneficiaryRegisterSchema } from "./beneficiary-register.schema.js";

export class BeneficiaryRegisterController {
  
  static async register(req: Request, res: Response) {
    try {
      // Extract uploaded file URLs from multer
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const casteCertUrl = files?.casteCert?.[0]?.path;
      const incomeCertUrl = files?.incomeCert?.[0]?.path;
      const profileImageUrl = files?.profileImage?.[0]?.path;

      // Merge form data with file URLs
      const requestData = {
        ...req.body,
        casteCert: casteCertUrl,
        incomeCert: incomeCertUrl,
        profileImage: profileImageUrl,
      };

      // Convert string numbers to actual numbers
      requestData.age = parseInt(requestData.age);
      requestData.income = parseInt(requestData.income);

      // Validate request body
      const validatedData = beneficiaryRegisterSchema.parse(requestData);

      // Register beneficiary
      const user = await BeneficiaryRegisterService.register(validatedData);

      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: user,
      });
    } catch (error: any) {
      // Zod validation error
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors,
        });
      }

      // Duplicate aadhaar/phone error
      if (error.message.includes("already registered")) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      // Other errors
      res.status(500).json({
        success: false,
        message: "Registration failed",
        error: error.message,
      });
    }
  }
}
