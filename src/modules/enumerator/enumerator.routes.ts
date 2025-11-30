// backend/src/modules/enumerator/enumerator.routes.ts

import { Router } from "express";
import { EnumeratorController } from "./enumerator.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { roleCheck } from "../../middlewares/roles.js";

const router = Router();

router.use(authMiddleware);
router.use(roleCheck(["ENUMERATOR"]));

router.get("/tasks", (req, res) => { EnumeratorController.getTasks(req, res); });
router.post("/submit", (req, res) => { EnumeratorController.submit(req, res); });

export default router;
