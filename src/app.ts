import express, { Application } from "express";
import dotenv from "dotenv";

// Import routers directly from their modules
import authRouter from "./modules/auth/auth.routes.js";
import beneficiaryRouter from "./modules/beneficiary/beneficiary.routes.js";
import schemeRouter from "./modules/schemes/schemes.routes.js";

dotenv.config();

const app: Application = express();

// 1. Body Parser
app.use(express.json());

// 2. Register API Routes
// All routes will be prefixed with /api
app.use("/api/auth", authRouter);
app.use("/api/beneficiary", beneficiaryRouter);
app.use("/api/schemes", schemeRouter);

export default app;
