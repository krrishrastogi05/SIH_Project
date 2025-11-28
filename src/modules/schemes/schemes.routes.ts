import { Router } from "express";
import { SchemesController } from "./schemes.controller.js";

const router = Router();

// Public routes – no auth required
router.get("/", (req, res) => SchemesController.listPublic(req, res));
router.get("/:id", (req, res) => SchemesController.getById(req, res));

export default router;
