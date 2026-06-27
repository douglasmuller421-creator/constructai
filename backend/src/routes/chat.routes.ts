import { Router, type Request, type Response } from "express";
import { z } from "zod";
import prisma from "../config/database.js";
import { success } from "../utils/response.js";
import { asyncHandler } from "../middleware/index.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(authenticate);

const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
  projectId: z.string().optional(),
});

/**
 * POST /api/v1/chat
 * AI Chat Assistant - answers questions about projects
 */
router.post(
  "/",
  validate(chatSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { message, projectId } = req.body;
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

    // Gather context for the chat
    let context: Record<string, any> = {};

    if (projectId) {
      // Verify project access
      const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId: req.user!.id },
        include: {
          costs: { select: { category: true, description: true, amount: true } },
          _count: { select: { costs: true, logs: true, checklists: true } },
        },
      });

      if (project) {
        context.project = {
          name: project.name,
          type: project.status,
          location: project.location,
          budget: project.budget,
          costs_summary: project.costs,
          counts: project._count,
        };
      }
    } else {
      // Get user's projects overview
      const projects = await prisma.project.findMany({
        where: { ownerId: req.user!.id },
        select: {
          id: true,
          name: true,
          status: true,
          budget: true,
          _count: { select: { costs: true, logs: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      context.projects = projects;
    }

    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context }),
      });

      if (!response.ok) {
        throw new Error("AI service returned error");
      }

      const result = await response.json() as { response: string; suggestions?: string[] };
      success(res, result);
    } catch (error) {
      res.status(502).json({
        success: false,
        error: {
          code: "AI_SERVICE_UNAVAILABLE",
          message: "AI chat assistant is currently unavailable",
        },
      });
    }
  })
);

export default router;