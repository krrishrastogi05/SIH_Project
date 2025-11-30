import { prisma } from "../../db/prisma.js";
import bcrypt from "bcryptjs";
import { BeneficiaryRegisterInput } from "./beneficiary-register.schema.js";

export class BeneficiaryRegisterService {
  
  // Generate unique scId (SC000001, SC000002, etc.)
  static async generateScId(): Promise<string> {
    const lastUser = await prisma.user.findFirst({
      where: { scId: { startsWith: "SC" } },
      orderBy: { scId: "desc" },
    });

    if (!lastUser || !lastUser.scId) {
      return "SC000001";
    }

    const lastNumber = parseInt(lastUser.scId.replace("SC", ""));
    const newNumber = lastNumber + 1;
    return `SC${String(newNumber).padStart(6, "0")}`;
  }

  // Main registration logic
  static async register(data: BeneficiaryRegisterInput) {
    // Check if aadhaar already exists
    const existingAadhaar = await prisma.user.findUnique({
      where: { aadhaar: data.aadhaar },
    });
    if (existingAadhaar) {
      throw new Error("Aadhaar number already registered");
    }

    // Check if phone already exists
    const existingPhone = await prisma.user.findFirst({
      where: { phone: data.phone },
    });
    if (existingPhone) {
      throw new Error("Phone number already registered");
    }

    // Generate unique scId
    const scId = await this.generateScId();

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create beneficiary user
    const user = await prisma.user.create({
      data: {
        scId,
        name: data.name,
        aadhaar: data.aadhaar,
        age: data.age,
        gender: data.gender,
        phone: data.phone,
        password: hashedPassword,
        role: "BENEFICIARY",
        state: data.state,
        district: data.district,
        income: data.income,
        bankAccount: data.bankAccount,
        ifsc: data.ifsc,
        education: data.educationLevel,
        casteCert: data.casteCert,
        incomeCert: data.incomeCert,
        profileImage: data.profileImage,
        verificationStatus: "PENDING",
      },
      select: {
        id: true,
        scId: true,
        name: true,
        phone: true,
        aadhaar: true,
        state: true,
        district: true,
        verificationStatus: true,
        createdAt: true,
      },
    });

    return user;
  }
}

