// backend/src/modules/auth/auth.controller.ts
import { Request, Response } from "express";
import AuthService from "./auth.service.js";
import { loginSchema } from "./auth.schema.js";
import { phoneLoginSchema } from "./phone-login.schema.js";

const authService = new AuthService();

export class AuthController {
  // ================= REGISTER (existing) =================
  static async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        message: "Registered",
        user: result.user,
        token: result.token,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  // ================= EMAIL LOGIN (generic) =================
  static async login(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const result = await authService.login(parsed.data);

      if ((result as any).blocked) {
        return res.status(403).json({
          message: "VERIFICATION_REQUIRED",
          status: (result as any).status,
          remarks: (result as any).remarks,
        });
      }

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        message: "Logged in",
        user: result.user,
        token: result.token,
      });
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  }

  // ================= PHONE LOGIN (beneficiary) =================
  static async loginWithPhone(req: Request, res: Response) {
    try {
      const parsed = phoneLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const result = await authService.loginWithPhone(parsed.data);

      if ((result as any).blocked) {
        return res.status(403).json({
          success: false,
          message: "VERIFICATION_REQUIRED",
          status: (result as any).status,
          remarks: (result as any).remarks,
        });
      }

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        message: "Logged in",
        data: result.user,
        token: result.token,
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: error.message || "Invalid phone or password",
      });
    }
  }

  // ================= NEW: OFFICER LOGIN (email) =================
  static async loginOfficer(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const result = await authService.login(parsed.data);

      // Ensure only OFFICER or ADMIN can use this endpoint
      if (
        !result.user ||
        (result.user.role !== "OFFICER" && result.user.role !== "ADMIN")
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied: Not an officer account",
        });
      }

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        message: "Officer login successful",
        data: result.user,
        token: result.token,
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        message: error.message || "Invalid email or password",
      });
    }
  }
}
