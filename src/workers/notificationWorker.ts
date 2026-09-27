import "dotenv/config";
import { Worker } from "bullmq";
import { Redis } from "ioredis";

const redisConnection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

// Triggered on Payment or Application
new Worker("notification-queue", async (job) => {
    const { phone, message } = job.data;
    // Simulate SMS sending
    console.log(`📨 [SMS SIMULATION] To: ${phone} | Message: "${message}"`);
    // Add Twilio code here if needed
}, { connection: redisConnection });

console.log("🚀 Notification Worker Started...");
