// backend/src/modules/verification/verification.controller.ts

import { Request, Response } from "express";
import { VerificationService } from "./verification.service.js";
import { uploadKycSchema, aadhaarVerifySchema } from "./verification.schema.js";

export class VerificationController {

  static async uploadKyc(req: Request, res: Response) {
    try {
      const parsed = uploadKycSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json(parsed.error);

      const userId = req.user.id;
      const updated = await VerificationService.uploadKyc(userId, parsed.data);

      return res.status(200).json({
        message: "KYC submitted. Awaiting enumerator verification.",
        data: updated
      });

    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  static async aadhaarVerify(req: Request, res: Response) {
    try {
      const parsed = aadhaarVerifySchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json(parsed.error);

      const result = await VerificationService.aadhaarAutoVerify(
        req.user.id,
        parsed.data
      );

      if (!result.success)
        return res.status(404).json({ message: "Aadhaar not found" });

      return res.status(200).json({
        message: "Verified successfully using Aadhaar",
        data: result.user
      });

    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  static async status(req: Request, res: Response) {
    try {
      const status = await VerificationService.status(req.user.id);

      return res.status(200).json({
        message: "Verification status fetched",
        data: status
      });

    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}
