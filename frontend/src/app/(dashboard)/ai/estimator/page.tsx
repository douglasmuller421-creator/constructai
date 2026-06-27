"use client";

import { useState } from "react";
import { useAIEstimate } from "@/hooks/use-ai-estimate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const projectTypes = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "renovation", label: "Renovation" },
];

const qualityLevels = [
  { value: "basic", label: "Basic" },
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
  { value: "luxury", label: "Luxury" },
];

const buildingSizes = [
  { value: "small", label: "Small (< 5,000 sq ft)" },
  { value: "medium", label: "Medium (5K - 20K sq ft)" },
  { value: "large", label: "Large (20K - 100K sq ft)" },
  { value: "xlarge", label: "X-Large (> 100K sq ft)" },
];

export default function AIEstimatorPage() {
  const estimateMutation = useAIEstimate();
  const [formData, setFormData] = useState({
    project_name: "",
    project_type: "commercial",
    building_size: "medium",
    square_footage: "",
    location: "",
    quality_level: "standard",
    num_floors: "1",
    include_parking: false,
    include_landscaping: false,
    timeline_months: "",
    additional_requirements: "",
    budget_hint: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    estimateMutation.mutate({
      project_name: formData.project_name,
      project_type: formData.project_type as "commercial",
      building_size: formData.building_size as "medium",
      square_footage: parseFloat(formData.square_footage),
      location: formData.location,
      quality_level: formData.quality_level as "standard",
      num_floors: parseInt(formData.num_floors),
      include_parking: formData.include_parking,
      include_landscaping: formData.include_landscaping,
      timeline_months: formData.timeline_months ? parseInt(formData.timeline_months) : undefined,
      additional_requirements: formData.additional_requirements || undefined,
      budget_hint: formData.budget_hint ? parseFloat(formData.budget_hint) : undefined,
    });
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const result = estimateMutation.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          AI Cost Estimator
        </h1>
        <p className="text-muted-foreground">Get AI-powered cost estimates for your construction projects</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Fill in the details to get an accurate estimate</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {estimateMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to generate estimate. Please try again.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="project_name">Project Name *</Label>
                <Input id="project_name" value={formData.project_name} onChange={(e) => updateField("project_name", e.target.value)} placeholder="e.g., Downtown Office Renovation" required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Project Type *</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.project_type} onChange={(e) => updateField("project_type", e.target.value)}>
                    {projectTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Building Size *</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.building_size} onChange={(e) => updateField("building_size", e.target.value)}>
                    {buildingSizes.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="square_footage">Square Footage *</Label>
                  <Input id="square_footage" type="number" value={formData.square_footage} onChange={(e) => updateField("square_footage", e.target.value)} placeholder="e.g., 25000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input id="location" value={formData.location} onChange={(e) => updateField("location", e.target.value)} placeholder="e.g., London" required />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Quality Level</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.quality_level} onChange={(e) => updateField("quality_level", e.target.value)}>
                    {qualityLevels.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num_floors">Floors</Label>
                  <Input id="num_floors" type="number" min="1" value={formData.num_floors} onChange={(e) => updateField("num_floors", e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formData.include_parking} onChange={(e) => updateField("include_parking", e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                  Parking
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formData.include_landscaping} onChange={(e) => updateField("include_landscaping", e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                  Landscaping
                </label>
              </div>
              <Button type="submit" className="w-full" disabled={estimateMutation.isPending}>
                {estimateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : <><Sparkles className="mr-2 h-4 w-4" />Generate Estimate</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {estimateMutation.isPending && (
            <Card><CardContent className="pt-6"><div className="space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-32 w-full" /></div></CardContent></Card>
          )}
          {result && !estimateMutation.isPending && (
            <>
              <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" />Total Estimate</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{formatCurrency(result.total_estimated_cost)}</div><p className="text-sm text-muted-foreground">{formatCurrency(result.cost_per_sqft)} per sq ft</p></CardContent></Card>
              {result.cost_breakdown && Object.keys(result.cost_breakdown).length > 0 && (
                <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Cost Breakdown</CardTitle></CardHeader><CardContent className="space-y-3">{Object.entries(result.cost_breakdown).map(([category, amount]) => { const percentage = ((amount as number) / result.total_estimated_cost) * 100; return (<div key={category} className="space-y-1"><div className="flex items-center justify-between text-sm"><span className="capitalize">{category}</span><span className="font-medium">{formatCurrency(amount as number)}</span></div><div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${percentage}%` }} /></div></div>); })}</CardContent></Card>
              )}
              {result.risk_factors && result.risk_factors.length > 0 && (
                <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" />Risk Factors</CardTitle></CardHeader><CardContent><ul className="space-y-1">{result.risk_factors.map((risk, i) => (<li key={i} className="text-sm flex items-start gap-2"><span className="text-yellow-500 mt-1">•</span>{risk}</li>))}</ul></CardContent></Card>
              )}
              {result.recommendations && result.recommendations.length > 0 && (
                <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Lightbulb className="h-4 w-4 text-blue-500" />Recommendations</CardTitle></CardHeader><CardContent><ul className="space-y-1">{result.recommendations.map((rec, i) => (<li key={i} className="text-sm flex items-start gap-2"><span className="text-blue-500 mt-1">•</span>{rec}</li>))}</ul></CardContent></Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}