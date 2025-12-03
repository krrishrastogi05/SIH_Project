import { Request, Response } from "express";
import { SchemeService } from "./schemes.service.js";
import { createSchemeSchema } from "./schemes.schema.js";

export class SchemeController {
  static async create(req: Request, res: Response) {
    try {
      const parsed = createSchemeSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);

      // Pass user ID if Poster is logged in (optional based on your auth)
      const posterId = req.user?.id; 
      const scheme = await SchemeService.createScheme(parsed.data, posterId);
      
      return res.status(201).json({
        message: "Scheme created successfully. Pending Officer Approval.",
        data: scheme
      });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  static async list(req: Request, res: Response) {
    const data = await SchemeService.listPublicSchemes();
    return res.json({ data });
  }
}