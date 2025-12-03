import { Router } from "express";
import { z } from "zod";
import { validate } from "../../middlewares/validate.js";
import { OfficerRegisterController } from "./officer-register.controller.js";
// 1. Import the schema with its actual exported name
import { officerRegisterSchema } from "./officer-register.schema.js";

// 2. Create a new schema that wraps the imported one in a 'body' object,
//    as required by the 'validate' middleware.
const validationSchema = z.object({
  body: officerRegisterSchema,
});

const router = Router();

router.post(
  "/",
  // 3. Use the newly created wrapper schema for validation
  validate(validationSchema),
  OfficerRegisterController.register
);

export default router;
