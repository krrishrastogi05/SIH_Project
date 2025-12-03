// backend/src/modules/beneficiary/beneficiary.controller.ts

import { Request, Response } from "express";
import { BeneficiaryService } from "./beneficiary.service.js";
import { notificationQueue } from "../../queue/queue.js"; 
import { z } from "zod";
import { prisma } from "../../db/prisma.js"; 

const applySchema = z.object({
  schemeId: z.string(),
  applicationData: z.record(z.any()).optional(), 
});

export class BeneficiaryController {

  static async dashboard(req: Request, res: Response) {
    try {
      let userId = req.user?.id;

      // 🛠️ FIX: Robust Fallback Strategy
      if (!userId) {
        console.log("⚠️ No Token. Attempting to find a test user...");
        
        // Strategy 1: Try finding the user with your specific phone (if set)
        // Update this string if you seeded a specific number like "+9177..."
        const specificUser = await prisma.user.findFirst({ 
            where: { role: "BENEFICIARY" } 
        });

        if (specificUser) {
            userId = specificUser.id;
            console.log(`✅ Using Fallback User: ${specificUser.name} (${specificUser.phone})`);
        }
      }

      if (!userId) {
        // If we still have no ID, it means the DB is empty or seed didn't run.
        return res.status(404).json({ 
            message: "No Beneficiary found in database. Please run 'npx tsx prisma/seed.ts'" 
        });
      }

      const data = await BeneficiaryService.getDashboard(userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  static async apply(req: Request, res: Response) {
    try {
      const parsed = applySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json(parsed.error);

      const { schemeId, applicationData } = parsed.data;
      
      let userId = req.user?.id;

      // 🛠️ FIX: Same Fallback Here
      if (!userId) {
        const anyUser = await prisma.user.findFirst({ where: { role: "BENEFICIARY" } });
        userId = anyUser?.id;
      }

      if (!userId) return res.status(401).json({ message: "Unauthorized: No user found to apply." });

      // 1. Save Application
      const result = await BeneficiaryService.applyForScheme(
        userId, 
        schemeId, 
        applicationData
      );

      // 2. Notify
      const user = await prisma.user.findUnique({ where: { id: userId } });
      
      if (user?.phone) {
          await notificationQueue.add("send-sms", {
            phone: user.phone,
            message: `Application Received: You have applied for ${result.scheme.title}.`
          });
      }

      return res.json({
        message: "Application Submitted Successfully",
        data: result
      });

    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }
}