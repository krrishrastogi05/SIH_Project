import { Router } from "express";
import { BeneficiaryController } from "./beneficiary.controller.js";
import { BeneficiaryRegisterController } from "./beneficiary-register.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleCheck } from "../../middlewares/roles.js";
import { uploadDocuments } from "../../middlewares/fileUpload.js";

const router = Router();

// Public route - registration with file uploads
router.post(
  "/register",
  uploadDocuments.fields([
    { name: "casteCert", maxCount: 1 },
    { name: "incomeCert", maxCount: 1 },
    { name: "profileImage", maxCount: 1 },
  ]),
  BeneficiaryRegisterController.register
);

// Protected routes below
router.use(authMiddleware);
router.use(roleCheck(["BENEFICIARY"]));

router.get("/dashboard", (req, res) => BeneficiaryController.dashboard(req, res));
router.get("/eligible", (req, res) => BeneficiaryController.eligible(req, res));
router.post("/apply", (req, res) => BeneficiaryController.apply(req, res));
router.post("/upload-docs", (req, res) => BeneficiaryController.uploadDocs(req, res));

export default router;

