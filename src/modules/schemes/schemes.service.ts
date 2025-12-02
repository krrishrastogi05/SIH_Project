import { prisma } from "../../db/prisma.js";
import { CreateSchemeInput } from "./schemes.schema.js";
import { SchemeStatus } from "@prisma/client";
import { eligibilityQueue } from "../../queue/queue.js"; // Import the queue

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
    return prisma.scheme.findUnique({ where: { id } });
  }

  static async updateSchemeStatus(schemeId: string, status: SchemeStatus) {
    const updatedScheme = await prisma.scheme.update({
      where: { id: schemeId },
      data: { status },
    });

    // If a scheme is approved, trigger the eligibility check worker
    if (updatedScheme.status === "APPROVED") {
      await eligibilityQueue.add("check-eligibility-for-scheme", {
        schemeId: updatedScheme.id,
      });
    }

    return updatedScheme;
  }

  // Add this new method to handle listing schemes with filters
  static async listPublic(query: {
    page?: string;
    limit?: string;
    schemeType?: string;
    state?: string;
    district?: string;
  }) {
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const skip = (page - 1) * limit;

    const whereClause: any = {
      status: "APPROVED", // Only show approved schemes to the public
    };

    if (query.schemeType) {
      whereClause.schemeType = query.schemeType;
    }
    if (query.state) {
      whereClause.state = { contains: query.state, mode: "insensitive" };
    }
    if (query.district) {
      whereClause.district = { contains: query.district, mode: "insensitive" };
    }

    const [schemes, total] = await prisma.$transaction([
      prisma.scheme.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.scheme.count({ where: whereClause }),
    ]);

    return {
      data: schemes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
