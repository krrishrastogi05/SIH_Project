import "dotenv/config";
import { prisma } from "../db/prisma.js";
import { checkEligibility } from "../utils/eligibilityEngine.js";

async function forceRun() {
  console.log("🛠️  Starting Manual Engine Run...");

  // 1. Find the Approved Scheme
  const scheme = await prisma.scheme.findFirst({
    where: { status: "APPROVED" } // Fetches the one you just approved
  });

  if (!scheme) {
    console.error("❌ No APPROVED scheme found. Please approve one in Officer Dashboard first.");
    return;
  }

  console.log(`✅ Found Scheme: ${scheme.title} (${scheme.schemeId})`);

  // 2. Fetch Beneficiaries
  const beneficiaries = await prisma.user.findMany({
    where: { 
      role: "BENEFICIARY", 
      verificationStatus: "VERIFIED",
      state: scheme.state !== "All" ? scheme.state : undefined
    },
  });

  console.log(`🔎 Checking ${beneficiaries.length} Verified Beneficiaries in ${scheme.state}...`);

  // 3. Run Logic
  let matches = 0;
  for (const user of beneficiaries) {
    const isEligible = checkEligibility(user, scheme);
    
    if (isEligible) {
        console.log(`   MATCH: ${user.name} (${user.phone}) is Eligible!`);
        matches++;

        // 4. Update Database
        await prisma.beneficiaryScheme.upsert({
            where: { beneficiaryId_schemeId: { beneficiaryId: user.id, schemeId: scheme.id } },
            update: { status: "ELIGIBLE" },
            create: {
                beneficiaryId: user.id,
                schemeId: scheme.id,
                status: "ELIGIBLE",
            },
        });
    } else {
        console.log(`   NO MATCH: ${user.name} - Criteria mismatch.`);
    }
  }

  console.log(`\n🎉 Process Complete. Total Matches: ${matches}`);
}

forceRun()
  .catch(console.error)
  .finally(() => prisma.$disconnect());