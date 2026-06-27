import type { BidAnalysis } from "@prisma/client";
import { Prisma } from "@prisma/client";
import prisma from "../config/database.js";
import { NotFoundError } from "../utils/errors.js";

export interface ScopeGap {
  item: string;
  description: string;
  coveredBy: string[];
  notCoveredBy: string[];
  estimatedValue?: number;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

export interface PricingAnomaly {
  subcontractorName: string;
  itemDescription: string;
  subcontractorRate: number;
  averageRate: number;
  deviation: number;
  flag: "ABNORMALLY_LOW" | "ABNORMALLY_HIGH" | "MISSING";
  explanation: string;
}

export interface BidRecommendation {
  type: "BEST_VALUE" | "LOWEST_PRICE" | "LOWEST_RISK" | "FASTEST";
  bidId: string;
  subcontractorName: string;
  reasoning: string;
  score: number;
}

export interface RiskFactor {
  category: string;
  description: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  mitigation: string;
}

export async function analyzeBids(userId: string, packageId: string): Promise<BidAnalysis> {
  const pkg = await prisma.bidPackage.findFirst({
    where: { id: packageId, project: { ownerId: userId } },
    include: {
      bids: {
        where: { status: { in: ["SUBMITTED", "SHORTLISTED", "AWARDED"] } },
        include: {
          subcontractor: { select: { id: true, companyName: true, rating: true, riskLevel: true } },
          lineItems: { orderBy: { itemRef: "asc" } },
        },
        orderBy: { totalAmount: "asc" },
      },
    },
  });

  if (!pkg) throw new NotFoundError("Bid package not found");

  const submittedBids = pkg.bids;
  const amounts = submittedBids.map((b) => b.totalAmount ?? 0).filter((a) => a > 0);

  const lowestAmount = amounts.length > 0 ? Math.min(...amounts) : 0;
  const highestAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
  const averageAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
  const sortedAmounts = [...amounts].sort((a, b) => a - b);
  const medianAmount = sortedAmounts.length > 0
    ? sortedAmounts.length % 2 === 0
      ? (sortedAmounts[sortedAmounts.length / 2 - 1] + sortedAmounts[sortedAmounts.length / 2]) / 2
      : sortedAmounts[Math.floor(sortedAmounts.length / 2)]
    : 0;

  const scopeGaps = analyzeScopeGaps(submittedBids);
  const pricingAnomalies = detectPricingAnomalies(submittedBids);
  const recommendations = generateRecommendations(submittedBids, averageAmount);
  const riskFactors = assessRiskFactors(submittedBids);
  const bestValueBidId = recommendations.length > 0 ? recommendations[0].bidId : null;
  const confidenceScore = calculateConfidence(submittedBids, scopeGaps, pricingAnomalies);

  const analysis = prisma.bidAnalysis.upsert({
    where: { bidPackageId: packageId },
    create: {
      bidPackageId: packageId,
      analysisStatus: "COMPLETE",
      totalBids: pkg.invitedSubs.length,
      submittedBids: submittedBids.length,
      lowestAmount: lowestAmount || null,
      highestAmount: highestAmount || null,
      averageAmount: averageAmount || null,
      medianAmount: medianAmount || null,
      scopeGaps: scopeGaps as unknown as Prisma.InputJsonValue,
      pricingAnomalies: pricingAnomalies as unknown as Prisma.InputJsonValue,
      recommendations: recommendations as unknown as Prisma.InputJsonValue,
      riskFactors: riskFactors as unknown as Prisma.InputJsonValue,
      bestValueBidId,
      confidenceScore,
      analyzedAt: new Date(),
    },
    update: {
      analysisStatus: "COMPLETE",
      totalBids: pkg.invitedSubs.length,
      submittedBids: submittedBids.length,
      lowestAmount: lowestAmount || null,
      highestAmount: highestAmount || null,
      averageAmount: averageAmount || null,
      medianAmount: medianAmount || null,
      scopeGaps: scopeGaps as unknown as Prisma.InputJsonValue,
      pricingAnomalies: pricingAnomalies as unknown as Prisma.InputJsonValue,
      recommendations: recommendations as unknown as Prisma.InputJsonValue,
      riskFactors: riskFactors as unknown as Prisma.InputJsonValue,
      bestValueBidId,
      confidenceScore,
      analyzedAt: new Date(),
    },
  });

  await prisma.bidPackage.update({
    where: { id: packageId },
    data: { aiAnalysisStatus: "COMPLETE" },
  });

  for (const bid of submittedBids) {
    const bidRecs = recommendations.filter((r) => r.bidId === bid.id);
    const score = bidRecs.length > 0 ? bidRecs[0].score : 50;
    const flags = pricingAnomalies
      .filter((a) => a.subcontractorName === bid.subcontractor?.companyName)
      .map((a) => a.flag);

    await prisma.bid.update({
      where: { id: bid.id },
      data: {
        aiScore: score,
        aiFlags: flags,
        aiRecommendations: bidRecs.length > 0 ? bidRecs.map((r) => r.reasoning) : undefined,
      },
    });
  }

  return analysis;
}

function analyzeScopeGaps(bids: any[]): ScopeGap[] {
  if (bids.length < 2) return [];

  const allItems = new Map<string, string[]>();
  for (const bid of bids) {
    for (const item of bid.lineItems ?? []) {
      const key = (item.description || item.itemRef || "").toLowerCase().trim();
      if (!allItems.has(key)) {
        allItems.set(key, []);
      }
      allItems.get(key)!.push(bid.subcontractor?.companyName || "Unknown");
    }
  }

  const gaps: ScopeGap[] = [];
  const bidderNames = bids.map((b: any) => b.subcontractor?.companyName || "Unknown");
  const entries = Array.from(allItems.entries());

  for (let i = 0; i < entries.length; i++) {
    const [item, coveredBy] = entries[i];
    const notCoveredBy = bidderNames.filter((name: string) => !coveredBy.includes(name));
    if (notCoveredBy.length > 0 && notCoveredBy.length < bidderNames.length) {
      gaps.push({
        item,
        description: `"${item}" included by ${coveredBy.length} of ${bidderNames.length} bidders but missing from ${notCoveredBy.length}`,
        coveredBy,
        notCoveredBy,
        severity: notCoveredBy.length > bids.length / 2 ? "HIGH" : notCoveredBy.length > 0 ? "MEDIUM" : "LOW",
      });
    }
  }

  return gaps.sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return order[a.severity] - order[b.severity];
  });
}

