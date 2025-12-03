import { Router } from "express";
import { SchemeController } from "./schemes.controller.js";
// Add authMiddleware if posters need to login
const router = Router();

router.post("/create", SchemeController.create);
router.get("/list", SchemeController.list);

export default router;