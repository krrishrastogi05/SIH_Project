import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./modules/auth/auth.routes"

dotenv.config();

const app: Application = express();

app.use(cors({
  origin: "*",
  credentials: true
}));

app.use("/auth", authRoutes);
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

export default app;
