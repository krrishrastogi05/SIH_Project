import "dotenv/config";
import { prisma } from "../../db/prisma.js";
import { SchemeService } from "./schemes.service.js";
import { CreateSchemeInput } from "./schemes.schema.js";

async function run() {
  console.log("🚀 Starting Schemes Module Test...\n");

  try {
    // 1. Test Scheme Creation
    console.log("📌 1) Testing createScheme()...");

    const newSchemeData: CreateSchemeInput = {
      schemeId: `TEST-EDU-${Date.now()}`, // Unique ID for testing
      title: "PM-AJAY Test Scholarship for 12th Pass",
      schemeType: "education",
      baseCriteria: {
        incomeLevel: "₹1,00,000 – ₹3,00,000 per year",
        minEducation: "12th Pass",
      },
      extraFields: {
        textFields: [{ id: 1, label: "10th Board Name" }],
        fileFields: [{ id: 2, label: "Upload 12th Marksheet" }],
      },
      location: {
        state: "Uttar Pradesh",
        district: "Lucknow",
        pincode: "226021",
      },
    };

    const createdScheme = await SchemeService.createScheme(newSchemeData);
    console.log("✅ createScheme result:");
    console.dir(createdScheme, { depth: null });

    // 2. Test Listing Schemes
    console.log("\n📌 2) Testing listPublicSchemes() with default query...");
    const listResult = await SchemeService.listPublicSchemes({
      page: 1,
      pageSize: 5,
    });

    console.log("✅ listPublicSchemes result:");
    console.dir(listResult, { depth: null });

    const firstScheme = listResult.items[0];
    if (!firstScheme) {
      throw new Error("No schemes found after creation, cannot proceed.");
    }

    // 3. Test Getting a Scheme by ID
    console.log(
      "\n📌 3) Testing getSchemeById() with the newly created scheme id..."
    );
    const scheme = await SchemeService.getSchemeById(firstScheme.id);

    console.log("✅ getSchemeById result:");
    console.dir(scheme, { depth: null });
  } catch (err) {
    console.error("❌ Test failed:", err);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Prisma disconnected. Test finished.");
  }
}

run();
