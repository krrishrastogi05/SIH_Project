import type { Request, Response } from "express";
import {
  listSchemesQuerySchema,
  schemeIdParamSchema
} from "./schemes.schema.js";
import { SchemesService } from "./schemes.service.js";

export class SchemesController {
  static async listPublic(req: Request, res: Response) {
    try {
      const parsed = listSchemesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          name: "ZodError",
          issues: parsed.error.issues
        });
      }

      const data = await SchemesService.listPublicSchemes(parsed.data);

      return res.status(200).json({
        message: "Schemes fetched successfully",
        data
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        message: err.message || "Internal Server Error"
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const parsed = schemeIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({
          name: "ZodError",
          issues: parsed.error.issues
        });
      }

      const scheme = await SchemesService.getSchemeById(parsed.data.id);
      if (!scheme) {
        return res.status(404).json({
          message: "Scheme not found"
        });
      }

      return res.status(200).json({
        message: "Scheme fetched successfully",
        data: scheme
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        message: err.message || "Internal Server Error"
      });
    }
  }
}

