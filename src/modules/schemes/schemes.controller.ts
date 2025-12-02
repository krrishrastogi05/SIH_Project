import type { Request, Response, NextFunction } from "express";
import { SchemeService } from "./schemes.service.js";
import { CreateSchemeInput } from "./schemes.schema.js";
import { SchemeStatus } from "@prisma/client";

export class SchemeController {
  static async createSchemeHandler(
    req: Request<{}, {}, CreateSchemeInput>,
    res: Response
  ) {
    try {
      const scheme = await SchemeService.createScheme(req.body);
      return res.status(201).json(scheme);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error creating scheme" });
    }
  }

  static async listPublic(req: Request, res: Response) {
    try {
      const parsed = listSchemesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          name: "ZodError",
          issues: parsed.error.issues,
        });
      }

      const data = await SchemeService.listPublicSchemes(parsed.data);

      return res.status(200).json({
        message: "Schemes fetched successfully",
        data,
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        message: err.message || "Internal Server Error",
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const parsed = schemeIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({
          name: "ZodError",
          issues: parsed.error.issues,
        });
      }

      const scheme = await SchemeService.getSchemeById(parsed.data.id);
      if (!scheme) {
        return res.status(404).json({
          message: "Scheme not found",
        });
      }

      return res.status(200).json({
        message: "Scheme fetched successfully",
        data: scheme,
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        message: err.message || "Internal Server Error",
      });
    }
  }

  static async updateSchemeStatus(
    req: Request<{ id: string }, {}, { status: SchemeStatus }>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const schemeId = req.params.id;
      const { status } = req.body;

      const scheme = await SchemeService.updateSchemeStatus(schemeId, status);
      return res
        .status(200)
        .json({ message: `Scheme status updated to ${scheme.status}`, scheme });
    } catch (err) {
      next(err);
    }
  }
}
