// backend/src/modules/officer/officer-register.controller.ts
import { Request, Response } from "express";
import { OfficerRegisterService } from "./officer-register.service.js";
import { officerRegisterSchema } from "./officer-register.schema.js";

export class OfficerRegisterController {
  static async register(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedData = officerRegisterSchema.parse(req.body);

      // Register officer
      const user = await OfficerRegisterService.register(validatedData);

      res.status(201).json({
        success: true,
        message: "Officer registration successful",
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

      // Duplicate email/phone error
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
