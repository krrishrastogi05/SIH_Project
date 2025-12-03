import { Router } from "express";
import { OfficerController } from "./officer.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleCheck } from "../../middlewares/roles.js";

const router = Router();

// router.use(authMiddleware);
// router.use(roleCheck(["OFFICER", "ADMIN"]));

router.get("/schemes/pending", OfficerController.getPending);
router.post("/schemes/approve", OfficerController.approve);
router.post("/schemes/reject", OfficerController.reject);

export default router;