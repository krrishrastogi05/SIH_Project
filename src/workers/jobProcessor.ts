import "dotenv/config";
import { dequeue } from "../queue/queue.js";
import { processEligibilityJob } from "./eligibility.worker.js";
import { processNotificationJob } from "./notification.worker.js";
import { processCsvJob } from "./csv.worker.js";

async function startJobProcessor() {
  console.log("🛠 Job Processor Running...");

  while (true) {
    const job =
      (await dequeue("ELIGIBILITY_QUEUE")) ||
      (await dequeue("NOTIFICATION_QUEUE")) ||
      (await dequeue("CSV_QUEUE"));

    if (!job) {
      await new Promise((r) => setTimeout(r, 1000)); // wait 1s
      continue;
    }

    console.log("⚙ Executing Job:", job);

    if (job.type === "ELIGIBILITY_RUN") {
      await processEligibilityJob(job);
    }
    if (job.type === "SEND_NOTIFICATION") {
      await processNotificationJob(job);
    }
    if (job.type === "GENERATE_CSV") {
      await processCsvJob(job);
    }
  }
}

startJobProcessor();
