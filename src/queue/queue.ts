import "dotenv/config";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

// Use a new dedicated connection for the Producer (Queue)
// This prevents sharing issues with the Worker
const connection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: null,
});

export const mainQueue = new Queue("main-queue", { connection });

// Aliases for clarity in your code (optional, but helps readability)
export const eligibilityQueue = mainQueue;
export const notificationQueue = mainQueue;

console.log("🚀 Queue Producer Initialized");
