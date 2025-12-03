import { PrismaClient } from "@prisma/client";

// Revert to the simpler constructor for Prisma 5
export const prisma = new PrismaClient();
