import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";

// --- IMPORT ROUTERS ---
import authRouter from "./modules/auth/auth.routes.js";

import beneficiaryRouter from "./modules/beneficiary/beneficiary.routes.js";
import officerRoutes from "./modules/officer/officer.routes.js"
import schemesRoutes from "./modules/schemes/schemes.routes.js"
import webhookRoutes from "./modules/payments/webhook.routes.js";

dotenv.config();

const app: Application = express();

// --- CORS ---
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// --- WEBHOOKS ---
// Before express.json(): the signature check needs the raw body
app.use("/api/webhooks", webhookRoutes);

// --- MIDDLEWARE ---
app.use(express.json());

// --- HEALTH CHECK ---
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "UP" });
});

// --- API ROUTES ---
app.use("/api/auth", authRouter);
app.use("/api/beneficiary", beneficiaryRouter);

app.use("/api/officer", officerRoutes);

app.use("/api/schemes", schemesRoutes);

app.get("/", (req, res) => {
  res.send("Backend running.....");
})

export default app;
