import { Router } from "express";
import { OfficerController } from "./officer.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleCheck } from "../../middlewares/roles.js";

const router = Router();

router.use(authMiddleware);
router.use(roleCheck(["OFFICER", "ADMIN"]));

router.get("/schemes/pending", (req, res) =>
  OfficerController.getPendingSchemes(req, res)
);
router.post("/schemes/approve", (req, res) =>
  OfficerController.approveScheme(req, res)
);
router.post("/schemes/reject", (req, res) =>
  OfficerController.rejectScheme(req, res)
);

router.get("/verifications/pending", (req, res) =>
  OfficerController.getPendingVerifications(req, res)
);
router.post("/verifications/approve", (req, res) =>
  OfficerController.approveVerification(req, res)
);
router.post("/verifications/reject", (req, res) =>
  OfficerController.rejectVerification(req, res)
);

export default router;
