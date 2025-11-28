import { prisma } from "../../db/prisma.js";
import { ApplyInput, UploadDocsInput } from "./beneficiary.schema.js";

export class BeneficiaryService {
  static async getDashboard(userId: string) {
    const applications = await prisma.schemeFeed.findMany({
      where: { userId },
      include: { scheme: true },
    });

    const verifications = await prisma.beneficiaryVerification.findMany({
      where: {
        userId: userId, // Use the userId parameter instead of a hardcoded value
      },
      include: {
        SchemePost: true, // FIX: Change 'scheme' to 'SchemePost'
        user: true, // You can include other valid relations as needed
      },
    });

    return { applications, verifications };
  }

  static async getEligibleSchemes(userId: string) {
    return prisma.schemeFeed.findMany({
      where: { userId },
      include: { scheme: true },
    });
  }

  static async apply(userId: string, data: ApplyInput) {
    const feed = await prisma.schemeFeed.findFirst({
      where: { userId, schemeId: data.schemeId },
    });

    if (!feed) return null;

    return prisma.schemeFeed.update({
      where: { id: feed.id },
      data: { status: "APPLIED" },
    });
  }

  static async uploadDocuments(userId: string, data: UploadDocsInput) {
    return prisma.user.update({
      where: {
        id: userId, // FIX: Use the userId from the function parameter
      },
      data: {
        // This will now work because the field exists
        documents: {
          push: data.documentUrls,
        },
      },
    });
  }
}
