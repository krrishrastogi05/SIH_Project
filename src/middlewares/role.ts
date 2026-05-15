import { Request, Response, NextFunction } from "express";

/**
 * Middleware to restrict access based on user roles.
 * Usage: router.use(roleCheck(["OFFICER"]));
 */
export const roleCheck = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    
    // 1. Safety Check: Ensure Auth Middleware ran first
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: User context missing" });
    }

    // 2. Role Check
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Access denied for role '${req.user.role}'` 
      });
    }

    // 3. User is authorized, proceed
    next();
  };
};