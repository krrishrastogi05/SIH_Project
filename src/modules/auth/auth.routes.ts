// backend/src/modules/auth/auth.routes.ts
import { Router } from "express";
import { AuthController } from "./auth.controller.js";

const router = Router();

// Registration (already used elsewhere)
router.post("/register", (req, res) => AuthController.register(req, res));

// Beneficiary login with phone + password
router.post("/login", (req, res) =>
  AuthController.loginWithPhone(req, res)
);

// OPTIONAL: keep a separate endpoint for email login if required
router.post("/login-email", (req, res) =>
  AuthController.login(req, res)
);

export default router;
