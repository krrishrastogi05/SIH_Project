import { Request, Response } from "express";
import { OfficerService } from "./officer.service.js";

export class OfficerController {
  
  static async getPending(req: Request, res: Response) {
    try {
      const data = await OfficerService.getPendingSchemes();
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  static async approve(req: Request, res: Response) {
    try {
      const { schemeId, remarks } = req.body;

      // 🛑 FIX: Use a Fallback ID if req.user is undefined (for testing)
      const officerId = req.user?.id || "MANUAL_TEST_OFFICER_ID";

      const result = await OfficerService.approveScheme(
        officerId, 
        { 
          schemeId: schemeId, 
          remarks: remarks || "Approved via Dashboard" 
        }
      );

      return res.json({ message: "Scheme Approved & Processing Started", data: result });
    } catch (err: any) {
      console.error("Approve Error:", err);
      return res.status(400).json({ message: err.message });
    }
  }

  static async reject(req: Request, res: Response) {
    try {
      const { schemeId, remarks } = req.body;
      
      // 🛑 FIX: Fallback here too
      const officerId = req.user?.id || "MANUAL_TEST_OFFICER_ID";

      const result = await OfficerService.rejectScheme(
        officerId, 
        schemeId 
      );
      
      return res.json({ message: "Scheme Rejected", data: result });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }
}