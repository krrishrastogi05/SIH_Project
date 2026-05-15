import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Missing token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey") as any;
    req.user = decoded; // Contains { id, role }

    return next();

  } catch (err: any) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};