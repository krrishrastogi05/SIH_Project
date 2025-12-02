// backend/src/modules/beneficiary/beneficiary.controller.ts

import { Request, Response, NextFunction} from "express";
import { BeneficiaryService } from "./beneficiary.service.js";
import { applySchema, uploadDocsSchema } from "./beneficiary.schema.js";
export class BeneficiaryController {
  static async dashboard(req: Request, res: Response) {
    try {
      const data = await BeneficiaryService.getDashboard(req.user.id);

      return res.status(200).json({
        message: "Beneficiary dashboard loaded",
        data,
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  static async eligible(req: Request, res: Response) {
    try {
      const data = await BeneficiaryService.getEligibleSchemes(req.user.id);

      return res.status(200).json({
        message: "Eligible schemes loaded",
        data,
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  static async apply(req: Request, res: Response) {
    try {
      const parse = applySchema.safeParse(req.body);
      if (!parse.success) return res.status(400).json(parse.error);

      const updated = await BeneficiaryService.apply(req.user.id, parse.data);
      if (!updated)
        return res
          .status(400)
          .json({ message: "You are not eligible for this scheme" });

      return res.status(200).json({
        message: "Application submitted",
        data: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  static async uploadDocs(req: Request, res: Response) {
    try {
      const parse = uploadDocsSchema.safeParse(req.body);
      if (!parse.success) return res.status(400).json(parse.error);

      const data = await BeneficiaryService.uploadDocuments(
        req.user.id,
        parse.data
      );

      return res.status(200).json({
        message: "Documents uploaded successfully",
        data,
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  static async getMySchemes(req: Request, res: Response, next: NextFunction) {
    try {
      const { beneficiaryId } = req.params;
      const schemes = await BeneficiaryService.getMySchemes(beneficiaryId);
      return res.status(200).json(schemes);
    } catch (err) {
      next(err);
    }
  }

  static async applyForScheme(req: Request, res: Response, next: NextFunction) {
    try {
      const { beneficiaryId, schemeId } = req.params;
      const { applicationData } = req.body;

      const result = await BeneficiaryService.applyForScheme(
        beneficiaryId,
        schemeId,
        applicationData
      );
      return res
        .status(200)
        .json({ message: "Successfully applied for scheme.", result });
    } catch (err) {
      next(err);
    }
  }
}
