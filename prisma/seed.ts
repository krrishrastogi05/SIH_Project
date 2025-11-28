import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/db/prisma.js";

async function seed() {
  console.log("🌱 Starting Full Seed...");

  // Password hash
  const hashedPassword = await bcrypt.hash("Password123", 10);

  // -----------------------------------------
  // 1️⃣ CREATE ADMIN + OFFICER
  // -----------------------------------------
  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      phone: "9000010000",
      email: "admin@example.com",
      password: hashedPassword,
      role: "ADMIN"
    }
  });

  const officer = await prisma.user.create({
    data: {
      name: "District Officer",
      phone: "9000010001",
      email: "officer@example.com",
      password: hashedPassword,
      role: "OFFICER",
      state: "Uttar Pradesh",
      district: "Lucknow",
      block: "Bakshi Ka Talab"
    }
  });

  console.log("✔ Admin + Officer created");

  // -----------------------------------------
  // 2️⃣ SCHEME POSTERS
  // -----------------------------------------
  const posters = [];
  for (let i = 1; i <= 5; i++) {
    posters.push(
      await prisma.schemePoster.create({
        data: {
          name: `Scheme Poster ${i}`,
          type: i % 2 === 0 ? "NGO" : "GOV",
          phone: `90000200${i}`,
          email: `poster${i}@example.com`,
          state: "Uttar Pradesh",
          district: "Lucknow",
          block: "Bakshi Ka Talab"
        }
      })
    );
  }

  console.log("✔ Scheme Posters created:", posters.length);

  // -----------------------------------------
  // 3️⃣ SCHEME POSTS
  // -----------------------------------------
  const schemes = [];
  const schemeTitles = [
    "Youth Skill Development",
    "Rural Employment Yojana",
    "Women Financial Aid",
    "Farmer Support Benefit",
    "Urban Employment Scheme"
  ];

  for (let i = 0; i < 5; i++) {
    schemes.push(
      await prisma.schemePost.create({
        data: {
          posterId: posters[i].id,
          title: schemeTitles[i],
          description: "Dummy scheme description for testing.",
          incomeRequired: true,
          minIncome: 0,
          maxIncome: 200000,
          regionType: "district",
          state: "Uttar Pradesh",
          district: "Lucknow",
          block: "Bakshi Ka Talab",
          jobType: "General",
          paymentInfo: { stipend: 1500 + i * 500 },
          additionalDocs: { required: ["Aadhaar", "PAN"] },
          status: i % 2 === 0 ? "APPROVED" : "PENDING"
        }
      })
    );
  }

  console.log("✔ Schemes created:", schemes.length);

  // -----------------------------------------
  // 4️⃣ ENUMERATORS
  // -----------------------------------------
  const enumerators = [];
  for (let i = 1; i <= 5; i++) {
    enumerators.push(
      await prisma.user.create({
        data: {
          name: `Enumerator ${i}`,
          phone: `90000300${i}`,
          email: `enumerator${i}@example.com`,
          password: hashedPassword,
          role: "ENUMERATOR",
          state: "Uttar Pradesh",
          district: "Lucknow",
          block: "Bakshi Ka Talab"
        }
      })
    );
  }

  console.log("✔ Enumerators created:", enumerators.length);

  // -----------------------------------------
  // 5️⃣ BENEFICIARIES
  // -----------------------------------------
  const beneficiaries = [];
  for (let i = 1; i <= 10; i++) {
    beneficiaries.push(
      await prisma.user.create({
        data: {
          name: `Beneficiary ${i}`,
          phone: `90000400${i}`,
          email: `beneficiary${i}@example.com`,
          password: hashedPassword,
          role: "BENEFICIARY",
          state: "Uttar Pradesh",
          district: "Lucknow",
          block: "Bakshi Ka Talab",
          income: 50000 + i * 5000,
          age: 20 + i,
          gender: i % 2 === 0 ? "Male" : "Female"
        }
      })
    );
  }

  console.log("✔ Beneficiaries created:", beneficiaries.length);

  // -----------------------------------------
  // 6️⃣ CREATE SCHEME FEED MAPPING (Eligibility)
  // -----------------------------------------
  const approvedSchemes = schemes.filter((s) => s.status === "APPROVED");

  for (const b of beneficiaries) {
    for (const s of approvedSchemes) {
      await prisma.schemeFeed.create({
        data: {
          userId: b.id,
          schemeId: s.id,
          eligibilityScore: Math.floor(Math.random() * 60) + 40,
          status: "NOTIFIED"
        }
      });
    }
  }

  console.log("✔ Scheme Feed entries created");

  // -----------------------------------------
  // 7️⃣ OPTIONAL VERIFICATION (Initial Dummy)
  // -----------------------------------------
  await prisma.beneficiaryVerification.create({
    data: {
      userId: beneficiaries[0].id,
      schemeId: approvedSchemes[0].id,
      enumeratorId: enumerators[0].id,
      status: "UNDER_REVIEW",
      remarks: "Initial dummy verification",
      documents: {
        aadhaar: "https://dummyimage.com/aadhar.png",
        pan: "https://dummyimage.com/pan.png"
      }
    }
  });

  console.log("✔ Verification entry created");

  // -----------------------------------------
  console.log("🎉 FULL SEED COMPLETED SUCCESSFULLY");
}

seed()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
