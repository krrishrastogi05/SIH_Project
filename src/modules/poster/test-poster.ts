import "dotenv/config";
import { prisma } from "../../db/prisma.js";
import { PosterService } from "./poster.service.js";

async function run() {
  console.log("🚀 Starting Poster Module Test...\n");

  try {
    // 1) Create a poster
    console.log("📌 1) Creating poster...");
    const poster = await PosterService.createPoster({
      name: "Test Poster (script)",
      type: "NGO",
      phone: `90000${Math.floor(Math.random() * 90000) + 10000}`,
      email: `poster.test+${Date.now()}@example.com`,
      state: "Uttar Pradesh",
      district: "Lucknow",
      block: "Bakshi Ka Talab"
    } as any); // cast only for test convenience

    console.log("✅ Poster created:", {
      id: poster.id,
      name: poster.name,
      email: poster.email
    });

    // 2) Create a scheme for this poster
    console.log("\n📌 2) Creating scheme for poster...");
    const scheme = await PosterService.createScheme(poster.id, {
      title: "Test Scheme from script",
      description: "This is a test scheme created by test-poster.ts",
      incomeRequired: true,
      minIncome: 0,
      maxIncome: 150000,
      regionType: "district",
      state: poster.state || "Uttar Pradesh",
      district: poster.district || "Lucknow",
      block: poster.block || "Bakshi Ka Talab",
      jobType: "General",
      paymentInfo: { stipend: 1000 },
      additionalDocs: { required: ["Aadhaar"] }
    });

    console.log("✅ Scheme created (pending):", {
      id: scheme.id,
      title: scheme.title,
      status: scheme.status
    });

    // 3) List poster's schemes (pagination)
    console.log("\n📌 3) Listing poster schemes...");
    const list = await PosterService.listPosterSchemes(poster.id, 1, 10);
    console.log("✅ Poster schemes list:");
    console.dir(list, { depth: null });

    // 4) Fetch poster by id
    console.log("\n📌 4) Fetching poster by id...");
    const fetched = await PosterService.getPosterById(poster.id);
    console.log("✅ Fetched poster:");
    console.dir(fetched, { depth: null });

  } catch (err) {
    console.error("❌ Poster test failed:", err);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Prisma disconnected. Test finished.");
  }
}

run();
