import { Request, Response } from "express";
import {prisma} from "../../db/prisma.js";

export class SchemesController {

  // --- 1. GET ALL SCHEMES (Public Catalog) ---
  // frontend can call: /api/schemes?state=Uttar%20Pradesh&type=education
  static async getAllSchemes(req: Request, res: Response) {
    try {
      const { state, type } = req.query;

      const whereClause: any = {};

      // Optional Filters
      if (state && typeof state === "string" && state !== "All") {
        whereClause.state = state;
      }
      if (type && typeof type === "string") {
        whereClause.schemeType = type;
      }

      const schemes = await prisma.scheme.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }, // Newest first
        select: {
          id: true,
          title: true,
          schemeType: true,
          amount: true,
          state: true,
          // We exclude 'baseCriteria' here to keep the list lightweight
        }
      });

      return res.json(schemes);
    } catch (err: any) {
      return res.status(500).json({ message: "Failed to fetch schemes" });
    }
  }

  // --- 2. GET SINGLE SCHEME DETAILS ---
  static async getSchemeById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const scheme = await prisma.scheme.findUnique({
        where: { id }
      });

      if (!scheme) {
        return res.status(404).json({ message: "Scheme not found" });
      }

      return res.json(scheme);
    } catch (err: any) {
      return res.status(500).json({ message: "Error fetching scheme details" });
    }
  }
}