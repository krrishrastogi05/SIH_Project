import { Request, Response } from "express";
import { BeneficiaryService } from "./beneficiary.service.js";
import { applySchema, uploadDocsSchema } from "./beneficiary.schema.js";

export class BeneficiaryController {
  static async dashboard(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const data = await BeneficiaryService.getDashboard(userId);

      return res.status(200).json({
        message: "Beneficiary dashboard loaded",
        data
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  static async eligible(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const data = await BeneficiaryService.getEligibleSchemes(userId);

      return res.status(200).json({
        message: "Eligible schemes loaded",
        data
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  static async apply(req: Request, res: Response) {
    try {
      const parse = applySchema.safeParse(req.body);
      if (!parse.success)
        return res.status(400).json(parse.error);

      const userId = req.user.id;
      const updated = await BeneficiaryService.apply(userId, parse.data);

      if (!updated) {
        return res.status(400).json({
          message: "You are not eligible for this scheme"
        });
      }

      return res.status(200).json({
        message: "Application submitted",
        data: updated
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  static async uploadDocs(req: Request, res: Response) {
    try {
      const parse = uploadDocsSchema.safeParse(req.body);
      if (!parse.success)
        return res.status(400).json(parse.error);

      const userId = req.user.id;
      const data = await BeneficiaryService.uploadDocuments(userId, parse.data);

      return res.status(200).json({
        message: "Documents uploaded successfully",
        data
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}
