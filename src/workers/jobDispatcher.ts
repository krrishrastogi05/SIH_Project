import { enqueue } from "../queue/queue.js";

export async function enqueueEligibility(schemeId: string) {
  await enqueue("ELIGIBILITY_QUEUE", {
    type: "ELIGIBILITY_RUN",
    schemeId
  });
}

export async function enqueueNotification(notificationId: string) {
  await enqueue("NOTIFICATION_QUEUE", {
    type: "SEND_NOTIFICATION",
    notificationId
  });
}

export async function enqueueCsv(reportId: string) {
  await enqueue("CSV_QUEUE", {
    type: "GENERATE_CSV",
    reportId
  });
}
