import "dotenv/config";
import { BeneficiaryService } from "./beneficiary.service.js";
import { prisma } from "../../db/prisma.js";

async function runTest() {
  console.log("🚀 Starting Beneficiary Module Test...");

  // A test user ID. In a real test suite, you would create this user first.
  const testUserId = "cmihpz5tq0000u5sv4dbvuemf";
  const testSchemeId = "8a66a738-871e-478e-8163-03564fc54c24"; // Example scheme ID

  try {
    console.log("\n📌 Testing: Dashboard");
    const dashboard = await BeneficiaryService.getDashboard(testUserId);
    console.log("✅ Dashboard data received.");

    console.log("\n📌 Testing: Eligible Schemes");
    const eligible = await BeneficiaryService.getEligibleSchemes(testUserId);
    console.log(
      "✅ Eligible Schemes received:",
      eligible.length > 0 ? eligible : "None found."
    );

    console.log("\n📌 Testing: Apply to Scheme");
    const applyResult = await BeneficiaryService.apply(testUserId, {
      schemeId: testSchemeId,
    });
    console.log(
      "✅ Apply Result:",
      applyResult ? "Success" : "Failed or already applied."
    );

    // --- FIX IS HERE ---
    console.log("\n📌 Testing: Upload Documents");
    const uploadResult = await BeneficiaryService.uploadDocuments(testUserId, {
      // Pass an object with the 'documentUrls' property
      documentUrls: [
        "https://example.com/docs/doc1.pdf",
        "https://example.com/docs/doc2.png",
      ],
    });
    console.log(
      "✅ Upload Documents Result:",
      uploadResult ? "Success" : "Failed."
    );
    // --------------------

    console.log("\n\n🎉 All tests completed.");
  } catch (err) {
    console.error("❌ Test Failed:", err);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Prisma Disconnected");
  }
}

runTest();
