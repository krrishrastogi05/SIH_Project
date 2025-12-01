// backend/src/modules/auth/auth.routes.ts
import { Router } from "express";
import { AuthController } from "./auth.controller.js";

const router = Router();

// Registration (if used anywhere)
router.post("/register", (req, res) => AuthController.register(req, res));

// Beneficiary phone login
router.post("/login", (req, res) =>
  AuthController.loginWithPhone(req, res)
);

// Generic email login (if needed)
router.post("/login-email", (req, res) =>
  AuthController.login(req, res)
);

// NEW: Officer login via email
router.post("/login-officer", (req, res) =>
  AuthController.loginOfficer(req, res)
);

export default router;
