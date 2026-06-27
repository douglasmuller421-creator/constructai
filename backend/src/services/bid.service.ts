import type { Prisma, BidPackage, Bid, BidLineItem } from "@prisma/client";
import prisma from "../config/database.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";

// ─── Bid Package Operations ─────────────────────────────────────────────────────

export interface CreateBidPackageInput {
  projectId: string;
  name: string;
  reference?: string;
  description?: string;
  scopeOfWork?: string;
  specificationRef?: string;
  contractType?: string;
  estimatedValue?: number;
  tenderDate?: string;
  submissionDeadline?: string;
  siteVisitDate?: string;
  queriesDeadline?: string;
  invitedSubs?: string[];
}

export interface UpdateBidPackageInput extends Partial<CreateBidPackageInput> {
  status?: "DRAFT" | "ISSUED" | "CLOSED" | "AWARDED" | "CANCELLED";
}

export async function createBidPackage(userId: string, input: CreateBidPackageInput): Promise<BidPackage> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, ownerId: userId },
  });
  if (!project) throw new NotFoundError("Project not found");

  return prisma.bidPackage.create({
    data: {
      ...input,
      tenderDate: input.tenderDate ? new Date(input.tenderDate) : undefined,
      submissionDeadline: input.submissionDeadline ? new Date(input.submissionDeadline) : undefined,
      siteVisitDate: input.siteVisitDate ? new Date(input.siteVisitDate) : undefined,
      queriesDeadline: input.queriesDeadline ? new Date(input.queriesDeadline) : undefined,
      invitedSubs: input.invitedSubs ?? [],
      createdBy: userId,
      status: "DRAFT",
    },
  });
}

export async function listBidPackages(userId: string, filters: { projectId?: string; status?: string; page?: number; limit?: number }) {
  const { projectId, status, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.BidPackageWhereInput = {
    ...(projectId ? { projectId } : {}),
    ...(status ? { status: status as any } : {}),
    project: { ownerId: userId },
  };

  const [items, total] = await Promise.all([
    prisma.bidPackage.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { bids: true } },
      },
    }),
    prisma.bidPackage.count({ where }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page < Math.ceil(total / limit), hasPrev: page > 1 },
  };
}

export async function getBidPackageById(userId: string, packageId: string) {
  const pkg = await prisma.bidPackage.findFirst({
    where: { id: packageId, project: { ownerId: userId } },
    include: {
      project: { select: { id: true, name: true, location: true } },
      bids: {
        include: {
          subcontractor: { select: { id: true, companyName: true, rating: true, riskLevel: true } },
          _count: { select: { lineItems: true, attachments: true } },
        },
        orderBy: { totalAmount: "asc" },
      },
    },
  });

  if (!pkg) throw new NotFoundError("Bid package not found");
  return pkg;
}

export async function updateBidPackage(userId: string, packageId: string, input: UpdateBidPackageInput) {
  const existing = await prisma.bidPackage.findFirst({
    where: { id: packageId, project: { ownerId: userId } },
  });
  if (!existing) throw new NotFoundError("Bid package not found");

  return prisma.bidPackage.update({
    where: { id: packageId },
    data: {
      ...input,
      tenderDate: input.tenderDate ? new Date(input.tenderDate) : undefined,
      submissionDeadline: input.submissionDeadline ? new Date(input.submissionDeadline) : undefined,
    },
  });
}

export async function inviteSubs(userId: string, packageId: string, subIds: string[]) {
  const pkg = await prisma.bidPackage.findFirst({
    where: { id: packageId, project: { ownerId: userId } },
  });
  if (!pkg) throw new NotFoundError("Bid package not found");

  // Create bids for each invited sub
  await Promise.all(
    subIds.map((subId) =>
      prisma.bid.upsert({
        where: {
          bidPackageId_subcontractorId: { bidPackageId: packageId, subcontractorId: subId },
        },
        create: {
          bidPackageId: packageId,
          subcontractorId: subId,
          status: "INVITED",
          invitedAt: new Date(),
        },
        update: {
          status: "INVITED",
          invitedAt: new Date(),
        },
      })
    )
  );

  // Update package status and invited list
  return prisma.bidPackage.update({
    where: { id: packageId },
    data: {
      invitedSubs: { push: subIds },
      status: pkg.status === "DRAFT" ? "ISSUED" : pkg.status,
    },
  });
}

export async function uninviteSub(userId: string, packageId: string, subId: string) {
  const pkg = await prisma.bidPackage.findFirst({
    where: { id: packageId, project: { ownerId: userId } },
  });
  if (!pkg) throw new NotFoundError("Bid package not found");

  // Delete the bid if not yet submitted
  await prisma.bid.deleteMany({
    where: { bidPackageId: packageId, subcontractorId: subId, status: "INVITED" },
  });

  return prisma.bidPackage.update({
    where: { id: packageId },
    data: { invitedSubs: pkg.invitedSubs.filter((id) => id !== subId) },
  });
}

