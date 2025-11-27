import { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.schema.js";

export class AuthController {
  static async register(req: Request, res: Response) {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error);

    const user = await AuthService.register(parse.data);
    if (!user) return res.status(400).json({ message: "User exists" });

    return res.json({ message: "Registered", user });
  }

  static async login(req: Request, res: Response) {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json(parse.error);

    const result = await AuthService.login(parse.data);
    if (!result) return res.status(401).json({ message: "Invalid credentials" });

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      message: "Logged in",
      user: result.user
    });
  }
}
