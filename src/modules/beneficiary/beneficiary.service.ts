import { prisma } from "../../db/prisma.js";
import { ApplyInput, UploadDocsInput } from "./beneficiary.schema.js";

export class BeneficiaryService {
  static async getDashboard(userId: string) {
    const applications = await prisma.schemeFeed.findMany({
      where: { userId },
      include: { scheme: true }
    });

    const verifications = await prisma.beneficiaryVerification.findMany({
      where: { userId },
      include: { scheme: true }
    });

    return { applications, verifications };
  }

  static async getEligibleSchemes(userId: string) {
    return prisma.schemeFeed.findMany({
      where: { userId },
      include: { scheme: true }
    });
  }

  static async apply(userId: string, data: ApplyInput) {
    const feed = await prisma.schemeFeed.findFirst({
      where: { userId, schemeId: data.schemeId }
    });

    if (!feed) return null;

    return prisma.schemeFeed.update({
      where: { id: feed.id },
      data: { status: "APPLIED" }
    });
  }

  static async uploadDocuments(userId: string, data: UploadDocsInput) {
    return prisma.user.update({
      where: { id: userId },
      data: { documents: data.documents }
    });
  }
}
