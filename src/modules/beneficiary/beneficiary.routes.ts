import { Router } from "express";
import { BeneficiaryController } from "./beneficiary.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleCheck } from "../../middlewares/roles.js";

const router = Router();

// Routes protected by Login & Role
// router.use(authMiddleware);
// router.use(roleCheck(["BENEFICIARY"]));

router.get("/dashboard", BeneficiaryController.dashboard);
router.post("/apply", BeneficiaryController.apply);

export default router;