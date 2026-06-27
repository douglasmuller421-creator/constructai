import { Router, type Request, type Response } from "express";
import { z } from "zod";
import prisma from "../config/database.js";
import * as bidAnalysisService from "../services/bidAnalysis.service.js";
import { success, created } from "../utils/response.js";
import { asyncHandler } from "../middleware/index.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(authenticate);

/**
 * POST /api/v1/bids/analysis/packages/:id/analyze
 * Run AI bid leveling analysis on a package
 */
router.post(
  "/packages/:id/analyze",
  asyncHandler(async (req: Request, res: Response) => {
    const analysis = await bidAnalysisService.analyzeBids(req.user!.id, req.params.id);
    created(res, analysis, "Bid analysis complete");
  })
);

/**
 * GET /api/v1/bids/analysis/packages/:id/analysis
 * Get existing analysis results
 */
router.get(
  "/packages/:id/analysis",
  asyncHandler(async (req: Request, res: Response) => {
    const analysis = await bidAnalysisService.getAnalysis(req.user!.id, req.params.id);
    success(res, analysis);
  })
);

/**
 * POST /api/v1/bids/analysis/packages/:id/analyze-ai
 * Call external AI service for enhanced analysis
 */
router.post(
  "/packages/:id/analyze-ai",
  asyncHandler(async (req: Request, res: Response) => {
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

    const pkg = await prisma.bidPackage.findFirst({
      where: { id: req.params.id, project: { ownerId: req.user!.id } },
      include: {
        bids: {
          where: { status: { in: ["SUBMITTED", "SHORTLISTED", "AWARDED"] } },
          include: {
            subcontractor: { select: { companyName: true, rating: true, riskLevel: true } },
            lineItems: { orderBy: { itemRef: "asc" } },
          },
        },
      },
    });

    if (!pkg) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Bid package not found" },
      });
    }

    const submittedBids = pkg.bids;

    if (submittedBids.length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: "INSUFFICIENT_DATA", message: "At least 2 submitted bids required" },
      });
    }

    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/v1/bids/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_name: pkg.name,
          scope_of_work: pkg.scopeOfWork,
          estimated_value: pkg.estimatedValue,
          contract_type: pkg.contractType,
          bids: submittedBids.map((bid) => ({
            subcontractor_name: bid.subcontractor?.companyName,
            total_amount: bid.totalAmount,
            programme_days: bid.programmeDays,
            line_items: (bid.lineItems || []).map((item) => ({
              description: item.description,
              unit: item.unit,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
              included: item.included,
            })),
            exclusions: bid.exclusions || [],
            qualifications: bid.qualifications || [],
            subcontractor_rating: bid.subcontractor?.rating,
            subcontractor_risk: bid.subcontractor?.riskLevel,
          })),
        }),
      });

      if (!response.ok) throw new Error("AI service returned error");

      const result = await response.json() as any;
      const analysis = await saveAIAnalysisFromExternal(req.params.id, result, submittedBids.length, pkg.invitedSubs.length);
      success(res, analysis);
    } catch {
      const analysis = await bidAnalysisService.analyzeBids(req.user!.id, req.params.id);
      success(res, { ...analysis, aiEnhanced: false });
    }
  })
);

async function saveAIAnalysisFromExternal(
  packageId: string,
  aiResult: any,
  submittedCount: number,
  totalInvited: number
) {
  return prisma.bidAnalysis.upsert({
    where: { bidPackageId: packageId },
    create: {
      bidPackageId: packageId,
      analysisStatus: "COMPLETE",
      totalBids: totalInvited,
      submittedBids: submittedCount,
      lowestAmount: aiResult.lowest_amount || null,
      highestAmount: aiResult.highest_amount || null,
      averageAmount: aiResult.average_amount || null,
      medianAmount: aiResult.median_amount || null,
      scopeGaps: aiResult.scope_gaps || [],
      pricingAnomalies: aiResult.pricing_anomalies || [],
      recommendations: aiResult.recommendations || [],
      riskFactors: aiResult.risk_factors || [],
      bestValueBidId: aiResult.best_value_bid_id || null,
      confidenceScore: aiResult.confidence_score || 0.5,
      aiModel: aiResult.model || "external",
      analyzedAt: new Date(),
    },
    update: {
      analysisStatus: "COMPLETE",
      lowestAmount: aiResult.lowest_amount || null,
      highestAmount: aiResult.highest_amount || null,
      averageAmount: aiResult.average_amount || null,
      medianAmount: aiResult.median_amount || null,
      scopeGaps: aiResult.scope_gaps || [],
      pricingAnomalies: aiResult.pricing_anomalies || [],
      recommendations: aiResult.recommendations || [],
      riskFactors: aiResult.risk_factors || [],
      bestValueBidId: aiResult.best_value_bid_id || null,
      confidenceScore: aiResult.confidence_score || 0.5,
      aiModel: aiResult.model || "external",
      analyzedAt: new Date(),
    },
  });
}

export default router;