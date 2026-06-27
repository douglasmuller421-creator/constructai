"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Award, BarChart3, AlertTriangle, CheckCircle2, Sparkles, TrendingUp, Users, Loader2 } from "lucide-react";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-500",
  ISSUED: "bg-blue-500/10 text-blue-600",
  CLOSED: "bg-yellow-500/10 text-yellow-600",
  AWARDED: "bg-green-500/10 text-green-600",
  CANCELLED: "bg-red-500/10 text-red-600",
};

const bidStatusColors: Record<string, string> = {
  INVITED: "bg-blue-500/10 text-blue-600",
  DECLINED: "bg-gray-500/10 text-gray-500",
  SUBMITTED: "bg-green-500/10 text-green-600",
  SHORTLISTED: "bg-purple-500/10 text-purple-600",
  REJECTED: "bg-red-500/10 text-red-600",
  AWARDED: "bg-emerald-500/10 text-emerald-600",
};

interface BidSummary {
  id: string;
  subcontractor?: { companyName: string; rating: number; riskLevel: string };
  status: string;
  totalAmount?: number;
  programmeDays?: number;
  deviation: number;
}

interface AnalysisData {
  analysisStatus: string;
  totalBids: number;
  submittedBids: number;
  lowestAmount: number | null;
  highestAmount: number | null;
  averageAmount: number | null;
  medianAmount: number | null;
  scopeGaps: Array<{ item: string; severity: string; description: string; coveredBy: string[]; notCoveredBy: string[] }>;
  pricingAnomalies: Array<{ subcontractorName: string; itemDescription: string; flag: string; deviation: number; explanation: string }>;
  recommendations: Array<{ type: string; bidId: string; subcontractorName: string; reasoning: string; score: number }>;
  riskFactors: Array<{ category: string; description: string; impact: string; mitigation: string }>;
  bestValueBidId: string | null;
  confidenceScore: number | null;
}

export default function BidDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const packageId = params.id as string;

  const { data: pkg, isLoading } = useQuery({
    queryKey: ["bid-package", packageId],
    queryFn: () => api.get(`/bids/packages/${packageId}`),
    select: (res) => res.data.data,
  });

  const { data: comparison } = useQuery({
    queryKey: ["bid-comparison", packageId],
    queryFn: () => api.get(`/bids/packages/${packageId}/comparison`),
    select: (res) => res.data.data,
  });

  const { data: analysis } = useQuery({
    queryKey: ["bid-analysis", packageId],
    queryFn: () => api.get(`/bids/analysis/packages/${packageId}/analysis`),
    select: (res) => res.data.data as AnalysisData,
    enabled: !!packageId,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => api.post(`/bids/analysis/packages/${packageId}/analyze`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bid-analysis", packageId] });
    },
  });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-64" /></div>;
  }

  if (!pkg) {
    return <div className="flex flex-col items-center py-12"><h2 className="text-xl font-semibold">Package not found</h2></div>;
  }

  const bids = pkg.bids ?? [];
  const submittedBids = bids.filter((b: Record<string, unknown>) => b.status === "SUBMITTED" || b.status === "AWARDED");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/bids")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{pkg.name}</h1>
              <Badge variant="outline" className={statusColors[pkg.status]}>{pkg.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{pkg.project?.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!analysis && (
            <Button
              variant="outline"
              disabled={analyzeMutation.isPending || submittedBids.length < 2}
              onClick={() => analyzeMutation.mutate()}
            >
              {analyzeMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : <><Sparkles className="mr-2 h-4 w-4" />Run AI Analysis</>}
            </Button>
          )}
          {pkg.status === "CLOSED" && submittedBids.length > 0 && (
            <Button size="sm"><Award className="mr-2 h-4 w-4" />Award Bid</Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold">{pkg.invitedSubs?.length ?? 0}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />Invited</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold">{submittedBids.length}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Submitted</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold">{pkg.estimatedValue ? formatCurrency(pkg.estimatedValue) : "—"}</div>
          <div className="text-xs text-muted-foreground">QS Estimate</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold">{comparison?.summary?.lowestAmount ? formatCurrency(comparison.summary.lowestAmount) : "—"}</div>
          <div className="text-xs text-muted-foreground">Lowest Bid</div>
        </CardContent></Card>
      </div>

      {/* AI Analysis Results */}
      {analysis && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Bid Analysis
                {analysis.confidenceScore && (
                  <Badge variant="secondary" className="ml-2">
                    {Math.round(analysis.confidenceScore * 100)}% confidence
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scope Gaps */}
              {analysis.scopeGaps?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Scope Gaps ({analysis.scopeGaps.length})
                  </h4>
                  <div className="space-y-2">
                    {analysis.scopeGaps.map((gap, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg border p-3">
                        <Badge variant="outline" className={
                          gap.severity === "HIGH" ? "bg-red-500/10 text-red-600" :
                          gap.severity === "MEDIUM" ? "bg-yellow-500/10 text-yellow-600" :
                          "bg-gray-500/10 text-gray-500"
                        }>{gap.severity}</Badge>
                        <div className="text-sm">
                          <p className="font-medium">{gap.item}</p>
                          <p className="text-muted-foreground">{gap.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Anomalies */}
              {analysis.pricingAnomalies?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-red-500" />
                    Pricing Anomalies ({analysis.pricingAnomalies.length})
                  </h4>
                  <div className="space-y-2">
                    {analysis.pricingAnomalies.map((anomaly, i) => (
                      <div key={i} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{anomaly.subcontractorName}</span>
                          <Badge variant="outline" className={
                            anomaly.flag === "ABNORMALLY_HIGH" ? "bg-red-500/10 text-red-600" : "bg-yellow-500/10 text-yellow-600"
                          }>{anomaly.flag === "ABNORMALLY_HIGH" ? "High" : "Low"}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{anomaly.explanation}</p>
                        {anomaly.deviation !== 0 && (
                          <p className="text-xs text-muted-foreground mt-1">Deviation: {anomaly.deviation.toFixed(1)}%</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {analysis.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{rec.subcontractorName}</span>
                            <Badge variant="outline" className="text-xs">{rec.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{rec.reasoning}</p>
                        </div>
                        <div className="text-sm font-bold text-primary">{rec.score}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Factors */}
              {analysis.riskFactors?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Risk Factors
                  </h4>
                  <div className="space-y-2">
                    {analysis.riskFactors.map((risk, i) => (
                      <div key={i} className="rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{risk.category}</span>
                          <Badge variant="outline" className={
                            risk.impact === "HIGH" ? "bg-red-500/10 text-red-600" :
                            risk.impact === "MEDIUM" ? "bg-yellow-500/10 text-yellow-600" :
                            "bg-gray-500/10 text-gray-500"
                          }>{risk.impact}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">Mitigation: {risk.mitigation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Comparison Table */}
      {comparison && comparison.bids && comparison.bids.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />Bid Comparison</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Subcontractor</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-right font-medium">Programme</th>
                    <th className="px-4 py-3 text-right font-medium">vs Lowest</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.bids.map((bid: BidSummary, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{bid.subcontractor?.companyName}</td>
                      <td className="px-4 py-3 text-center"><Badge variant="outline" className={bidStatusColors[bid.status]}>{bid.status}</Badge></td>
                      <td className="px-4 py-3 text-right font-medium">{bid.totalAmount ? formatCurrency(bid.totalAmount) : "—"}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{bid.programmeDays ? bid.programmeDays + " days" : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {bid.deviation > 0 ? <span className="text-red-600">+{bid.deviation.toFixed(1)}%</span> :
                         bid.deviation === 0 ? <span className="text-green-600">Lowest</span> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}