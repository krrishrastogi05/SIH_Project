import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting local demo database seed...");

  await prisma.beneficiaryScheme.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.scheme.deleteMany();
  await prisma.user.deleteMany();
  console.log("Cleared existing demo data.");

  const password = await bcrypt.hash("123456", 10);

  const officer = await prisma.user.create({
    data: {
      name: "Rajesh Officer",
      phone: "9999999999",
      password,
      role: "OFFICER",
    },
  });

  const rohan = await prisma.user.create({
    data: {
      name: "Rohan Kumar",
      phone: "9000000001",
      password,
      role: "BENEFICIARY",
      age: 20,
      gender: "MALE",
      income: 45000,
      occupation: "Student",
      education: "GRADUATION",
      state: "Uttar Pradesh",
      district: "Lucknow",
      pincode: "226001",
      bankAccount: "111122223333",
      ifsc: "SBIN0001234",
    },
  });

  const amit = await prisma.user.create({
    data: {
      name: "Amit Singh",
      phone: "9000000002",
      password,
      role: "BENEFICIARY",
      age: 22,
      gender: "MALE",
      income: 150000,
      occupation: "Student",
      education: "GRADUATION",
      state: "Uttar Pradesh",
      district: "Lucknow",
      pincode: "226002",
      bankAccount: "222233334444",
      ifsc: "HDFC0001234",
    },
  });

  const sneha = await prisma.user.create({
    data: {
      name: "Sneha Sharma",
      phone: "9000000003",
      password,
      role: "BENEFICIARY",
      age: 19,
      gender: "FEMALE",
      income: 30000,
      occupation: "Student",
      education: "HIGHER_SECONDARY",
      state: "Delhi",
      district: "New Delhi",
      pincode: "110001",
      bankAccount: "333344445555",
      ifsc: "ICIC0001234",
    },
  });

  const kavita = await prisma.user.create({
    data: {
      name: "Kavita Devi",
      phone: "9000000004",
      password,
      role: "BENEFICIARY",
      age: 34,
      gender: "FEMALE",
      income: 60000,
      occupation: "Self Employed",
      education: "MATRICULATION",
      state: "Uttar Pradesh",
      district: "Varanasi",
      pincode: "221001",
      bankAccount: "444455556666",
      ifsc: "PUNB0001234",
    },
  });

  const scholarship = await prisma.scheme.create({
    data: {
      title: "UP Student Scholarship",
      description: "Scholarship support for low-income students in Uttar Pradesh.",
      schemeType: "education",
      state: "Uttar Pradesh",
      district: "All",
      amount: 12000,
      baseCriteria: {
        incomeLimit: 50000,
        minAge: 18,
        maxAge: 25,
        occupation: "Student",
        minEducation: "HIGHER_SECONDARY",
      },
    },
  });

  const womenSupport = await prisma.scheme.create({
    data: {
      title: "Women Entrepreneurship Support",
      description: "Financial support for low-income women entrepreneurs.",
      schemeType: "financial",
      state: "Uttar Pradesh",
      district: "All",
      amount: 25000,
      baseCriteria: {
        incomeLimit: 80000,
        minAge: 21,
        gender: "FEMALE",
        occupation: "Self Employed",
      },
    },
  });

  const housing = await prisma.scheme.create({
    data: {
      title: "National Housing Assistance",
      description: "Basic housing assistance for eligible low-income citizens.",
      schemeType: "housing",
      state: "All",
      district: "All",
      amount: 50000,
      baseCriteria: {
        incomeLimit: 75000,
        minAge: 18,
      },
    },
  });

  await prisma.beneficiaryScheme.createMany({
    data: [
      { userId: rohan.id, schemeId: scholarship.id, status: "ELIGIBLE" },
      { userId: rohan.id, schemeId: housing.id, status: "APPROVED" },
      { userId: sneha.id, schemeId: housing.id, status: "ELIGIBLE" },
      { userId: kavita.id, schemeId: womenSupport.id, status: "ELIGIBLE" },
      { userId: kavita.id, schemeId: housing.id, status: "APPLIED" },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: rohan.id,
        message: `You are eligible for ${scholarship.title}.`,
      },
      {
        userId: rohan.id,
        message: `${housing.title} is approved and ready for payment testing.`,
      },
      {
        userId: sneha.id,
        message: `You are eligible for ${housing.title}.`,
      },
      {
        userId: kavita.id,
        message: `You are eligible for ${womenSupport.title}.`,
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo login password for all users: 123456");
  console.table([
    { role: officer.role, name: officer.name, phone: officer.phone },
    { role: rohan.role, name: rohan.name, phone: rohan.phone },
    { role: amit.role, name: amit.name, phone: amit.phone },
    { role: sneha.role, name: sneha.name, phone: sneha.phone },
    { role: kavita.role, name: kavita.name, phone: kavita.phone },
  ]);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
