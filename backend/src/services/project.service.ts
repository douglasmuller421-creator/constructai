import type { Prisma } from "@prisma/client";
import prisma from "../config/database.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import { getPagination, paginate } from "../utils/pagination.js";
import type { CreateProjectInput, UpdateProjectInput } from "../validations/project.js";

export async function createProject(userId: string, input: CreateProjectInput) {
  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      location: input.location,
      budget: input.budget,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      ownerId: userId,
      companyId: input.companyId ?? null,
      status: "PLANNING",
    },
  });

  return project;
}

export async function listProjects(
  userId: string,
  userRole: string,
  query: {
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  } & Record<string, unknown>
) {
  const pagination = getPagination(query as any);

  const where: Prisma.ProjectWhereInput = {
    ...(userRole !== "ADMIN" ? { ownerId: userId } : {}),
    ...(query.status ? { status: query.status as any } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { location: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip: pagination.skip,
      take: pagination.take,
      orderBy: {
        [query.sortBy || "createdAt"]: query.sortOrder || "desc",
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: {
          select: { costs: true, logs: true, checklists: true },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return paginate(items, total, pagination);
}

export async function getProjectById(userId: string, userRole: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      company: { select: { id: true, name: true } },
      costs: {
        select: {
          id: true,
          category: true,
          description: true,
          amount: true,
          aiEstimated: true,
        },
      },
      _count: {
        select: { costs: true, logs: true, checklists: true, documents: true },
      },
    },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  // Only owner or admin can view
  if (userRole !== "ADMIN" && project.ownerId !== userId) {
    throw new ForbiddenError("You do not have access to this project");
  }

  return project;
}

export async function updateProject(
  userId: string,
  userRole: string,
  projectId: string,
  input: UpdateProjectInput
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (userRole !== "ADMIN" && project.ownerId !== userId) {
    throw new ForbiddenError("You do not have access to this project");
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.location && { location: input.location }),
      ...(input.budget !== undefined && { budget: input.budget }),
      ...(input.startDate && { startDate: new Date(input.startDate) }),
      ...(input.endDate !== undefined && {
        endDate: input.endDate ? new Date(input.endDate) : null,
      }),
      ...(input.status && { status: input.status }),
    },
  });
  return updated;
}


export async function deleteProject(userId: string, userRole: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (userRole !== "ADMIN" && project.ownerId !== userId) {
    throw new ForbiddenError("You do not have access to this project");
  }

  await prisma.project.delete({ where: { id: projectId } });
}

export async function getProjectStats(userId: string, userRole: string) {
  const where: Prisma.ProjectWhereInput = {
    ...(userRole !== "ADMIN" ? { ownerId: userId } : {}),
  };

  const [byStatus, totalBudget, totalProjects] = await Promise.all([
    prisma.project.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    prisma.project.aggregate({
      where,
      _sum: { budget: true },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    totalProjects,
    totalBudget: totalBudget._sum.budget || 0,
    byStatus: byStatus.map((s) => ({
      status: s.status,
      count: s._count._all,
    })),
  };
}