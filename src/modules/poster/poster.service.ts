import { prisma } from "../../db/prisma.js";
import { CreatePosterInput, CreateSchemeInput } from "./poster.schema.js";

export class PosterService {
  static async createPoster(data: CreatePosterInput) {
    return prisma.schemePoster.create({
      data: {
        name: data.name,
        type: data.type,
        phone: data.phone,
        email: data.email ?? null,
        state: data.state ?? null,
        district: data.district ?? null,
        block: data.block ?? null
      }
    });
  }

  static async getPosterById(posterId: string) {
    return prisma.schemePoster.findUnique({
      where: { id: posterId },
      include: { schemes: true }
    });
  }

  static async createScheme(posterId: string, data: CreateSchemeInput) {
    // ensure poster exists
    const poster = await prisma.schemePoster.findUnique({ where: { id: posterId } });
    if (!poster) throw new Error("Poster not found");

    return prisma.schemePost.create({
      data: {
        posterId,
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

  static async listPosterSchemes(posterId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.schemePost.findMany({
        where: { posterId },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" }
      }),
      prisma.schemePost.count({ where: { posterId } })
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
}
