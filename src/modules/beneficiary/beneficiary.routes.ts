// backend/src/modules/beneficiary/beneficiary.routes.ts

import { Router } from "express";
import { BeneficiaryController } from "./beneficiary.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleCheck } from "../../middlewares/roles.js";

const router = Router();

router.use(authMiddleware);
router.use(roleCheck(["BENEFICIARY"]));

router.get("/dashboard", (req, res) => BeneficiaryController.dashboard(req, res));
router.get("/eligible", (req, res) => BeneficiaryController.eligible(req, res));
router.post("/apply", (req, res) => BeneficiaryController.apply(req, res));
router.post("/upload-docs", (req, res) => BeneficiaryController.uploadDocs(req, res));

export default router;
