// backend/src/modules/enumerator/enumerator.controller.ts

import type { Request, Response } from "express";
import { EnumeratorService } from "./enumerator.service.js";
import { submitVerificationSchema } from "./enumerator.schema.js";

export class EnumeratorController {

  // ----------------------------------------------
  // GET TASKS
  // ----------------------------------------------
  static async getTasks(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const tasks = await EnumeratorService.getTasks(userId);

      return res.status(200).json({
        message: "Enumerator tasks fetched successfully",
        data: tasks
      });

    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  }

  // ----------------------------------------------
  // SUBMIT VERIFICATION
  // ----------------------------------------------
  static async submit(req: Request, res: Response) {
    try {
      const parsed = submitVerificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          name: "ZodError",
          issues: parsed.error.issues
        });
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const updated = await EnumeratorService.submitVerification(
        userId,
        parsed.data
      );

      if (!updated) {
        return res.status(404).json({ message: "Verification not found" });
      }

      return res.status(200).json({
        message: "Verification submitted successfully",
        data: updated
      });

    } catch (err: any) {
      if (err.message.includes("assigned to another enumerator")) {
        return res.status(403).json({ message: err.message });
      }

      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  }
}
