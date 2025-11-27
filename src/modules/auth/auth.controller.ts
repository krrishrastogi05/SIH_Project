import { Request, Response } from "express";
import { AuthService } from "./auth.service.js"; // Added .js
import { registerSchema, loginSchema } from "./auth.schema.js"; // Added .js

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const parse = registerSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json(parse.error);
      }

      const { user, token } = await AuthService.register(parse.data);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(201).json({ message: "Registered", user, token });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const parse = loginSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json(parse.error);
      }

      const result = await AuthService.login(parse.data);

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        message: "Logged in",
        user: result.user,
        token: result.token
      });
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  }
}