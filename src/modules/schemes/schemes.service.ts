import { prisma } from "../../db/prisma.js";
import { CreateSchemeInput } from "./schemes.schema.js";
import type { z } from "zod";
import type { listSchemesQuerySchema } from "./schemes.schema.js";

export class SchemeService {
  static async createScheme(data: CreateSchemeInput) {
    const { location, ...schemeData } = data;

    return prisma.scheme.create({
      data: {
        ...schemeData,
        state: location.state,
        district: location.district,
        pincode: location.pincode,
      },
    });
  }

  static async listPublicSchemes(
    query: z.infer<typeof listSchemesQuerySchema>
  ) {
    const { page, pageSize, state, district, search } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (state) where.state = state;
    if (district) where.district = district;
    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    const [items, total] = await prisma.$transaction([
      prisma.scheme.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.scheme.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async getSchemeById(id: string) {
    return prisma.scheme.findUnique({
      where: { id },
    });
  }
}
