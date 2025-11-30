// backend/src/modules/verification/verification.routes.ts

import { Router } from "express";
import { VerificationController } from "./verification.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";

const router = Router();

router.use(authMiddleware); // all routes require login

router.post("/upload-docs", (req, res) => VerificationController.uploadKyc(req, res));
router.post("/aadhaar-verify", (req, res) => VerificationController.aadhaarVerify(req, res));
router.get("/status", (req, res) => VerificationController.status(req, res));

export default router;