function detectPricingAnomalies(bids: any[]): PricingAnomaly[] {
  if (bids.length < 3) return [];

  const anomalies: PricingAnomaly[] = [];
  const amounts = bids.map((b) => b.totalAmount ?? 0).filter((a) => a > 0);
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length);

  for (const bid of bids) {
    const amount = bid.totalAmount ?? 0;
    if (amount === 0) continue;
    const zScore = stdDev > 0 ? (amount - avg) / stdDev : 0;

    if (zScore > 2) {
      anomalies.push({
        subcontractorName: bid.subcontractor?.companyName || "Unknown",
        itemDescription: "Total bid amount",
        subcontractorRate: amount,
        averageRate: avg,
        deviation: ((amount - avg) / avg) * 100,
        flag: "ABNORMALLY_HIGH",
        explanation: `Bid is ${Math.abs(zScore).toFixed(1)} standard deviations above average. Verify scope completeness.`,
      });
    } else if (zScore < -2) {
      anomalies.push({
        subcontractorName: bid.subcontractor?.companyName || "Unknown",
        itemDescription: "Total bid amount",
        subcontractorRate: amount,
        averageRate: avg,
        deviation: ((amount - avg) / avg) * 100,
        flag: "ABNORMALLY_LOW",
        explanation: `Bid is ${Math.abs(zScore).toFixed(1)} standard deviations below average. Verify scope completeness.`,
      });
    }
  }

  return anomalies;
}

