import { z } from "zod";

const projectBase = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  description: z.string().max(5000).optional(),
  location: z.string().min(2, "Location is required"),
  budget: z.number().nonnegative("Budget must be non-negative").default(0),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  companyId: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
});

export const createProjectSchema = projectBase;
export const updateProjectSchema = projectBase.partial();

export const listProjectsQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["name", "createdAt", "budget", "startDate"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;