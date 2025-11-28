import "dotenv/config";
import { prisma } from "../db/prisma.js";
import { SchemeStatus } from "@prisma/client"; // 1. Import the enum

// create a csvReport for an existing approved scheme or all
async function run() {
  const scheme = await prisma.schemePost.findFirst({
    where: { status: "APPROVED" },
  });
  const report = await prisma.csvReport.create({
    data: {
      schemeId: scheme?.id ?? null,
      generatedBy: null,
      filters: {},
      status: "PENDING",
    },
  });

  console.log("Created CSV report:", report.id);
  await processCsvJob({ reportId: report.id });

  const after = await prisma.csvReport.findUnique({ where: { id: report.id } });
  console.log("CSV report after processing:", after);
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

// filepath: src/tests/test-csv-worker.ts
async function testCsvWorker() {
  console.log("Testing CSV Worker...");

  // 2. Use the enum member in the query
  const scheme = await prisma.schemePost.findFirst({
    where: {
      status: SchemeStatus.PUBLISHED,
    },
  });

  if (!scheme) {
    console.error("No published scheme found to test CSV generation.");
    return;
  }

  const logEntry = await prisma.csvLog.create({
    data: {
      schemeId: scheme.id,
    },
  });

  console.log("✅ Successfully created CsvLog entry:", logEntry);
}

testCsvWorker()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
