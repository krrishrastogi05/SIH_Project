// backend/src/modules/auth/auth.service.ts
import {prisma} from "../../db/prisma.js";
import bcrypt from "bcryptjs";
import { signToken } from "../../utils/jwt.js";
import {
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
} from "./auth.schema.js";
import {
  phoneLoginSchema,
  type PhoneLoginInput,
} from "./phone-login.schema.js";

export class AuthService {
  // ---------------------------- CREATE SC ID ----------------------------
  private async generateSCID(state?: string | null) {
    const stateCode = state ? state.substring(0, 2).toUpperCase() : "IN";

    const last = await prisma.user.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const nextNum = last
      ? parseInt(last.scId?.split("-").pop() || "0", 10) + 1
      : 1;

    const padded = String(nextNum).padStart(5, "0");
    return `SC-${stateCode}-${padded}`;
  }

  // ---------------------------- REGISTER USER ----------------------------
  async register(data: RegisterInput) {
    // validate again at service layer (optional)
    const parsed = registerSchema.parse(data);

    const exists = await prisma.user.findUnique({
      where: { email: parsed.email },
    });
    if (exists) throw new Error("User already exists");

    const hashed = await bcrypt.hash(parsed.password, 10);
    const scId = await this.generateSCID(null);

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        password: hashed,
        role: parsed.role,
        scId,
        verificationStatus: "PENDING",
      },
    });

    const token = signToken({
      id: user.id,
      role: user.role,
      verificationStatus: user.verificationStatus,
    });

    return { user, token };
  }

  // ---------------------------- LOGIN BY EMAIL (OFFICER/ADMIN) ----------------------------
  async login(data: LoginInput) {
    const parsed = loginSchema.parse(data);

    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (!user) throw new Error("Invalid credentials");

    const match = await bcrypt.compare(
      parsed.password,
      user.password as string
    );
    if (!match) throw new Error("Invalid credentials");

    // STRICT MODE: BLOCK BENEFICIARY UNTIL VERIFIED
    if (user.role === "BENEFICIARY") {
      if (user.verificationStatus !== "VERIFIED") {
        return {
          blocked: true,
          status: user.verificationStatus,
          remarks: user.verificationRemarks,
        };
      }
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      verificationStatus: user.verificationStatus,
    });

    return { user, token, blocked: false };
  }
// ---------------------------- LOGIN BY PHONE (BENEFICIARY) ----------------------------
async loginWithPhone(data: PhoneLoginInput) {
  const parsed = phoneLoginSchema.parse(data);

  const user = await prisma.user.findFirst({
    where: {
      phone: parsed.phone,
      role: "BENEFICIARY",
    },
  });

  if (!user) throw new Error("Invalid phone or password");

  const match = await bcrypt.compare(
    parsed.password,
    user.password as string
  );
  if (!match) throw new Error("Invalid phone or password");

  // DEV SIMULATION: auto-verify on first successful login
  if (user.verificationStatus !== "VERIFIED") {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { verificationStatus: "VERIFIED" },
    });
    user.verificationStatus = updated.verificationStatus;
  }

  const token = signToken({
    id: user.id,
    role: user.role,
    verificationStatus: user.verificationStatus,
  });

  return { user, token, blocked: false };
}

  
}

export default AuthService;
