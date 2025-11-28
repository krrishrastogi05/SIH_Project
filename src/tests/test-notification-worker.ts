import "dotenv/config";
import { prisma } from "../db/prisma.js";
import { processNotificationJob } from "../workers/notification.worker.js";

// create a test notification and process it
async function run() {
  const user = await prisma.user.findFirst({ where: { role: "BENEFICIARY" } });
  if (!user) {
    console.error("No beneficiary user");
    await prisma.$disconnect();
    return;
  }

  const notif = await prisma.notification.create({
    data: {
      userId: user.id, // Use the user found, not a hardcoded ID
      message: `Test SMS at ${new Date().toISOString()}`,
    },
  });

  console.log("Created notification:", notif.id);
  await processNotificationJob({ notificationId: notif.id });

  const after = await prisma.notification.findUnique({
    where: { id: notif.id },
  });
  console.log("Notification after processing:", after);
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
