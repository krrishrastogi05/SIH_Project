import "dotenv/config";
import { enqueue } from "../queue/queue.js";
import { prisma } from "../db/prisma.js";

// This test pushes a small job into ELIGIBILITY_QUEUE and runs the jobProcessor script manually.
// For safety we will enqueue a job for an APPROVED scheme (if exists) and then let you run jobProcessor.
async function run() {
  const scheme = await prisma.schemePost.findFirst({ where: { status: "APPROVED" }});
  if (!scheme) { console.error("No APPROVED scheme. seed first."); await prisma.$disconnect(); return; }

  await enqueue("ELIGIBILITY_QUEUE", { type: "ELIGIBILITY_RUN", schemeId: scheme.id });
  console.log("Enqueued eligibility job for scheme:", scheme.id);
  console.log("Now run the job processor in another terminal:");
  console.log("npx tsx src/workers/jobProcessor.ts");
  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
