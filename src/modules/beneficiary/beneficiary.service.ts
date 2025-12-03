import { prisma } from "../../db/prisma.js";

export class BeneficiaryService {

  // 1. Get Dashboard (Schemes where user is ELIGIBLE or APPLIED)
  static async getDashboard(userId: string) {
    return prisma.beneficiaryScheme.findMany({
      where: { beneficiaryId: userId },
      include: { 
        scheme: true // Include scheme details (title, extraFields config, etc.)
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  // 2. Apply for Scheme (Save Answers)
  static async applyForScheme(userId: string, schemeId: string, applicationData: any) {
    // Note: schemeId here refers to the Internal UUID
    
    // Check if record exists (Created by Worker)
    const record = await prisma.beneficiaryScheme.findUnique({
        where: { beneficiaryId_schemeId: { beneficiaryId: userId, schemeId } },
        include: { scheme: true } // Need scheme title for notification return
    });

    if (!record) {
        throw new Error("You are not eligible for this scheme.");
    }

    if (record.status !== "ELIGIBLE") {
        throw new Error("You have already applied or this scheme is closed for you.");
    }

    // Update Status & Save Data
    return prisma.beneficiaryScheme.update({
        where: { id: record.id },
        data: {
            status: "APPLIED",
            applicationData: applicationData, // Save form answers
        },
        include: { scheme: true }
    });
  }
}