export async function closeBidPackage(userId: string, packageId: string) {
  const pkg = await prisma.bidPackage.findFirst({
    where: { id: packageId, project: { ownerId: userId } },
  });
  if (!pkg) throw new NotFoundError("Bid package not found");

  return prisma.bidPackage.update({
    where: { id: packageId },
    data: { status: "CLOSED" },
  });
}

export async function awardBid(userId: string, packageId: string, bidId: string) {
  const pkg = await prisma.bidPackage.findFirst({
    where: { id: packageId, project: { ownerId: userId } },
  });
  if (!pkg) throw new NotFoundError("Bid package not found");

  // Award the winning bid, reject all others
  await prisma.$transaction([
    prisma.bid.update({ where: { id: bidId }, data: { status: "AWARDED" } }),
    prisma.bid.updateMany({
      where: { bidPackageId: packageId, id: { not: bidId } },
      data: { status: "REJECTED" },
    }),
    prisma.bidPackage.update({
      where: { id: packageId },
      data: { status: "AWARDED" },
    }),
  ]);

  return prisma.bidPackage.findUnique({
    where: { id: packageId },
    include: { bids: { include: { subcontractor: true } } },
  });
}

// ─── Bid Operations ─────────────────────────────────────────────────────────────

export interface CreateBidInput {
  bidPackageId: string;
  subcontractorId: string;
  totalAmount?: number;
  vatAmount?: number;
  grossAmount?: number;
  programmeDays?: number;
  programmeStart?: string;
  programmeEnd?: string;
  exclusions?: string[];
  qualifications?: string[];
  assumptions?: string;
  paymentTerms?: string;
  warrantyPeriod?: number;
  retentionPercentage?: number;
  notes?: string;
  lineItems?: CreateLineItemInput[];
}

export interface CreateLineItemInput {
  itemRef?: string;
  description: string;
  unit?: string;
  quantity?: number;
  rate?: number;
  amount?: number;
  category?: string;
  included?: boolean;
  notes?: string;
}

export async function createBid(userId: string, input: CreateBidInput): Promise<Bid> {
  const pkg = await prisma.bidPackage.findUnique({
    where: { id: input.bidPackageId },
  });
  if (!pkg) throw new NotFoundError("Bid package not found");

  return prisma.bid.create({
    data: {
      bidPackageId: input.bidPackageId,
      subcontractorId: input.subcontractorId,
      status: "SUBMITTED",
      submittedAt: new Date(),
      submittedBy: userId,
      totalAmount: input.totalAmount,
      vatAmount: input.vatAmount,
      grossAmount: input.grossAmount,
      programmeDays: input.programmeDays,
      programmeStart: input.programmeStart ? new Date(input.programmeStart) : undefined,
      programmeEnd: input.programmeEnd ? new Date(input.programmeEnd) : undefined,
      exclusions: input.exclusions ?? [],
      qualifications: input.qualifications ?? [],
      assumptions: input.assumptions,
      paymentTerms: input.paymentTerms,
      warrantyPeriod: input.warrantyPeriod,
      retentionPercentage: input.retentionPercentage,
      notes: input.notes,
      lineItems: input.lineItems ? { create: input.lineItems } : undefined,
    },
  });
}

export async function updateBid(userId: string, bidId: string, input: Partial<CreateBidInput>) {
  const existing = await prisma.bid.findFirst({
    where: { id: bidId },
    include: { bidPackage: { select: { project: { select: { ownerId: true } } } } },
  });
  if (!existing) throw new NotFoundError("Bid not found");
  if (existing.bidPackage.project.ownerId !== userId) throw new NotFoundError("Bid not found");

  const updateData: Prisma.BidUpdateInput = {};
  if (input.totalAmount !== undefined) updateData.totalAmount = input.totalAmount;
  if (input.vatAmount !== undefined) updateData.vatAmount = input.vatAmount;
  if (input.grossAmount !== undefined) updateData.grossAmount = input.grossAmount;
  if (input.programmeDays !== undefined) updateData.programmeDays = input.programmeDays;
  if (input.programmeStart !== undefined) updateData.programmeStart = input.programmeStart ? new Date(input.programmeStart) : undefined;
  if (input.programmeEnd !== undefined) updateData.programmeEnd = input.programmeEnd ? new Date(input.programmeEnd) : undefined;
  if (input.exclusions !== undefined) updateData.exclusions = input.exclusions;
  if (input.qualifications !== undefined) updateData.qualifications = input.qualifications;
  if (input.assumptions !== undefined) updateData.assumptions = input.assumptions;
  if (input.paymentTerms !== undefined) updateData.paymentTerms = input.paymentTerms;
  if (input.warrantyPeriod !== undefined) updateData.warrantyPeriod = input.warrantyPeriod;
  if (input.retentionPercentage !== undefined) updateData.retentionPercentage = input.retentionPercentage;
  if (input.notes !== undefined) updateData.notes = input.notes;

  return prisma.bid.update({
    where: { id: bidId },
    data: updateData,
  });
}

