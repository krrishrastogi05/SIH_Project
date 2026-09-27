import "dotenv/config";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

// Use a new dedicated connection for the Producer (Queue)
// This prevents sharing issues with the Worker
const connection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: null,
});

export const eligibilityQueue = new Queue("eligibility-queue", { connection });
export const notificationQueue = new Queue("notification-queue", { connection });

console.log("🚀 Queue Producer Initialized");
