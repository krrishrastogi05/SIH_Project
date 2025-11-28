import type { Request, Response } from "express";
import { PosterService } from "./poster.service.js";
import { createPosterSchema, createSchemeSchema } from "./poster.schema.js"

export class PosterController {
  static async createPoster(req: Request, res: Response) {
    try {
      const parsed = createPosterSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ name: "ZodError", issues: parsed.error.issues });
      }

      const poster = await PosterService.createPoster(parsed.data);
      return res.status(201).json({ message: "Poster created", data: poster });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
  }

  static async createScheme(req: Request, res: Response) {
    try {
      const parsed = createSchemeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ name: "ZodError", issues: parsed.error.issues });
      }

      // poster identity: either provided in body or derived from req.user (if poster role)
      const posterId = (req.user && req.user.role === "POSTER") ? req.user.id : req.body.posterId;
      if (!posterId) return res.status(400).json({ message: "posterId required" });

      const scheme = await PosterService.createScheme(posterId, parsed.data);
      return res.status(201).json({ message: "Scheme created (pending approval)", data: scheme });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
  }

  static async mySchemes(req: Request, res: Response) {
    try {
      const posterId = req.user?.id;
      if (!posterId) return res.status(401).json({ message: "Unauthorized" });

      const page = Number(req.query.page ?? 1);
      const pageSize = Number(req.query.pageSize ?? 20);

      const result = await PosterService.listPosterSchemes(posterId, page, pageSize);
      return res.status(200).json({ message: "Poster schemes fetched", data: result });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
  }

  static async getPoster(req: Request, res: Response) {
    try {
      const posterId = req.params.id;
      const poster = await PosterService.getPosterById(posterId);
      if (!poster) return res.status(404).json({ message: "Poster not found" });
      return res.status(200).json({ message: "Poster fetched", data: poster });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
  }
}
