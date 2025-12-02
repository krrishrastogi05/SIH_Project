import { Queue } from "bullmq";
import { redis } from "../utils/redis.js"; // Assumes redis connection is exported from here

// Standard options for all our queues
const queueOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3, // Retry a failed job up to 3 times
    backoff: {
      type: "exponential",
      delay: 1000, // Wait 1s, then 2s, then 4s between retries
    },
    removeOnComplete: {
      count: 100, // Keep the last 100 completed jobs
      age: 60 * 60 * 24, // Keep for 24 hours
    },
    removeOnFail: {
      count: 1000, // Keep the last 1000 failed jobs
    },
  },
};

/**
 * @description Queue for processing scheme eligibility checks.
 * When a scheme is approved, a job is added here.
 * The eligibility.worker.ts listens to this queue.
 */
export const eligibilityQueue = new Queue("eligibility-queue", queueOptions);

/**
 * @description Queue for sending notifications (SMS, WhatsApp, etc.).
 * The eligibility worker adds jobs here after finding eligible users.
 * The notification.worker.ts listens to this queue.
 */
export const notificationQueue = new Queue("notification-queue", queueOptions);

/**
 * @description Queue for processing large CSV file uploads.
 */
export const csvQueue = new Queue("csv-queue", queueOptions);

console.log("🚀 Queues initialized and connected to Redis.");