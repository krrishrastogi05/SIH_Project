import { prisma } from "../../db/prisma.js";
import { eligibilityQueue } from "../../queue/queue.js"; // Import Queue

export class OfficerService {
  
  // 1. Get Pending Schemes
  static async getPendingSchemes() {
    return prisma.scheme.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
  }

  // 2. Approve Scheme & Trigger Engine
  static async approveScheme(
    officerId: string,
    // FIX: Expect an object with schemeId and remarks, not just a string
    data: { schemeId: string; remarks?: string }
  ) {
    // First, find the scheme to ensure it exists and is pending
    const existingScheme = await prisma.scheme.findUnique({
      where: {
        // FIX: Use the schemeId from the data object
        id: data.schemeId ,
      },
    });

    if (!existingScheme) {
      throw new Error("Scheme not found.");
    }

    if (existingScheme.status !== "PENDING") {
      throw new Error("Scheme is not in PENDING state.");
    }

    // Now, update the scheme to APPROVED
    const updatedScheme = await prisma.scheme.update({
      where: {
        id: data.schemeId,
      },
      data: {
        status: "APPROVED",
        // You can optionally save the remarks and officer who approved it
        // This requires adding fields to your schema.prisma, e.g.,
        // remarks String?
        // approvedById String?
      },
    });

    // If approval is successful, add a job to the eligibility queue
    await eligibilityQueue.add("check-eligibility-for-scheme", {
      schemeId: updatedScheme.id,
    });

    return updatedScheme;
  }

  // 3. Reject Scheme
  static async rejectScheme(officerId: string, schemeId: string) {
    return prisma.scheme.update({
      where: { id: schemeId },
      data: { status: "REJECTED" }
    });
  }
}