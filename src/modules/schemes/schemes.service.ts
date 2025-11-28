import { prisma } from "../../db/prisma.js";
import {
  CreateSchemeInput,
  ListSchemesQueryInput
} from "./schemes.schema.js";

export class SchemesService {
  static async listPublicSchemes(query: ListSchemesQueryInput) {
    const { state, district, block, search, page, pageSize } = query;

    const where: any = {
      status: "APPROVED"
    };

    if (state) where.state = state;
    if (district) where.district = district;
    if (block) where.block = block;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.schemePost.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" }
      }),
      prisma.schemePost.count({ where })
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  static async getSchemeById(id: string) {
    return prisma.schemePost.findUnique({
      where: { id }
    });
  }

  // For later use by poster/officer modules
  static async createScheme(data: CreateSchemeInput) {
    return prisma.schemePost.create({
      data: {
        posterId: data.posterId,
        title: data.title,
        description: data.description,
        incomeRequired: data.incomeRequired,
        minIncome: data.minIncome ?? null,
        maxIncome: data.maxIncome ?? null,
        regionType: data.regionType,
        state: data.state,
        district: data.district,
        block: data.block,
        jobType: data.jobType,
        paymentInfo: data.paymentInfo ?? {},
        additionalDocs: data.additionalDocs ?? {},
        status: "PENDING"
      }
    });
  }
}
