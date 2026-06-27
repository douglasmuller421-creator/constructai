import { Router, type Request, type Response } from "express";
import prisma from "../config/database.js";
import { success, created } from "../utils/response.js";
import { asyncHandler } from "../middleware/index.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// Validation schemas
const saveEstimateSchema = z.object({
  estimate_id: z.string(),
  project_name: z.string(),
  project_type: z.string(),
  location: z.string(),
  square_footage: z.number(),
  quality_level: z.string(),
  total_estimated_cost: z.number(),
  cost_per_sqft: z.number(),
  confidence_score: z.number(),
  items: z.array(z.any()),
  cost_breakdown: z.record(z.number()),
  timeline_estimate: z.string().optional(),
  risk_factors: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
});

const linkToProjectSchema = z.object({
  project_id: z.string(),
});

/**
 * POST /api/v1/ai/estimates
 * Save an AI-generated estimate (called by AI service or frontend)
 */
router.post(
  "/estimates",
  validate(saveEstimateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;

    const estimate = await prisma.aIEstimate.create({
      data: {
        estimateId: data.estimate_id,
        projectName: data.project_name,
        projectType: data.project_type,
        location: data.location,
        squareFootage: data.square_footage,
        qualityLevel: data.quality_level,
        totalEstimatedCost: data.total_estimated_cost,
        costPerSqft: data.cost_per_sqft,
        confidenceScore: data.confidence_score,
        items: data.items,
        costBreakdown: data.cost_breakdown,
        timelineEstimate: data.timeline_estimate,
        riskFactors: data.risk_factors ?? [],
        recommendations: data.recommendations ?? [],
      },
    });

    created(res, estimate, "Estimate saved successfully");
  })
);

/**
 * GET /api/v1/ai/estimates
 * List all AI estimates for the user
 */
router.get(
  "/estimates",
  asyncHandler(async (req: Request, res: Response) => {
    const estimates = await prisma.aIEstimate.findMany({
      where: {
        project: {
          ownerId: req.user!.id,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    success(res, estimates);
  })
);

/**
 * GET /api/v1/ai/estimates/:id
 * Get a specific estimate
 */
router.get(
  "/estimates/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const estimate = await prisma.aIEstimate.findFirst({
      where: {
        id: req.params.id,
        project: {
          ownerId: req.user!.id,
        },
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    if (!estimate) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Estimate not found" },
      });
    }

    success(res, estimate);
  })
);

/**
 * POST /api/v1/ai/estimates/:id/link
 * Link an estimate to a project
 */
router.post(
  "/estimates/:id/link",
  validate(linkToProjectSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { project_id } = req.body;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: project_id, ownerId: req.user!.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      });
    }

    const estimate = await prisma.aIEstimate.update({
      where: { id: req.params.id },
      data: { projectId: project_id },
    });

    success(res, estimate, 200, "Estimate linked to project");
  })
);

/**
 * POST /api/v1/ai/estimates/:id/convert
 * Convert an estimate into actual cost entries on a project
 */
router.post(
  "/estimates/:id/convert",
  asyncHandler(async (req: Request, res: Response) => {
    const estimate = await prisma.aIEstimate.findFirst({
      where: {
        id: req.params.id,
        project: { ownerId: req.user!.id },
      },
    });

    if (!estimate || !estimate.projectId) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Estimate not found or not linked to project" },
      });
    }

    // Create cost entries from estimate items
    const items = Array.isArray(estimate.items) ? estimate.items : [];
    const costs = await Promise.all(
      items.map((item: any) =>
        prisma.cost.create({
          data: {
            category: mapCategory(item.category),
            description: item.description || "AI Estimate",
            amount: item.estimated_cost || 0,
            quantity: item.quantity || 1,
            unit: item.unit || null,
            projectId: estimate.projectId!,
            aiEstimated: true,
          },
        })
      )
    );

    success(res, { created: costs.length, costs }, 200, "Costs created from estimate");
  })
);

/**
 * POST /api/v1/ai/estimate
 * Proxy endpoint - calls AI service to generate estimate
 */
router.post(
  "/estimate",
  asyncHandler(async (req: Request, res: Response) => {
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/v1/estimates/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json(error);
      }

      const result = await response.json() as { data?: unknown };
      success(res, result.data || result);
    } catch (error) {
      res.status(502).json({
        success: false,
        error: {
          code: "AI_SERVICE_UNAVAILABLE",
          message: "AI estimation service is currently unavailable",
        },
      });
    }
  })
);

function mapCategory(category: string): "MATERIALS" | "LABOR" | "EQUIPMENT" | "SUBCONTRACTOR" | "OVERHEAD" | "PERMITS" | "OTHER" {
  const upper = category.toUpperCase();
  const valid: Array<"MATERIALS" | "LABOR" | "EQUIPMENT" | "SUBCONTRACTOR" | "OVERHEAD" | "PERMITS" | "OTHER"> = ["MATERIALS", "LABOR", "EQUIPMENT", "SUBCONTRACTOR", "OVERHEAD", "PERMITS", "OTHER"];
  return valid.includes(upper as any) ? (upper as any) : "OTHER";
}

export default router;