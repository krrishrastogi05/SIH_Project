// backend/src/modules/enumerator/enumerator.service.ts

import { prisma } from "../../db/prisma.js";
import { SubmitVerificationInput } from "./enumerator.schema.js";

export class EnumeratorService {

  // ----------------------------------------------------
  // 1. GET VERIFICATION TASKS
  // ----------------------------------------------------
  static async getTasks(enumeratorId: string) {
    const enumerator = await prisma.user.findUnique({
      where: { id: enumeratorId }
    });

    if (!enumerator) return [];

    return prisma.beneficiaryVerification.findMany({
      where: {
        status: "UNDER_REVIEW",
        enumeratorId: enumeratorId,  // Only assigned tasks
      },
      include: {
        user: true,
        SchemePost: true
      }
    });
  }

  // ----------------------------------------------------
  // 2. SUBMIT VERIFICATION (Manual KYC Validation)
  // ----------------------------------------------------
  static async submitVerification(
    enumeratorId: string,
    data: SubmitVerificationInput
  ) {

    const existing = await prisma.beneficiaryVerification.findUnique({
      where: { id: data.verificationId }
    });

    if (!existing) return null;

    // Ensure enumerator assignment
    if (!existing.enumeratorId) {
      throw new Error("This verification is not assigned to any enumerator");
    }

    if (existing.enumeratorId !== enumeratorId) {
      throw new Error("This verification is assigned to another enumerator");
    }

    // Update the verification first
    const updated = await prisma.beneficiaryVerification.update({
      where: { id: data.verificationId },
      data: {
        status: data.status === "APPROVED" ? "UNDER_REVIEW" : "REJECTED",
        remarks: data.remarks ?? existing.remarks,
        documents: data.documents ?? (existing.documents as any)
      }
    });

    // If approved by enumerator → Officer must review
    if (data.status === "APPROVED") {
      await prisma.user.update({
        where: { id: existing.userId },
        data: {
          verificationStatus: "UNDER_REVIEW"
        }
      });
    }

    if (data.status === "REJECTED") {
      await prisma.user.update({
        where: { id: existing.userId },
        data: {
          verificationStatus: "REJECTED",
          verificationRemarks: data.remarks ?? "Documents rejected by enumerator"
        }
      });
    }

    return updated;
  }
}
