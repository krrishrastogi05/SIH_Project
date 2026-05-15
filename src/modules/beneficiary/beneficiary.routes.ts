import { Router } from "express";
import { BeneficiaryController } from "./beneficiary.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";

const router = Router();

// Protect all routes
router.use(authMiddleware);

// Profile Management
router.get("/profile", BeneficiaryController.getProfile);
router.put("/profile", BeneficiaryController.updateProfile); // Using PUT for updates

// Dashboard
router.get("/dashboard", BeneficiaryController.dashboard);

export default router;