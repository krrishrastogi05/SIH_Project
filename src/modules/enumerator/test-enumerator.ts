import "dotenv/config";
import { prisma } from "../../db/prisma.js";
import { EnumeratorService } from "./enumerator.service.js";

async function run() {
  console.log("🚀 Starting Enumerator Module Test...\n");

  try {
    // 1) Pick any enumerator from DB
    const enumerator = await prisma.user.findFirst({
      where: { role: "ENUMERATOR" }
    });

    if (!enumerator) {
      console.log("⚠️ No ENUMERATOR user found. Run your seed first.");
      return;
    }

    console.log("👤 Using enumerator:", {
      id: enumerator.id,
      name: enumerator.name,
      email: enumerator.email
    });

    // 2) Test: getTasks
    console.log("\n📌 1) Testing getTasks(enumeratorId)...");
    const tasks = await EnumeratorService.getTasks(enumerator.id);
    console.log("✅ Tasks result:");
    console.dir(tasks, { depth: null });

    if (!tasks.length) {
      console.log("\n⚠️ No UNDER_REVIEW verifications assigned to this enumerator.");
      console.log("   Create some BeneficiaryVerification rows or adjust your seed.");
      return;
    }

    const firstTask = tasks[0];
    console.log("\n👉 Using first task for submit test:", {
      verificationId: firstTask.id,
      schemeId: firstTask.schemeId,
      userId: firstTask.userId
    });

    // 3) Test: submitVerification (approve with dummy docs)
    console.log("\n📌 2) Testing submitVerification(enumeratorId, data)...");
    const submitResult = await EnumeratorService.submitVerification(
      enumerator.id,
      {
        verificationId: firstTask.id,
        status: "APPROVED",
        remarks: "Approved via test-enumerator script",
        documents: {
          aadhaar: "https://res.cloudinary.com/demo/image/upload/aadhaar-test.png",
          selfie: "https://res.cloudinary.com/demo/image/upload/selfie-test.png"
        }
      }
    );

    console.log("✅ submitVerification result:");
    console.dir(submitResult, { depth: null });
  } catch (err) {
    console.error("❌ Enumerator test failed:", err);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Prisma disconnected. Test finished.");
  }
}

run();