function generateRecommendations(bids: any[], averageAmount: number): BidRecommendation[] {
  const recommendations: BidRecommendation[] = [];

  for (const bid of bids) {
    const amount = bid.totalAmount ?? 0;
    if (amount === 0) continue;

    const rating = bid.subcontractor?.rating ?? 0;
    const riskLevel = bid.subcontractor?.riskLevel ?? "MEDIUM";
    const deviation = averageAmount > 0 ? ((amount - averageAmount) / averageAmount) * 100 : 0;

    const priceScore = Math.max(0, 100 - Math.abs(deviation));
    const ratingScore = (rating / 5) * 100;
    const riskScore = riskLevel === "LOW" ? 100 : riskLevel === "MEDIUM" ? 60 : 30;
    const overallScore = priceScore * 0.4 + ratingScore * 0.35 + riskScore * 0.25;

    let type: BidRecommendation["type"] = "BEST_VALUE";
    if (deviation < -10) type = "LOWEST_PRICE";
    else if (riskLevel === "LOW" && rating >= 4) type = "LOWEST_RISK";
    else if (bid.programmeDays && bid.programmeDays <= 60) type = "FASTEST";

    recommendations.push({
      type,
      bidId: bid.id,
      subcontractorName: bid.subcontractor?.companyName || "Unknown",
      reasoning: buildReasoning(deviation, rating, riskLevel),
      score: Math.round(overallScore),
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

function buildReasoning(deviation: number, rating: number, riskLevel: string): string {
  const parts: string[] = [];
  if (deviation < -10) parts.push(`Priced ${Math.abs(deviation).toFixed(0)}% below average`);
  else if (deviation > 10) parts.push(`Priced ${deviation.toFixed(0)}% above average`);
  else parts.push("Priced within market range");

  if (rating >= 4) parts.push(`Strong track record (${rating.toFixed(1)}/5)`);
  else if (rating >= 3) parts.push(`Acceptable track record (${rating.toFixed(1)}/5)`);

  if (riskLevel === "LOW") parts.push("Low risk profile");
  else if (riskLevel === "HIGH") parts.push("Higher risk — verify capacity");

  return parts.join(". ") + ".";
}

function assessRiskFactors(bids: any[]): RiskFactor[] {
  const risks: RiskFactor[] = [];

  if (bids.length === 1) {
    risks.push({
      category: "Competition",
      description: "Only one bid received — no competitive tension",
      impact: "HIGH",
      mitigation: "Consider inviting additional subcontractors",
    });
  }

  const amounts = bids.map((b) => b.totalAmount ?? 0).filter((a) => a > 0);
  if (amounts.length >= 2) {
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const maxDev = Math.max(...amounts.map((a) => Math.abs((a - avg) / avg) * 100));
    if (maxDev > 30) {
      risks.push({
        category: "Pricing Variance",
        description: `High variance (${maxDev.toFixed(0)}% deviation) suggests scope misunderstanding`,
        impact: "MEDIUM",
        mitigation: "Clarify scope with all bidders",
      });
    }
  }

  return risks;
}

function calculateConfidence(bids: any[], scopeGaps: ScopeGap[], anomalies: PricingAnomaly[]): number {
  let confidence = 100;
  if (bids.length < 3) confidence -= 20;
  else if (bids.length < 5) confidence -= 10;
  confidence -= scopeGaps.filter((g) => g.severity === "HIGH").length * 10;
  confidence -= scopeGaps.filter((g) => g.severity === "MEDIUM").length * 5;
  confidence -= anomalies.length * 5;
  return Math.max(20, Math.min(95, confidence));
}

export async function getAnalysis(userId: string, packageId: string) {
  const analysis = await prisma.bidAnalysis.findFirst({
    where: { bidPackageId: packageId },
    include: { bidPackage: { select: { project: { select: { ownerId: true } } } } },
  });

  if (!analysis || analysis.bidPackage.project.ownerId !== userId) {
    throw new NotFoundError("Analysis not found");
  }

  return analysis;
}