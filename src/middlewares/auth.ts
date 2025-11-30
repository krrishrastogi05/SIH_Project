import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: Missing token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    req.user = decoded;

    // BLOCK Beneficiary if not verified
    if (decoded.role === "BENEFICIARY") {
      if (decoded.verificationStatus !== "VERIFIED") {
        return res.status(403).json({
          message: "VERIFICATION_REQUIRED",
          status: decoded.verificationStatus
        });
      }
    }

    return next();

  } catch (err: any) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
