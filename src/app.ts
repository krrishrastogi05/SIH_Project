import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors"; // <--- 1. Import this

// --- IMPORT ROUTERS ---
import authRouter from "./modules/auth/auth.routes.js";
import beneficiaryRegisterRouter from "./modules/beneficiary/beneficiary-register.routes.js";
import beneficiaryRouter from "./modules/beneficiary/beneficiary.routes.js";
import enumeratorRouter from "./modules/enumerator/enumerator.routes.js";
import officerRegisterRouter from "./modules/officer/officer-register.routes.js";
import officerRouter from "./modules/officer/officer.routes.js";
import schemeRouter from "./modules/schemes/schemes.routes.js";
import verificationRouter from "./modules/verification/verification.routes.js";

dotenv.config();
const app: Application = express();

// --- 2. ADD CORS MIDDLEWARE (CRITICAL FIX) ---
app.use(cors({
  origin: "http://localhost:3000", // Allow your frontend
  credentials: true,               // Allow cookies/headers
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
}));

// --- MIDDLEWARES ---
app.use(express.json());

// --- HEALTH CHECK ROUTE ---
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "UP" });
});

// --- REGISTER ALL API ROUTES ---
app.use("/api/auth", authRouter);
app.use("/api/register/beneficiary", beneficiaryRegisterRouter);
app.use("/api/register/officer", officerRegisterRouter);
app.use("/api/enumerator", enumeratorRouter);
app.use("/api/officer", officerRouter);
app.use("/api/verification", verificationRouter);
app.use("/api/beneficiary", beneficiaryRouter);
app.use("/api/schemes", schemeRouter);

export default app;