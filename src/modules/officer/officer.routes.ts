import { Router } from "express";
import { OfficerController } from "./officer.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleCheck } from "../../middlewares/role.js";



const router = Router();

router.use(authMiddleware);
router.use(roleCheck(["OFFICER"]));

router.post("/schemes", OfficerController.createScheme);
router.get("/schemes/:schemeId/applications", OfficerController.getSchemeApplications);
router.post("/payment/initiate", OfficerController.processPayment);

export default router;