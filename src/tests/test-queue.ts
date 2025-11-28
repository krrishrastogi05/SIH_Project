import "dotenv/config";
import { Queue, Worker } from "bullmq";
import { redisConnection } from "../utils/redis.js"; // Assuming you have a shared connection
import { prisma } from "../db/prisma.js";

const QUEUE_NAME = "test-queue";

async function runTest() {
  console.log("Test: queue enqueue/dequeue");

  // Create queue and worker instances for the test
  const queue = new Queue(QUEUE_NAME, { connection: redisConnection });
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      console.log("Processing job:", job.data);
      // Simulate work
      return { status: "done", jobId: job.id };
    },
    { connection: redisConnection }
  );

  try {
    // Add a job to the queue
    await queue.add("test-job", { type: "PING", ts: Date.now() });

    // Wait for the worker to pick up and complete the job
    const job = await worker.getNextJob("test-token");
    if (job) {
      const result = await job.moveToCompleted("success", "test-token");
      console.log("Dequeued and processed job:", result);
    }
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // --- THIS IS THE FIX ---
    // Close all connections to allow the script to exit
    console.log("\nClosing connections...");
    await worker.close();
    await queue.close();
    await redisConnection.disconnect();
    await prisma.$disconnect();
    console.log("Connections closed. Exiting.");
    // ----------------------
  }
}

runTest();
