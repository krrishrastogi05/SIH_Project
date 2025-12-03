import { prisma } from "../../db/prisma.js";
import { CreateSchemeInput } from "./schemes.schema.js";

export class SchemeService {
  static async createScheme(data: CreateSchemeInput, posterId?: string) {
    const { location, ...schemeData } = data;

    // Create entry in 'Scheme' table with PENDING status
    return prisma.scheme.create({
      data: {
        schemeId: schemeData.schemeId,
        title: schemeData.title,
        schemeType: schemeData.schemeType,
        baseCriteria: schemeData.baseCriteria,
        extraFields: schemeData.extraFields, // Save the dynamic form config
        
        state: location.state,
        district: location.district,
        pincode: location.pincode || "All",
        
        status: "PENDING", // Default
        posterId: posterId, 
      },
    });
  }

  // List Approved Schemes (Public)
  static async listPublicSchemes() {
    return prisma.scheme.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    });
  }
}