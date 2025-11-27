import { prisma } from "../../db/prisma.js";
import bcrypt from "bcryptjs";
import { signToken } from "../../utils/jwt.js";
import { RegisterInput, LoginInput } from "./auth.schema.js";

export class AuthService {
  async register(data: RegisterInput) {
    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (exists) throw new Error("User already exists");

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashed,
        role: data.role,
      },
    });

    const token = signToken({ id: user.id, role: user.role });

    return { user, token };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) throw new Error("Invalid credentials");

    const match = await bcrypt.compare(data.password, user.password as string);
    if (!match) throw new Error("Invalid credentials");

    const token = signToken({ id: user.id, role: user.role });

    return { user, token };
  }
}
