import type { Request, Response } from "express";
import {
  approveRejectSchemeSchema,
  approveRejectVerificationSchema
} from "./officer.schema.js";
import { OfficerService } from "./officer.service.js";

export class OfficerController {
  static async getPendingSchemes(req: Request, res: Response) {
    try {
      const schemes = await OfficerService.getPendingSchemes();

      return res.status(200).json({
        message: "Pending schemes fetched successfully",
        data: schemes
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        message: err.message || "Internal Server Error"
      });
    }
  }

  static async approveScheme(req: Request, res: Response) {
    try {
      const parsed = approveRejectSchemeSchema.safeParse({
        schemeId: req.body.schemeId,
        remarks: req.body.remarks
      });

      if (!parsed.success) {
        return res.status(400).json({
          name: "ZodError",
          issues: parsed.error.issues
        });
      }

      const officerId = req.user?.id;
      if (!officerId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const updated = await OfficerService.approveScheme(officerId, parsed.data);
      if (!updated) {
        return res.status(404).json({ message: "Scheme not found" });
      }

      return res.status(200).json({
        message: "Scheme approved successfully",
        data: updated
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        message: err.message || "Internal Server Error"
      });
    }
  }

  static async rejectScheme(req: Request, res: Response) {
    try {
      const parsed = approveRejectSchemeSchema.safeParse({
        schemeId: req.body.schemeId,
        remarks: req.body.remarks
      });

      if (!parsed.success) {
        return res.status(400).json({
          name: "ZodError",
          issues: parsed.error.issues
        });
      }

      const officerId = req.user?.id;
      if (!officerId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const updated = await OfficerService.rejectScheme(officerId, parsed.data);
      if (!updated) {
        return res.status(404).json({ message: "Scheme not found" });
      }

      return res.status(200).json({
        message: "Scheme rejected successfully",
        data: updated
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        message: err.message || "Internal Server Error"
      });
    }
  }

  static async getPendingVerifications(req: Request, res: Response) {
    try {
      const verifications = await OfficerService.getPendingVerifications();

      return res.status(200).json({
        message: "Pending verifications fetched successfully",
        data: verifications
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        message: err.message || "Internal Server Error"
      });
    }
  }

  static async approveVerification(req: Request, res: Response) {
    try {
      const parsed = approveRejectVerificationSchema.safeParse({
        verificationId: req.body.verificationId,
        remarks: req.body.remarks
      });

      if (!parsed.success) {
        return res.status(400).json({
          name: "ZodError",
          issues: parsed.error.issues
        });
      }

      const officerId = req.user?.id;
      if (!officerId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const updated = await OfficerService.approveVerification(
        officerId,
        parsed.data
      );

      if (!updated) {
        return res.status(404).json({ message: "Verification not found" });
      }

      return res.status(200).json({
        message: "Verification approved successfully",
        data: updated
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        message: err.message || "Internal Server Error"
      });
    }
  }

  static async rejectVerification(req: Request, res: Response) {
    try {
      const parsed = approveRejectVerificationSchema.safeParse({
        verificationId: req.body.verificationId,
        remarks: req.body.remarks
      });

      if (!parsed.success) {
        return res.status(400).json({
          name: "ZodError",
          issues: parsed.error.issues
        });
      }

      const officerId = req.user?.id;
      if (!officerId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const updated = await OfficerService.rejectVerification(
        officerId,
        parsed.data
      );

      if (!updated) {
        return res.status(404).json({ message: "Verification not found" });
      }

      return res.status(200).json({
        message: "Verification rejected successfully",
        data: updated
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        message: err.message || "Internal Server Error"
      });
    }
  }
}
