import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import {
  createSchemeSchema,
  updateSchemeStatusSchema,
  listSchemesQuerySchema, // <-- Import the new schema
} from "./schemes.schema.js";
import { SchemeController } from "./schemes.controller.js";

const router = Router();

// Route to create a new scheme
router.post(
  "/",
  validate(createSchemeSchema),
  SchemeController.createSchemeHandler
);

// Update the GET route to use the new validation schema
router.get("/", validate(listSchemesQuerySchema), (req, res) =>
  SchemeController.listPublic(req, res)
);

// Route for an officer to update a scheme's status
router.patch(
  "/:id/status",
  validate(updateSchemeStatusSchema),
  SchemeController.updateSchemeStatus
);

export default router;
