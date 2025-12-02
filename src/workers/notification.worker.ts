import "dotenv/config";
import { prisma } from "../db/prisma.js";
import { sendSMS } from "../utils/sms.js";
import { sendWhatsApp } from "../utils/whatsapp.js";
import { Job } from "bullmq";
import { JobStatus } from "@prisma/client"; // 1. Import the enum
import { Worker } from "bullmq";
import { redis } from "../utils/redis.js";
import { smsService } from "../utils/sms.js";

const notificationWorker = new Worker(
  "notification-queue",
  async (job) => {
    console.log(`Processing notification job: ${job.name}`);

    // Handle OTP notifications
    if (job.name === "send-otp") {
      const { phone, otp } = job.data;
      const message = `Your PM-AJAY login OTP is: ${otp}`;
      await smsService.send(phone, message);
      return;
    }

    // Handle new scheme eligibility notifications
    if (job.name === "send-eligibility-notification") {
      const { phone, beneficiaryName, schemeTitle } = job.data;
      const message = `Dear ${beneficiaryName}, you are eligible for a new scheme: "${schemeTitle}". Please log in to the PM-AJAY portal to apply.`;
      await smsService.send(phone, message);
      return;
    }
  },
  { connection: redis }
);

console.log("🚀 Notification worker started.");

export async function processNotificationJob(job: Job) {
  const { notifId } = job.data;
  const notif = await prisma.notification.findUnique({
    where: { id: notifId },
  });

  if (!notif) {
    console.error(`Notification not found: ${notifId}`);
    return;
  }

  try {
    if (notif.channel === "SMS") {
      await sendSMS(notif.userId, notif.message);
    } else if (notif.channel === "WHATSAPP") {
      await sendWhatsApp(notif.userId, notif.message);
    }

    console.log(`Sent notification: ${notif.id}`);

    // 2. Use the enum member
    await prisma.notification.update({
      where: { id: notif.id },
      data: { status: JobStatus.COMPLETED }, // Use COMPLETED for success
    });
  } catch (e) {
    console.error("Notification failed", e);
    // 3. Use the enum member
    await prisma.notification.update({
      where: { id: notif.id },
      data: { status: JobStatus.FAILED },
    });
  }
}
