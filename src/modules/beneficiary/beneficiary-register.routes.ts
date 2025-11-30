import { Router } from "express";
import { BeneficiaryRegisterController } from "./beneficiary-register.controller.js";

const router = Router();

// POST /api/beneficiary/register
router.post("/register", BeneficiaryRegisterController.register);

export default router;