export async function withdrawBid(userId: string, bidId: string) {
  const existing = await prisma.bid.findFirst({
    where: { id: bidId },
    include: { bidPackage: { select: { project: { select: { ownerId: true } } } } },
  });
  if (!existing) throw new NotFoundError("Bid not found");

  return prisma.bid.update({
    where: { id: bidId },
    data: { status: "DECLINED" },
  });
}

export async function addLineItem(userId: string, bidId: string, input: CreateLineItemInput): Promise<BidLineItem> {
  const bid = await prisma.bid.findFirst({
    where: { id: bidId },
    include: { bidPackage: { select: { project: { select: { ownerId: true } } } } },
  });
  if (!bid) throw new NotFoundError("Bid not found");

  return prisma.bidLineItem.create({
    data: {
      bidId,
      itemRef: input.itemRef,
      description: input.description,
      unit: input.unit,
      quantity: input.quantity,
      rate: input.rate,
      amount: input.amount ?? (input.quantity && input.rate ? input.quantity * input.rate : undefined),
      category: input.category,
      included: input.included ?? true,
      notes: input.notes,
    },
  });
}

export async function updateLineItem(userId: string, itemId: string, input: Partial<CreateLineItemInput>) {
  const item = await prisma.bidLineItem.findFirst({
    where: { id: itemId },
    include: { bid: { include: { bidPackage: { select: { project: { select: { ownerId: true } } } } } } },
  });
  if (!item) throw new NotFoundError("Line item not found");

  return prisma.bidLineItem.update({
    where: { id: itemId },
    data: {
      ...input,
      amount: input.amount ?? (input.quantity && input.rate ? input.quantity * input.rate : undefined),
    },
  });
}

export async function deleteLineItem(userId: string, itemId: string) {
  const item = await prisma.bidLineItem.findFirst({
    where: { id: itemId },
    include: { bid: { include: { bidPackage: { select: { project: { select: { ownerId: true } } } } } } },
  });
  if (!item) throw new NotFoundError("Line item not found");

  await prisma.bidLineItem.delete({ where: { id: itemId } });
}

export async function addAttachment(userId: string, bidId: string, input: { fileName: string; fileUrl: string; fileType: string; fileSize: number; description?: string }) {
  const bid = await prisma.bid.findFirst({
    where: { id: bidId },
    include: { bidPackage: { select: { project: { select: { ownerId: true } } } } },
  });
  if (!bid) throw new NotFoundError("Bid not found");

  return prisma.bidAttachment.create({
    data: { bidId, ...input },
  });
}

// ─── Comparison & Analysis ──────────────────────────────────────────────────────

export async function getComparisonMatrix(userId: string, packageId: string) {
  const pkg = await prisma.bidPackage.findFirst({
    where: { id: packageId, project: { ownerId: userId } },
    include: {
      bids: {
        where: { status: { in: ["SUBMITTED", "SHORTLISTED", "AWARDED"] } },
        include: {
          subcontractor: { select: { id: true, companyName: true, rating: true, riskLevel: true } },
          lineItems: { orderBy: { itemRef: "asc" } },
          attachments: true,
        },
        orderBy: { totalAmount: "asc" },
      },
    },
  });

  if (!pkg) throw new NotFoundError("Bid package not found");

  // Build comparison summary
  const submittedBids = pkg.bids.filter((b) => b.status !== "INVITED" && b.status !== "DECLINED");
  const totalBids = submittedBids.length;
  const lowestAmount = submittedBids.length > 0 ? Math.min(...submittedBids.map((b) => b.totalAmount ?? Infinity)) : 0;
  const highestAmount = submittedBids.length > 0 ? Math.max(...submittedBids.map((b) => b.totalAmount ?? 0)) : 0;
  const avgAmount = submittedBids.length > 0 ? submittedBids.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0) / submittedBids.length : 0;

  return {
    package: {
      id: pkg.id,
      name: pkg.name,
      status: pkg.status,
      estimatedValue: pkg.estimatedValue,
      submissionDeadline: pkg.submissionDeadline,
    },
    summary: {
      totalInvited: pkg.invitedSubs.length,
      totalSubmitted: submittedBids.length,
      totalDeclined: pkg.bids.filter((b) => b.status === "DECLINED").length,
      lowestAmount,
      highestAmount,
      avgAmount,
      spread: highestAmount - lowestAmount,
      spreadPercent: avgAmount > 0 ? ((highestAmount - lowestAmount) / avgAmount) * 100 : 0,
    },
    bids: submittedBids.map((bid) => ({
      id: bid.id,
      subcontractor: bid.subcontractor,
      status: bid.status,
      totalAmount: bid.totalAmount,
      vatAmount: bid.vatAmount,
      grossAmount: bid.grossAmount,
      programmeDays: bid.programmeDays,
      lineItemCount: bid.lineItems.length,
      attachmentCount: bid.attachments.length,
      aiScore: bid.aiScore,
      aiFlags: bid.aiFlags,
      deviation: bid.totalAmount && lowestAmount < Infinity ? ((bid.totalAmount - lowestAmount) / lowestAmount) * 100 : 0,
    })),
  };
}