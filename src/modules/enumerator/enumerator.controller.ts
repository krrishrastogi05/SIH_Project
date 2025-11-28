import type { Request, Response } from "express";
import { EnumeratorService } from "./enumerator.service.js";
import { submitVerificationSchema } from "./enumerator.schema.js";

export class EnumeratorController {
  static async getTasks(req: Request, res: Response) {
    try {
      // FIX 1: Cast req to any to access 'user'
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized"
        });
      }

      const tasks = await EnumeratorService.getTasks(userId);

      return res.status(200).json({
        message: "Enumerator tasks fetched successfully",
        data: tasks
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        message: err.message || "Internal Server Error"
      });
    }
  }

  static async submit(req: Request, res: Response) {
    try {
      const parsed = submitVerificationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          name: "ZodError",
          issues: parsed.error.issues
        });
      }

      // FIX 1: Cast req to any here as well
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized"
        });
      }

      try {
        const updated = await EnumeratorService.submitVerification(
          userId,
          parsed.data
        );

        if (!updated) {
          return res.status(404).json({
            message: "Verification not found"
          });
        }

        return res.status(200).json({
          message: "Verification submitted successfully",
          data: updated
        });
      } catch (innerErr: any) {
        if (innerErr instanceof Error &&
          innerErr.message === "This verification is assigned to another enumerator") {
          return res.status(403).json({
            message: innerErr.message
          });
        }

        throw innerErr;
      }
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        message: err.message || "Internal Server Error"
      });
    }
  }
}