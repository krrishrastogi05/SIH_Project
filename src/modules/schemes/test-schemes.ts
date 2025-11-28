import "dotenv/config";
import { prisma } from "../../db/prisma.js";
import { SchemesService } from "./schemes.service.js";

async function run() {
  console.log("🚀 Starting Schemes Module Test...\n");

  try {
    console.log("📌 1) Testing listPublicSchemes() with default query...");
    const listResult = await SchemesService.listPublicSchemes({
      state: undefined,
      district: undefined,
      block: undefined,
      search: undefined,
      page: 1,
      pageSize: 5
    });

    console.log("✅ listPublicSchemes result:");
    console.dir(listResult, { depth: null });

    const firstScheme = listResult.items[0];
    if (!firstScheme) {
      console.log("\n⚠️ No schemes found. Make sure you've run your seed first.");
      return;
    }

    console.log("\n📌 2) Testing getSchemeById() with the first scheme id...");
    const scheme = await SchemesService.getSchemeById(firstScheme.id);

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
