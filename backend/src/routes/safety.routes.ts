import { Router, type Request, type Response } from "express";
import { z } from "zod";
import prisma from "../config/database.js";
import { success, created, noContent } from "../utils/response.js";
import { asyncHandler } from "../middleware/index.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { NotFoundError } from "../utils/errors.js";

const router = Router();

router.use(authenticate);

// Validation
const createChecklistSchema = z.object({
  name: z.string().min(2, "Name is required"),
  items: z.array(z.object({
    text: z.string().min(1, "Item text is required"),
    checked: z.boolean().default(false),
    category: z.string().default("general"),
    notes: z.string().optional(),
  })),
  projectId: z.string(),
  dueDate: z.string().datetime().optional(),
});

const updateChecklistSchema = z.object({
  name: z.string().min(2).optional(),
  items: z.array(z.object({
    text: z.string().min(1),
    checked: z.boolean().default(false),
    category: z.string().default("general"),
    notes: z.string().optional(),
  })).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"]).optional(),
  dueDate: z.string().datetime().optional(),
});

/**
 * POST /api/v1/safety/checklists
 * Create a safety checklist
 */
router.post(
  "/checklists",
  validate(createChecklistSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;

    const project = await prisma.project.findFirst({
      where: { id: data.projectId, ownerId: req.user!.id },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const checklist = await prisma.safetyChecklist.create({
      data: {
        name: data.name,
        items: data.items,
        projectId: data.projectId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: "PENDING",
      },
    });

    created(res, checklist, "Checklist created");
  })
);

/**
 * GET /api/v1/safety/checklists
 * List safety checklists
 */
router.get(
  "/checklists",
  asyncHandler(async (req: Request, res: Response) => {
    const projectId = req.query.projectId as string | undefined;

    const checklists = await prisma.safetyChecklist.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        project: { ownerId: req.user!.id },
      },
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    success(res, checklists);
  })
);

/**
 * GET /api/v1/safety/checklists/:id
 */
router.get(
  "/checklists/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const checklist = await prisma.safetyChecklist.findFirst({
      where: {
        id: req.params.id,
        project: { ownerId: req.user!.id },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    if (!checklist) {
      throw new NotFoundError("Checklist not found");
    }

    success(res, checklist);
  })
);

/**
 * PATCH /api/v1/safety/checklists/:id
 * Update checklist items/status
 */
router.patch(
  "/checklists/:id",
  validate(updateChecklistSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const existing = await prisma.safetyChecklist.findFirst({
      where: {
        id: req.params.id,
        project: { ownerId: req.user!.id },
      },
    });

    if (!existing) {
      throw new NotFoundError("Checklist not found");
    }

    const checklist = await prisma.safetyChecklist.update({
      where: { id: req.params.id },
      data: req.body,
    });

    success(res, checklist, 200, "Checklist updated");
  })
);

/**
 * DELETE /api/v1/safety/checklists/:id
 */
router.delete(
  "/checklists/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const existing = await prisma.safetyChecklist.findFirst({
      where: {
        id: req.params.id,
        project: { ownerId: req.user!.id },
      },
    });

    if (!existing) {
      throw new NotFoundError("Checklist not found");
    }

    await prisma.safetyChecklist.delete({ where: { id: req.params.id } });
    noContent(res);
  })
);

/**
 * POST /api/v1/safety/checklists/:id/ai-insights
 * AI-powered safety insights
 */
router.post(
  "/checklists/:id/ai-insights",
  asyncHandler(async (req: Request, res: Response) => {
    const checklist = await prisma.safetyChecklist.findFirst({
      where: {
        id: req.params.id,
        project: { ownerId: req.user!.id },
      },
      include: {
        project: { select: { id: true, name: true, location: true } },
      },
    });

    if (!checklist) {
      throw new NotFoundError("Checklist not found");
    }

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/v1/safety/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklist_name: checklist.name,
          items: checklist.items,
          project_name: checklist.project?.name,
          project_location: checklist.project?.location,
        }),
      });

      if (!response.ok) {
        throw new Error("AI service returned error");
      }

      const result = await response.json() as { insights: string; recommendations: string[] };

      // Save insights to checklist
      const updated = await prisma.safetyChecklist.update({
        where: { id: checklist.id },
        data: { aiNotes: result.insights },
      });

      success(res, { checklist: updated, insights: result.insights, recommendations: result.recommendations });
    } catch (error) {
      res.status(502).json({
        success: false,
        error: {
          code: "AI_SERVICE_UNAVAILABLE",
          message: "AI safety insights service is currently unavailable",
        },
      });
    }
  })
);

/**
 * POST /api/v1/safety/generate-template
 * Generate a safety checklist template based on project type
 */
router.post(
  "/generate-template",
  asyncHandler(async (req: Request, res: Response) => {
    const { projectId, projectType } = req.body as { projectId: string; projectType: string };

    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: req.user!.id },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/v1/safety/generate-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: project.name,
          project_type: projectType,
          location: project.location,
        }),
      });

      if (!response.ok) {
        throw new Error("AI service returned error");
      }

      const result = await response.json() as { name: string; items: any[] };

      // Create the checklist
      const checklist = await prisma.safetyChecklist.create({
        data: {
          name: result.name,
          items: result.items,
          projectId,
          status: "PENDING",
        },
      });

      created(res, checklist, "Safety checklist template generated");
    } catch (error) {
      res.status(502).json({
        success: false,
        error: {
          code: "AI_SERVICE_UNAVAILABLE",
          message: "AI safety template service is currently unavailable",
        },
      });
    }
  })
);

export default router;