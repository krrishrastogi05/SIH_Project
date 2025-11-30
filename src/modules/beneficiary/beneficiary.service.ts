// backend/src/modules/beneficiary/beneficiary.service.ts

import { prisma } from "../../db/prisma.js";
import { ApplyInput, UploadDocsInput } from "./beneficiary.schema.js";

export class BeneficiaryService {

  // --------------------------
  // DASHBOARD
  // --------------------------
  static async getDashboard(userId: string) {
    const applications = await prisma.schemeFeed.findMany({
      where: { userId },
      include: { scheme: true }
    });

    const verifications = await prisma.beneficiaryVerification.findMany({
      where: { userId },
      include: {
        SchemePost: true,
        user: true
      }
    });

    return { applications, verifications };
  }

  // --------------------------
  // ELIGIBLE SCHEMES LIST
  // --------------------------
  static async getEligibleSchemes(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }});
    if (!user) return [];

    return prisma.schemePost.findMany({
      where: {
        status: "APPROVED",
        state: user.state,
        district: user.district,
        block: user.block,

        // Eligibility simplifications
        minIncome: { lte: user.income ?? 999999999 },
        maxIncome: { gte: user.income ?? 0 },

        minAge: user.age ? { lte: user.age } : undefined,
        maxAge: user.age ? { gte: user.age } : undefined,

        requiredEducation: user.education ?? undefined,
        requiredSkill: user.skill ?? undefined
      }
    });
  }

  // --------------------------
  // APPLY FOR A SCHEME
  // --------------------------
  static async apply(userId: string, data: ApplyInput) {

    const feed = await prisma.schemeFeed.findFirst({
      where: { userId, schemeId: data.schemeId },
    });

    if (!feed) return null;

    const updated = await prisma.schemeFeed.update({
      where: { id: feed.id },
      data: {
        status: "APPLIED",
        appliedDocs: data.documents ?? {}
      }
    });

    // Also create verification entry for OFFICER
    await prisma.beneficiaryVerification.create({
      data: {
        userId,
        schemeId: data.schemeId,
        status: "UNDER_REVIEW",
        remarks: "Application submitted; pending officer review",
        documents: data.documents ?? {}
      }
    });

    return updated;
  }

  // --------------------------
  // UPLOAD USER DOCUMENTS (PROFILE DOCS)
  // --------------------------
  static async uploadDocuments(userId: string, data: UploadDocsInput) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        documents: { push: data.documents }
      }
    });
  }
}
