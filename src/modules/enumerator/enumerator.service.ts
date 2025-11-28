import { prisma } from "../../db/prisma.js";
import { SubmitVerificationInput } from "./enumerator.schema.js";

export class EnumeratorService {
  static async getTasks(enumeratorId: string) {
    return prisma.beneficiaryVerification.findMany({
      where: {
        enumeratorId,
        status: "UNDER_REVIEW"
      },
      include: {
        // ✅ FIXED: Matches 'SchemePost' in your schema.prisma
        SchemePost: true, 
        user: true
      }
    });
  }

  static async submitVerification(enumeratorId: string, data: SubmitVerificationInput) {
    const existing = await prisma.beneficiaryVerification.findUnique({
      where: { id: data.verificationId }
    });

    if (!existing) return null;

    if (existing.enumeratorId && existing.enumeratorId !== enumeratorId) {
      throw new Error("This verification is assigned to another enumerator");
    }

    const updated = await prisma.beneficiaryVerification.update({
      where: { id: data.verificationId },
      data: {
        enumeratorId,
        status: data.status,
        remarks: data.remarks ?? existing.remarks,
        // ✅ FIXED: Cast existing JSON to any to avoid type conflict with Zod
        documents: data.documents ?? (existing.documents as any)
      }
    });

    return updated;
  }
}