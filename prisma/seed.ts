import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Seed...");

  // Optional: Uncomment these if you want a FULL RESET every time
  // await prisma.beneficiaryScheme.deleteMany();
  // await prisma.scheme.deleteMany();
  // await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // ===========================================
  // 1. CREATE ACTORS (Officer & Poster)
  // ===========================================
  
  const officer = await prisma.user.upsert({
    where: { email: "officer@gov.in" },
    update: {},
    create: {
      name: "District Officer",
      email: "officer@gov.in",
      phone: "9999999999", // Dummy phone
      password: passwordHash,
      role: "OFFICER",
      state: "Uttar Pradesh",
      district: "Lucknow",
      scId: "OFFICER001"
    },
  });
  console.log("✅ Officer Created: officer@gov.in");

  const poster = await prisma.user.upsert({
    where: { email: "poster@gov.in" },
    update: {},
    create: {
      name: "Ministry Poster",
      email: "poster@gov.in",
      phone: "8888888888", // Dummy phone
      password: passwordHash,
      role: "POSTER",
      scId: "POSTER001"
    },
  });
  console.log("✅ Poster Created: poster@gov.in");

  // ===========================================
  // 2. CREATE SCHEMES (PENDING APPROVAL)
  // ===========================================
  
  // Scheme A: Education (Low Income, 12th Pass)
  await prisma.scheme.upsert({
    where: { schemeId: "SCH-EDU-2025" },
    update: {},
    create: {
      schemeId: "SCH-EDU-2025",
      title: "PM-AJAY Merit Scholarship 2025",
      schemeType: "education",
      state: "Uttar Pradesh",
      district: "Lucknow",
      pincode: "All",
      status: "PENDING", 
      posterId: poster.id,
      baseCriteria: { incomeLevel: "300000", minEducation: "HIGHER_SECONDARY" },
      extraFields: { 
        textFields: [
          { id: 1, label: "12th Percentage" },
          { id: 2, label: "School Name" }
        ], 
        fileFields: [
          { id: 3, label: "12th Marksheet" }
        ] 
      }
    }
  });

  // Scheme B: Housing (Very Low Income)
  await prisma.scheme.upsert({
    where: { schemeId: "SCH-HOUSE-2025" },
    update: {},
    create: {
      schemeId: "SCH-HOUSE-2025",
      title: "PM Awas Yojana (Rural)",
      schemeType: "housing",
      state: "Uttar Pradesh",
      district: "Lucknow",
      pincode: "All",
      status: "PENDING",
      posterId: poster.id,
      baseCriteria: { incomeLevel: "100000" }, // Must be < 1L
      extraFields: { 
        textFields: [{ id: 1, label: "House Type (Kutcha/Pucca)" }], 
        fileFields: [{ id: 2, label: "Land Document" }] 
      }
    }
  });

  // Scheme C: Employment (Age 18-35)
  await prisma.scheme.upsert({
    where: { schemeId: "SCH-JOB-2025" },
    update: {},
    create: {
      schemeId: "SCH-JOB-2025",
      title: "Youth Skill Development Program",
      schemeType: "employment",
      state: "Uttar Pradesh",
      district: "Lucknow",
      pincode: "All",
      status: "PENDING",
      posterId: poster.id,
      baseCriteria: { ageLimit: "35", minEducation: "MATRICULATION" }, 
      extraFields: { textFields: [], fileFields: [] }
    }
  });

  console.log("✅ Created 3 Pending Schemes");

  // ===========================================
  // 3. CREATE BENEFICIARIES
  // ===========================================

  // User 1: Rahul (Student) - Matches Education & Employment
  // Phone 9000011111 -> Will be overridden to YOUR number by Notification Worker
  await prisma.user.upsert({
    where: { phone: "9000011111" },
    update: {},
    create: {
      name: "Rahul Student",
      phone: "9000011111", 
      password: passwordHash,
      role: "BENEFICIARY",
      state: "Uttar Pradesh",
      district: "Lucknow",
      income: 150000, // 1.5L
      age: 20,
      education: "HIGHER_SECONDARY",
      aadhaar: "111111111111",
      scId: "BEN001"
    }
  });

  // User 2: Suresh (Laborer) - Matches Housing Only
  await prisma.user.upsert({
    where: { phone: "9000022222" },
    update: {},
    create: {
      name: "Suresh Worker",
      phone: "9000022222",
      password: passwordHash,
      role: "BENEFICIARY",
      state: "Uttar Pradesh",
      district: "Lucknow",
      income: 80000, // 0.8L (Eligible for Housing)
      age: 45,       // Too old for Employment (Limit 35)
      education: "MATRICULATION",
      aadhaar: "222222222222",
      scId: "BEN002"
    }
  });

  console.log("✅ Created Beneficiaries (Rahul & Suresh)");
  console.log("🎉 Seed Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });