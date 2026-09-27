import "dotenv/config";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { prisma } from "../db/prisma.js";
import { checkEligibility } from "../utils/eligibilityEngine.js";

const redisConnection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

// Triggered when Officer creates a Scheme
new Worker("eligibility-queue", async (job) => {
    console.log(`\n⚙️  Processing Job: ${job.name}`);

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

        // B. Create Notification (stable key, so a job retry does not make a second one)
        const key = `eligible-${user.id}-${scheme.id}`;
        await prisma.notification.upsert({
          where: { key },
          update: {},
          create: {
            key,
            userId: user.id,
            message: `New Scheme Alert: You are eligible for ${scheme.title}`
          }
        });
        
        // C. (Optional) Log SMS sending here
        console.log(`   -> Notified User: ${user.phone}`);
      }
    }
    console.log(`✅ Scan Complete. Matches found: ${matchCount}`);
}, { connection: redisConnection });

console.log("🚀 Eligibility Worker Started...");
