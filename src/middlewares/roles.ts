import { Request, Response, NextFunction } from "express";

export const roleCheck = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden: Access denied" });
      }

      return next();
    } catch (err) {
      return res.status(403).json({ message: "Access denied" });
    }
  };
};
