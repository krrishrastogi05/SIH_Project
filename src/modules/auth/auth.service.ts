// backend/src/modules/auth/auth.service.ts

import { prisma } from "../../db/prisma.js";
import bcrypt from "bcryptjs";
import { signToken } from "../../utils/jwt.js";
import { RegisterInput, LoginInput } from "./auth.schema.js";

export class AuthService {

  // ----------------------------
  // CREATE SC ID
  // ----------------------------
  private async generateSCID(state?: string | null) {
    const stateCode = state
      ? state.substring(0, 2).toUpperCase()
      : "IN";

    const last = await prisma.user.findFirst({
      orderBy: { createdAt: "desc" }
    });

    const nextNum = last ? parseInt(last.scId?.split("-").pop() || "0") + 1 : 1;
    const padded = String(nextNum).padStart(5, "0");

    return `SC-${stateCode}-${padded}`;
  }

  // ----------------------------
  // REGISTER USER
  // ----------------------------
  async register(data: RegisterInput) {
    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (exists) {
      throw new Error("User already exists");
    }

    const hashed = await bcrypt.hash(data.password, 10);
    const scId = await this.generateSCID(null);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashed,
        role: data.role,
        scId,
        verificationStatus: "PENDING"
      },
    });

    const token = signToken({
      id: user.id,
      role: user.role,
      verificationStatus: user.verificationStatus
    });

    return { user, token };
  }

  // ----------------------------
  // LOGIN USER
  // ----------------------------
  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) throw new Error("Invalid credentials");

    const match = await bcrypt.compare(data.password, user.password as string);
    if (!match) throw new Error("Invalid credentials");

    // STRICT MODE: BLOCK LOGIN UNTIL VERIFIED
    if (user.role === "BENEFICIARY") {
      if (user.verificationStatus !== "VERIFIED") {
        return {
          blocked: true,
          status: user.verificationStatus,
          remarks: user.verificationRemarks
        };
      }
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      verificationStatus: user.verificationStatus
    });

    return { user, token, blocked: false };
  }
}
