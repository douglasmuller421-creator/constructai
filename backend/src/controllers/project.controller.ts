import type { Request, Response } from "express";
import * as projectService from "../services/project.service.js";
import { ok, created, noContent } from "../utils/response.js";
import { asyncHandler } from "../middleware/index.js";
import { validate } from "../middleware/validate.js";
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuery,
} from "../validations/project.js";

export const create = [
  validate(createProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.createProject(req.user!.id, req.body);
    created(res, project, "Project created successfully");
  }),
];

export const list = [
  validate(listProjectsQuery),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await projectService.listProjects(
      req.user!.id,
      req.user!.role,
      req.query as any
    );
    ok(res, result);
  }),
];

export const getById = asyncHandler(
  async (req: Request, res: Response) => {
    const project = await projectService.getProjectById(
      req.user!.id,
      req.user!.role,
      req.params.id
    );
    ok(res, project);
  }
);

export const update = [
  validate(updateProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.updateProject(
      req.user!.id,
      req.user!.role,
      req.params.id,
      req.body
    );
    ok(res, project, "Project updated successfully");
  }),
];

export const remove = asyncHandler(
  async (req: Request, res: Response) => {
    await projectService.deleteProject(
      req.user!.id,
      req.user!.role,
      req.params.id
    );
    noContent(res);
  }
);

export const stats = asyncHandler(
  async (req: Request, res: Response) => {
    const statistics = await projectService.getProjectStats(
      req.user!.id,
      req.user!.role
    );
    ok(res, statistics);
  }
);