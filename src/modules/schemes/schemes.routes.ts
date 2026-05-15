import { Router } from "express";
import { SchemesController } from "./schemes.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";

const router = Router();

// Require Login for all
router.use(authMiddleware);

// GET /api/schemes
router.get("/", SchemesController.getAllSchemes);

// GET /api/schemes/:id
router.get("/:id", SchemesController.getSchemeById);

export default router;