// backend/src/modules/verification/verification.service.ts

import { prisma } from "../../db/prisma.js";
import { UploadKycInput, AadhaarVerifyInput } from "./verification.schema.js";

export class VerificationService {

  // 1. Manual KYC upload (fields + docs)
  static async uploadKyc(userId: string, data: UploadKycInput) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        aadhaar: data.aadhaar,
        casteCert: data.casteCert,
        incomeCert: data.incomeCert,
        profileImage: data.profileImage,
        education: (data.education as any) ?? null,
        skill: (data.skill as any) ?? null,
        bankAccount: data.bankAccount ?? null,
        ifsc: data.ifsc ?? null,

        verificationStatus: "UNDER_REVIEW"
      }
    });
  }

  // 2. Aadhaar-linked instant verification
  static async aadhaarAutoVerify(userId: string, data: AadhaarVerifyInput) {
    // Simulate a govt-database lookup
    const dummy = await prisma.aadhaarSource.findUnique({
      where: { aadhaar: data.aadhaar }
    });

    if (!dummy) {
      return { success: false, reason: "NOT_FOUND" };
    }

    // auto-verify user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        aadhaar: dummy.aadhaar,
        casteCert: dummy.casteCert,
        incomeCert: dummy.incomeCert,
        profileImage: dummy.profileImage,
        income: dummy.income,
        age: dummy.age,
        gender: dummy.gender,
        education: dummy.education,
        skill: dummy.skill,

        verificationStatus: "VERIFIED"
      }
    });

    return { success: true, user };
  }

  // 3. Check status
  static async status(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        verificationStatus: true,
        verificationRemarks: true
      }
    });
  }
}
