import { Router } from "express";
import { validate } from "../../middlewares/validate.js";
import { createSchemeSchema } from "./schemes.schema.js";
import { SchemeController } from "./schemes.controller.js";

const router = Router();

// Route to create a new scheme
router.post(
  "/",
  validate(createSchemeSchema),
  SchemeController.createSchemeHandler
);

// Public routes – no auth required
router.get("/", (req, res) => SchemeController.listPublic(req, res));
router.get("/:id", (req, res) => SchemeController.getById(req, res));

export default router;
