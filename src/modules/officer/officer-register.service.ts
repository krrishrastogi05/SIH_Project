// backend/src/modules/officer/officer-register.service.ts
import { prisma } from "../../db/prisma.js";
import bcrypt from "bcryptjs";
import { OfficerRegisterInput } from "./officer-register.schema.js";

export class OfficerRegisterService {
  // Generate unique scId (OFFICER001, OFFICER002, etc.)
  static async generateScId(): Promise<string> {
    const lastUser = await prisma.user.findFirst({
      where: { scId: { startsWith: "OFFICER" } },
      orderBy: { scId: "desc" },
    });

    if (!lastUser || !lastUser.scId) {
      return "OFFICER001";
    }

    const lastNumber = parseInt(lastUser.scId.replace("OFFICER", ""));
    const newNumber = lastNumber + 1;
    return `OFFICER${String(newNumber).padStart(3, "0")}`;
  }

  // Main registration logic
  static async register(data: OfficerRegisterInput) {
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw new Error("Email already registered");
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

    // Create officer user
    const user = await prisma.user.create({
      data: {
        scId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: "OFFICER", // Backend sets role, not frontend
        state: data.state,
        district: data.district,
        pincode: data.pincode,
        verificationStatus: "VERIFIED", // Officers are pre-verified
      },
      select: {
        id: true,
        scId: true,
        name: true,
        email: true,
        phone: true,
        state: true,
        district: true,
        pincode: true,
        verificationStatus: true,
        createdAt: true,
      },
    });

    return user;
  }
}
