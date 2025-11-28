import "dotenv/config";
import { prisma } from "../db/prisma.js";
import { processEligibilityJob } from "../workers/eligibility.worker.js";

// picks one APPROVED scheme (seed creates some)
async function run() {
  const scheme = await prisma.schemePost.findFirst({ where: { status: "APPROVED" } });
  if (!scheme) {
    console.error("No APPROVED scheme found. Run seed first.");
    await prisma.$disconnect();
    return;
  }
  console.log("Running eligibility job for scheme:", scheme.id, scheme.title);
  await processEligibilityJob({ schemeId: scheme.id });
  // verify at least one SchemeFeed entry for that scheme exists
  const feed = await prisma.schemeFeed.findFirst({ where: { schemeId: scheme.id } });
  console.log("Sample schemeFeed:", feed);
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
