import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./modules/auth/auth.routes.js"; // Added .js
import beneficiaryRoutes from "./modules/beneficiary/beneficiary.routes.js";
import schemesRoutes from "./modules/schemes/schemes.routes.js";
import enumeratorRoutes from "./modules/enumerator/enumerator.routes.js";
import officerRoutes from "./modules/officer/officer.routes.js";


import verificationRoutes from "./modules/verification/verification.routes.js";









dotenv.config();

const app: Application = express();

// 1. Body Parsers MUST come before routes

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// 2. CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// 3. Routes
app.use("/auth", authRoutes);
app.use("/beneficiary", beneficiaryRoutes);
app.use("/schemes", schemesRoutes);
app.use("/enumerator", enumeratorRoutes);
app.use("/officer", officerRoutes);

app.use("/verification", verificationRoutes);

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;