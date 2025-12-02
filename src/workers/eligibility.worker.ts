import "dotenv/config";
import { prisma } from "../db/prisma.js";
import { checkEligibility } from "../utils/eligibilityEngine.js";
import { Worker } from "bullmq";
import { redis } from "../utils/redis.js";
import { notificationQueue } from "../queue/queue.js";

const eligibilityWorker = new Worker(
  "eligibility-queue",
  async (job) => {
    if (job.name === "check-eligibility-for-scheme") {
      const { schemeId } = job.data;
      console.log(`Processing eligibility for scheme: ${schemeId}`);

      const scheme = await prisma.scheme.findUnique({
        where: { id: schemeId },
      });
      if (!scheme || scheme.status !== "APPROVED") {
        console.error(`Scheme ${schemeId} not found or not approved.`);
        return;
      }

      // Fetch all verified beneficiaries to check against the scheme
      const beneficiaries = await prisma.user.findMany({
        where: { role: "BENEFICIARY", verificationStatus: "VERIFIED" },
      });

      const eligibleBeneficiaries = beneficiaries.filter((user) =>
        checkEligibility(user, scheme)
      );

      console.log(
        `Found ${eligibleBeneficiaries.length} eligible beneficiaries for scheme ${scheme.title}.`
      );

      for (const beneficiary of eligibleBeneficiaries) {
        // Create a record linking the user to the scheme
        await prisma.beneficiaryScheme.upsert({
          where: {
            beneficiaryId_schemeId: {
              beneficiaryId: beneficiary.id,
              schemeId: scheme.id,
            },
          },
          update: {},
          create: {
            beneficiaryId: beneficiary.id,
            schemeId: scheme.id,
            status: "ELIGIBLE",
          },
        });

        // Add a job to notify the user
        await notificationQueue.add("send-eligibility-notification", {
          phone: beneficiary.phone,
          beneficiaryName: beneficiary.name,
          schemeTitle: scheme.title,
        });
      }
    }
  },
  { connection: redis }
);

console.log("🚀 Eligibility worker started.");
