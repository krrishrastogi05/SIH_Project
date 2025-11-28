import "dotenv/config";
import { prisma } from "../../db/prisma.js";
import { OfficerService } from "./officer.service.js";

async function run() {
  console.log("🚀 Starting Officer Module Test...\n");

  try {
    // 1) Pick an OFFICER (or fallback to ADMIN)
    const officer = await prisma.user.findFirst({
      where: {
        OR: [{ role: "OFFICER" }, { role: "ADMIN" }]
      }
    });

    if (!officer) {
      console.log("⚠️ No OFFICER/ADMIN user found. Make sure seed has created them.");
      return;
    }

    console.log("👤 Using officer:", {
      id: officer.id,
      name: officer.name,
      email: officer.email,
      role: officer.role
    });

    // 2) Test: getPendingSchemes
    console.log("\n📌 1) Testing getPendingSchemes()...");
    const pendingSchemes = await OfficerService.getPendingSchemes();
    console.log("✅ Pending schemes:");
    console.dir(pendingSchemes, { depth: null });

    if (pendingSchemes.length) {
      const firstScheme = pendingSchemes[0];
      console.log("\n👉 Using first pending scheme for approve/reject test:", {
        id: firstScheme.id,
        title: firstScheme.title,
        status: firstScheme.status
      });

      // 3) Test: approveScheme
      console.log("\n📌 2) Testing approveScheme()...");
      const approved = await OfficerService.approveScheme(officer.id, {
        schemeId: firstScheme.id,
        remarks: "Approved via test-officer script"
      });
      console.log("✅ approveScheme result:");
      console.dir(approved, { depth: null });
    } else {
      console.log("\n⚠️ No PENDING schemes found. Skipping scheme approval test.");
    }

    // 4) Test: getPendingVerifications
    console.log("\n📌 3) Testing getPendingVerifications()...");
    const pendingVerifications = await OfficerService.getPendingVerifications();
    console.log("✅ Pending verifications:");
    console.dir(pendingVerifications, { depth: null });

    if (pendingVerifications.length) {
      const firstVerification = pendingVerifications[0];
      console.log("\n👉 Using first pending verification for approve test:", {
        id: firstVerification.id,
        userId: firstVerification.userId,
        schemeId: firstVerification.schemeId,
        status: firstVerification.status
      });

      // 5) Test: approveVerification
      console.log("\n📌 4) Testing approveVerification()...");
      const approvedVerification = await OfficerService.approveVerification(
        officer.id,
        {
          verificationId: firstVerification.id,
          remarks: "Approved via test-officer script"
        }
      );
      console.log("✅ approveVerification result:");
      console.dir(approvedVerification, { depth: null });
    } else {
      console.log("\n⚠️ No UNDER_REVIEW verifications found. Skipping verification approval test.");
    }
  } catch (err) {
    console.error("❌ Officer test failed:", err);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Prisma disconnected. Test finished.");
  }
}

run();
