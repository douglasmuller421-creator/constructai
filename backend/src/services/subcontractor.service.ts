import type { Prisma, Subcontractor, SubDocument } from "@prisma/client";
import prisma from "../config/database.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";

export interface CreateSubInput {
  companyName: string;
  tradingName?: string;
  registrationNo?: string;
  vatNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNo?: string;
  insuranceExpiry?: string;
  insuranceAmount?: number;
  employerLiabilityExpiry?: string;
  professionalIndemnityExpiry?: string;
  tradeCategories?: string[];
  skills?: string[];
  geographicCoverage?: string[];
  paymentTerms?: number;
  accreditationType?: string[];
  accreditationExpiry?: string;
  notes?: string;
}

export interface UpdateSubInput extends Partial<CreateSubInput> {
  status?: "ACTIVE" | "SUSPENDED" | "BLACKLISTED";
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  rating?: number;
}

export interface SubFilters {
  status?: string;
  riskLevel?: string;
  tradeCategory?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function createSub(userId: string, input: CreateSubInput): Promise<Subcontractor> {
  const sub = await prisma.subcontractor.create({
    data: {
      ...input,
      insuranceExpiry: input.insuranceExpiry ? new Date(input.insuranceExpiry) : undefined,
      employerLiabilityExpiry: input.employerLiabilityExpiry ? new Date(input.employerLiabilityExpiry) : undefined,
      professionalIndemnityExpiry: input.professionalIndemnityExpiry ? new Date(input.professionalIndemnityExpiry) : undefined,
      accreditationExpiry: input.accreditationExpiry ? new Date(input.accreditationExpiry) : undefined,
      createdBy: userId,
      tradeCategories: input.tradeCategories?.join(",") ?? "",
      skills: input.skills?.join(",") ?? "",
      geographicCoverage: input.geographicCoverage?.join(",") ?? "",
      accreditationType: input.accreditationType?.join(",") ?? "",
    },
  });
  return sub;
}

export async function listSubs(userId: string, filters: SubFilters) {
  const { status, riskLevel, tradeCategory, search, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.SubcontractorWhereInput = {
    ...(status ? { status: status as any } : {}),
    ...(riskLevel ? { riskLevel: riskLevel as any } : {}),
    ...(tradeCategory ? { tradeCategories: { has: tradeCategory } } : {}),
    ...(search ? {
      OR: [
        { companyName: { contains: search, mode: "insensitive" } },
        { tradingName: { contains: search, mode: "insensitive" } },
        { registrationNo: { contains: search, mode: "insensitive" } },
        { primaryContactName: { contains: search, mode: "insensitive" } },
        { postcode: { contains: search, mode: "insensitive" } },
      ],
    } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.subcontractor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { companyName: "asc" },
      include: {
        documents: {
          where: { status: "VERIFIED" },
          orderBy: { expiryDate: "asc" },
          take: 5,
        },
        _count: { select: { documents: true, endorsements: true, bids: true } },
      },
    }),
    prisma.subcontractor.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
}

export async function getSubById(userId: string, subId: string): Promise<Subcontractor> {
  const sub = await prisma.subcontractor.findUnique({
    where: { id: subId },
    include: {
      documents: {
        orderBy: { expiryDate: "asc" },
      },
      endorsements: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      bids: {
        include: { bidPackage: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!sub) {
    throw new NotFoundError("Subcontractor not found");
  }

  return sub;
}

export async function updateSub(userId: string, subId: string, input: UpdateSubInput): Promise<Subcontractor> {
  const existing = await prisma.subcontractor.findUnique({ where: { id: subId } });
  if (!existing) {
    throw new NotFoundError("Subcontractor not found");
  }

  const sub = await prisma.subcontractor.update({
    where: { id: subId },
    data: {
      ...input,
      insuranceExpiry: input.insuranceExpiry ? new Date(input.insuranceExpiry) : undefined,
      employerLiabilityExpiry: input.employerLiabilityExpiry ? new Date(input.employerLiabilityExpiry) : undefined,
      professionalIndemnityExpiry: input.professionalIndemnityExpiry ? new Date(input.professionalIndemnityExpiry) : undefined,
      accreditationExpiry: input.accreditationExpiry ? new Date(input.accreditationExpiry) : undefined,
    },
  });

  return sub;
}

export async function deleteSub(userId: string, subId: string): Promise<void> {
  const existing = await prisma.subcontractor.findUnique({ where: { id: subId } });
  if (!existing) {
    throw new NotFoundError("Subcontractor not found");
  }
  await prisma.subcontractor.delete({ where: { id: subId } });
}

export async function addDocument(
  userId: string,
  subId: string,
  input: { documentType: string; documentRef?: string; documentUrl?: string; issueDate?: string; expiryDate?: string; notes?: string }
): Promise<SubDocument> {
  const sub = await prisma.subcontractor.findUnique({ where: { id: subId } });
  if (!sub) {
    throw new NotFoundError("Subcontractor not found");
  }

  const doc = await prisma.subDocument.create({
    data: {
      subcontractorId: subId,
      documentType: input.documentType as any,
      documentRef: input.documentRef,
      documentUrl: input.documentUrl,
      issueDate: input.issueDate ? new Date(input.issueDate) : undefined,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
      notes: input.notes,
    },
  });

  return doc;
}

export async function verifyDocument(userId: string, subId: string, docId: string): Promise<SubDocument> {
  const doc = await prisma.subDocument.findFirst({
    where: { id: docId, subcontractorId: subId },
  });

  if (!doc) {
    throw new NotFoundError("Document not found");
  }

  return prisma.subDocument.update({
    where: { id: docId },
    data: {
      status: "VERIFIED",
      verifiedBy: userId,
      verifiedAt: new Date(),
    },
  });
}

export async function getComplianceStatus(userId: string) {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const subs = await prisma.subcontractor.findMany({
    where: { status: "ACTIVE" },
    include: {
      documents: {
        where: { status: { in: ["VERIFIED", "PENDING"] } },
        orderBy: { expiryDate: "asc" },
      },
    },
  });

  const compliance = subs.map((sub) => {
    const issues: string[] = [];
    let overallStatus: "COMPLIANT" | "EXPIRING_SOON" | "EXPIRED" | "MISSING" = "COMPLIANT";

    // Check public liability insurance
    if (!sub.insuranceExpiry) {
      issues.push("Public liability insurance: not recorded");
      overallStatus = "MISSING";
    } else if (sub.insuranceExpiry < now) {
      issues.push(`Public liability insurance: expired ${sub.insuranceExpiry.toISOString().split("T")[0]}`);
      overallStatus = "EXPIRED";
    } else if (sub.insuranceExpiry < thirtyDaysFromNow) {
      issues.push(`Public liability insurance: expires ${sub.insuranceExpiry.toISOString().split("T")[0]}`);
      if ((overallStatus as string) !== "EXPIRED") overallStatus = "EXPIRING_SOON";
    }

    // Check employer's liability
    if (!sub.employerLiabilityExpiry) {
      issues.push("Employer's liability: not recorded");
      if (overallStatus === "COMPLIANT") overallStatus = "MISSING";
    } else if (sub.employerLiabilityExpiry < now) {
      issues.push(`Employer's liability: expired ${sub.employerLiabilityExpiry.toISOString().split("T")[0]}`);
      if (overallStatus !== "EXPIRED") overallStatus = "EXPIRED";
    } else if (sub.employerLiabilityExpiry < thirtyDaysFromNow) {
      issues.push(`Employer's liability: expires ${sub.employerLiabilityExpiry.toISOString().split("T")[0]}`);
      if (overallStatus === "COMPLIANT") overallStatus = "EXPIRING_SOON";
    }

    // Check accreditation
    if (!sub.accreditationExpiry) {
      // Not all subs need accreditation
    } else if (sub.accreditationExpiry < now) {
      issues.push(`Accreditation: expired ${sub.accreditationExpiry.toISOString().split("T")[0]}`);
      if (overallStatus === "COMPLIANT") overallStatus = "EXPIRED";
    } else if (sub.accreditationExpiry < thirtyDaysFromNow) {
      issues.push(`Accreditation: expires ${sub.accreditationExpiry.toISOString().split("T")[0]}`);
      if (overallStatus === "COMPLIANT") overallStatus = "EXPIRING_SOON";
    }

    return {
      subcontractorId: sub.id,
      companyName: sub.companyName,
      status: sub.status,
      overallStatus,
      issues,
      insuranceExpiry: sub.insuranceExpiry?.toISOString() ?? null,
      accreditationExpiry: sub.accreditationExpiry?.toISOString() ?? null,
    };
  });

  const summary = {
    total: subs.length,
    compliant: compliance.filter((c) => c.overallStatus === "COMPLIANT").length,
    expiringSoon: compliance.filter((c) => c.overallStatus === "EXPIRING_SOON").length,
    expired: compliance.filter((c) => c.overallStatus === "EXPIRED").length,
    missing: compliance.filter((c) => c.overallStatus === "MISSING").length,
  };

  return { summary, subs: compliance };
}