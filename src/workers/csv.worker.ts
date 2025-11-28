import "dotenv/config";
import { prisma } from "../db/prisma.js";
import cloudinary from "../utils/cloudinary.js";
import { buildCSV } from "../utils/csvBuilder.js";

export async function processCsvJob(job: any) {
  const { reportId } = job;

  const report = await prisma.csvReport.findUnique({
    where: { id: reportId }
  });

  if (!report) return;

  const data = await prisma.schemeFeed.findMany({
    where: report.schemeId ? { schemeId: report.schemeId } : undefined,
    include: { user: true, scheme: true }
  });

  const csv = buildCSV(data);

  const uploaded = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "reports",
        public_id: `report_${report.id}`
      },
      (err, file) => {
        if (err) reject(err);
        else resolve(file);
      }
    ).end(Buffer.from(csv));
  });

  await prisma.csvReport.update({
    where: { id: report.id },
    data: {
      fileUrl: uploaded.secure_url,
      status: "SUCCESS"
    }
  });

  console.log(`CSV report generated: ${report.id}`);
}
