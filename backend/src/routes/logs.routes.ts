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

// Validation schemas
const createLogSchema = z.object({
  type: z.enum(["GENERAL", "PROGRESS", "SAFETY", "WEATHER", "DELAY", "INSPECTION"]).default("GENERAL"),
  content: z.string().min(1, "Content is required"),
  weather: z.string().optional(),
  crewSize: z.number().int().positive().optional(),
  temperature: z.number().optional(),
  projectId: z.string(),
});

const updateLogSchema = z.object({
  type: z.enum(["GENERAL", "PROGRESS", "SAFETY", "WEATHER", "DELAY", "INSPECTION"]).optional(),
  content: z.string().min(1).optional(),
  weather: z.string().optional(),
  crewSize: z.number().int().positive().optional(),
  temperature: z.number().optional(),
});

const listLogsQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  type: z.enum(["GENERAL", "PROGRESS", "SAFETY", "WEATHER", "DELAY", "INSPECTION"]).optional(),
  projectId: z.string().optional(),
  sortBy: z.enum(["createdAt", "type"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

/**
 * POST /api/v1/logs
 * Create a daily log entry
 */
router.post(
  "/",
  validate(createLogSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, ownerId: req.user!.id },
    });

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const log = await prisma.dailyLog.create({
      data: {
        type: data.type,
        content: data.content,
        weather: data.weather,
        crewSize: data.crewSize,
        temperature: data.temperature,
        projectId: data.projectId,
        authorId: req.user!.id,
      },
    });

    created(res, log, "Log entry created");
  })
);

/**
 * GET /api/v1/logs
 * List daily logs with filters
 */
router.get(
  "/",
  validate(listLogsQuery),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, type, projectId, sortBy = "createdAt", sortOrder = "desc" } = req.query as any;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(type ? { type } : {}),
      ...(projectId ? { projectId } : {}),
      // Only show logs for user's projects
      project: { ownerId: req.user!.id },
    };

    const [items, total] = await Promise.all([
      prisma.dailyLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          author: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      }),
      prisma.dailyLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    success(res, {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  })
);

/**
 * GET /api/v1/logs/:id
 * Get a single log entry
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const log = await prisma.dailyLog.findFirst({
      where: {
        id: req.params.id,
        project: { ownerId: req.user!.id },
      },
      include: {
        author: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!log) {
      throw new NotFoundError("Log not found");
    }

    success(res, log);
  })
);

/**
 * PATCH /api/v1/logs/:id
 * Update a log entry
 */
router.patch(
  "/:id",
  validate(updateLogSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const existing = await prisma.dailyLog.findFirst({
      where: {
        id: req.params.id,
        project: { ownerId: req.user!.id },
      },
    });

    if (!existing) {
      throw new NotFoundError("Log not found");
    }

    const log = await prisma.dailyLog.update({
      where: { id: req.params.id },
      data: req.body,
    });

    success(res, log, 200, "Log updated");
  })
);

/**
 * DELETE /api/v1/logs/:id
 */
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const existing = await prisma.dailyLog.findFirst({
      where: {
        id: req.params.id,
        project: { ownerId: req.user!.id },
      },
    });

    if (!existing) {
      throw new NotFoundError("Log not found");
    }

    await prisma.dailyLog.delete({ where: { id: req.params.id } });
    noContent(res);
  })
);

/**
 * POST /api/v1/logs/:id/summarize
 * AI-powered log summarization
 */
router.post(
  "/:id/summarize",
  asyncHandler(async (req: Request, res: Response) => {
    const log = await prisma.dailyLog.findFirst({
      where: {
        id: req.params.id,
        project: { ownerId: req.user!.id },
      },
    });

    if (!log) {
      throw new NotFoundError("Log not found");
    }

    // Call AI service for summarization
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/v1/logs/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: log.content, type: log.type }),
      });

      if (!response.ok) {
        throw new Error("AI service returned error");
      }

      const result = await response.json() as { summary: string };
      const summary = result.summary;

      // Save summary to log
      const updatedLog = await prisma.dailyLog.update({
        where: { id: log.id },
        data: { summary },
      });

      success(res, updatedLog, 200, "Summary generated");
    } catch (error) {
      res.status(502).json({
        success: false,
        error: {
          code: "AI_SERVICE_UNAVAILABLE",
          message: "AI summarization service is currently unavailable",
        },
      });
    }
  })
);

/**
 * POST /api/v1/logs/summarize-batch
 * Summarize multiple logs at once
 */
router.post(
  "/summarize-batch",
  asyncHandler(async (req: Request, res: Response) => {
    const { logIds } = req.body as { logIds: string[] };

    if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "logIds array is required" },
      });
    }

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

    const logs = await prisma.dailyLog.findMany({
      where: {
        id: { in: logIds },
        project: { ownerId: req.user!.id },
      },
    });

    if (logs.length === 0) {
      throw new NotFoundError("No logs found");
    }

    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/v1/logs/summarize-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logs: logs.map((l) => ({ id: l.id, content: l.content, type: l.type })),
        }),
      });

      if (!response.ok) {
        throw new Error("AI service returned error");
      }

      const result = await response.json() as { summaries: { id: string; summary: string }[] };

      // Update all logs with summaries
      await Promise.all(
        result.summaries.map((s) =>
          prisma.dailyLog.update({
            where: { id: s.id },
            data: { summary: s.summary },
          })
        )
      );

      success(res, { updated: result.summaries.length }, 200, "Batch summarization complete");
    } catch (error) {
      res.status(502).json({
        success: false,
        error: {
          code: "AI_SERVICE_UNAVAILABLE",
          message: "AI summarization service is currently unavailable",
        },
      });
    }
  })
);

export default router;