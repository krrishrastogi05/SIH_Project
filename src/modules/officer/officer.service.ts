import { prisma } from "../../db/prisma.js";
import {
  ApproveRejectSchemeInput,
  ApproveRejectVerificationInput
} from "./officer.schema.js";

export class OfficerService {
  static async getPendingSchemes() {
    return prisma.schemePost.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        poster: true
      }
    });
  }

  static async approveScheme(officerId: string, data: ApproveRejectSchemeInput) {
    const existing = await prisma.schemePost.findUnique({
      where: { id: data.schemeId }
    });

    if (!existing) return null;
    if (existing.status !== "PENDING") return existing;

    const updated = await prisma.schemePost.update({
      where: { id: data.schemeId },
      data: {
        status: "APPROVED"
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        role: "OFFICER",
        action: "SCHEME_APPROVED",
        target: `scheme:${data.schemeId}`,
        timestamp: new Date()
      }
    });

    return updated;
  }

  static async rejectScheme(officerId: string, data: ApproveRejectSchemeInput) {
    const existing = await prisma.schemePost.findUnique({
      where: { id: data.schemeId }
    });

    if (!existing) return null;
    if (existing.status !== "PENDING") return existing;

    const updated = await prisma.schemePost.update({
      where: { id: data.schemeId },
      data: {
        status: "REJECTED"
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        role: "OFFICER",
        action: "SCHEME_REJECTED",
        target: `scheme:${data.schemeId}`,
        timestamp: new Date()
      }
    });

    return updated;
  }

  static async getPendingVerifications() {
    return prisma.beneficiaryVerification.findMany({
      where: { status: "UNDER_REVIEW" },
      orderBy: { id: "desc" },
      include: {
        user: true,
        scheme: true,
        enumerator: true
      }
    });
  }

  static async approveVerification(
    officerId: string,
    data: ApproveRejectVerificationInput
  ) {
    const existing = await prisma.beneficiaryVerification.findUnique({
      where: { id: data.verificationId }
    });

    if (!existing) return null;
    if (existing.status !== "UNDER_REVIEW") return existing;

    const updated = await prisma.beneficiaryVerification.update({
      where: { id: data.verificationId },
      data: {
        status: "APPROVED",
        remarks: data.remarks ?? existing.remarks
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        role: "OFFICER",
        action: "VERIFICATION_APPROVED",
        target: `verification:${data.verificationId}`,
        timestamp: new Date()
      }
    });

    return updated;
  }

  static async rejectVerification(
    officerId: string,
    data: ApproveRejectVerificationInput
  ) {
    const existing = await prisma.beneficiaryVerification.findUnique({
      where: { id: data.verificationId }
    });

    if (!existing) return null;
    if (existing.status !== "UNDER_REVIEW") return existing;

    const updated = await prisma.beneficiaryVerification.update({
      where: { id: data.verificationId },
      data: {
        status: "REJECTED",
        remarks: data.remarks ?? existing.remarks
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: officerId,
        role: "OFFICER",
        action: "VERIFICATION_REJECTED",
        target: `verification:${data.verificationId}`,
        timestamp: new Date()
      }
    });

    return updated;
  }
}
