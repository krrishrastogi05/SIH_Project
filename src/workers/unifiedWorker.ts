// backend/src/workers/unifiedWorker.ts
import "dotenv/config";
import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";
import { checkEligibility } from "../utils/eligibilityEngine.js"; // Ensure this file exists

const prisma = new PrismaClient();

const redisConnection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

const worker = new Worker("main-queue", async (job) => {
    console.log(`\n⚙️  Processing Job: ${job.name}`);

    // JOB 1: CHECK ELIGIBILITY (Triggered when Officer creates a Scheme)
    if (job.name === "check-eligibility-for-scheme") {
      const { schemeId } = job.data;
      
      const scheme = await prisma.scheme.findUnique({ where: { id: schemeId } });
      if (!scheme) return;

      console.log(`   Scanning users for scheme: "${scheme.title}"...`);

      // Optimization: Only fetch users in the target state
      const whereClause: any = { role: "BENEFICIARY" };
      if (scheme.state !== "All") whereClause.state = scheme.state;
      
      const users = await prisma.user.findMany({ where: whereClause });

      let matchCount = 0;
      for (const user of users) {
        // Run the eligibility logic
        const isEligible = checkEligibility(user, scheme);

        if (isEligible) {
          matchCount++;
          
          // A. Create "ELIGIBLE" entry so user sees it in dashboard
          await prisma.beneficiaryScheme.upsert({
            where: { userId_schemeId: { userId: user.id, schemeId: scheme.id } },
            update: {}, // Don't change if exists
            create: { userId: user.id, schemeId: scheme.id, status: "ELIGIBLE" }
          });

          // B. Create Notification
          await prisma.notification.create({
            data: {
              userId: user.id,
              message: `New Scheme Alert: You are eligible for ${scheme.title}`
            }
          });
          
          // C. (Optional) Log SMS sending here
          console.log(`   -> Notified User: ${user.phone}`);
        }
      }
      console.log(`✅ Scan Complete. Matches found: ${matchCount}`);
    } 
    
    // JOB 2: SEND SMS (Triggered on Payment or Application)
    else if (job.name === "send-sms") {
        const { phone, message } = job.data;
        // Simulate SMS sending
        console.log(`📨 [SMS SIMULATION] To: ${phone} | Message: "${message}"`);
        // Add Twilio code here if needed
    }

}, { connection: redisConnection });

console.log("🚀 Unified Worker Service Started...");
