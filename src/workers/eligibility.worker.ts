import "dotenv/config";
import { prisma } from "../db/prisma.js"
import { checkEligibility } from "../utils/eligibilityEngine.js";

export async function processEligibilityJob(job: any) {
  const { schemeId } = job;

  const scheme = await prisma.schemePost.findUnique({
    where: { id: schemeId }
  });

  if (!scheme) return;

  const users = await prisma.user.findMany({
    where: {
      state: scheme.state,
      district: scheme.district,
      block: scheme.block,
      role: "BENEFICIARY"
    }
  });

  for (const user of users) {
    const result = checkEligibility(
      {
        age: user.age,
        gender: user.gender,
        income: user.income,
        state: user.state,
        district: user.district,
        block: user.block,
        documents: user.documents
      },
      {
        incomeRequired: scheme.incomeRequired,
        minIncome: scheme.minIncome,
        maxIncome: scheme.maxIncome,
        regionType: scheme.regionType,
        state: scheme.state,
        district: scheme.district,
        block: scheme.block,
        additionalDocs: scheme.additionalDocs ?? {}
      }
    );

    if (!result.isEligible) continue;

    await prisma.schemeFeed.upsert({
      where: {
        schemeId_userId: {
          schemeId: scheme.id,
          userId: user.id
        }
      },
      update: {
        eligibilityScore: result.eligibilityScore
      },
      create: {
        schemeId: scheme.id,
        userId: user.id,
        eligibilityScore: result.eligibilityScore,
        status: "NOTIFIED"
      }
    });
  }

  console.log(`Eligibility job completed for scheme: ${schemeId}`);
}
