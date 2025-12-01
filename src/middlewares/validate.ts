import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // 👇 CORRECTED LINE: Parse req.body, not the entire req object
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.flatten().fieldErrors,
        });
      }
      // For other unexpected errors
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
