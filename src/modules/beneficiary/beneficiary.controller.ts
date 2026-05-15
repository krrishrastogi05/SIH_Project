import { Request, Response } from "express";
import { prisma } from "../../db/prisma.js";

export class BeneficiaryController {

  // 1. Get Current Profile
  static async getProfile(req: Request, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          phone: true,
          // Profile Fields
          age: true,
          gender: true,
          income: true,
          occupation: true,
          education: true,
          state: true,
          district: true,
          pincode: true,
          bankAccount: true,
          ifsc: true,
        }
      });
      
      if (!user) return res.status(404).json({ message: "User not found" });
      
      return res.json(user);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  // 2. Update Profile (Crucial for Eligibility)
  static async updateProfile(req: Request, res: Response) {
    try {
      const { 
        age, gender, income, occupation, education, 
        state, district, pincode, 
        bankAccount, ifsc 
      } = req.body;

      // Validate basic numbers
      if (age && isNaN(Number(age))) return res.status(400).json({ message: "Age must be a number" });
      if (income && isNaN(Number(income))) return res.status(400).json({ message: "Income must be a number" });

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          age: age ? Number(age) : undefined,
          gender,
          income: income ? Number(income) : undefined,
          occupation,
          education,
          state,
          district,
          pincode,
          bankAccount,
          ifsc
        }
      });

      return res.json({ 
        message: "Profile updated successfully. You can now check for eligible schemes.",
        user: updatedUser 
      });

    } catch (err: any) {
      return res.status(500).json({ message: "Failed to update profile" });
    }
  }

  // 3. Dashboard (Placeholder for next step)
  static async dashboard(req: Request, res: Response) {
    return res.json({ message: "Dashboard logic coming in next step (Eligibility Engine)" });
  }
}