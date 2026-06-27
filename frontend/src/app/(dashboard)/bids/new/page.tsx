"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function NewBidPackagePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    projectId: "",
    name: "",
    reference: "",
    description: "",
    scopeOfWork: "",
    contractType: "NEC4",
    estimatedValue: "",
    tenderDate: "",
    submissionDeadline: "",
    siteVisitDate: "",
    queriesDeadline: "",
    invitedSubs: [] as string[],
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: () => api.get("/projects", { params: { limit: 50 } }),
    select: (res) => (res.data.data as { items: Array<{ id: string; companyName: string; tradeCategories?: string[]; city?: string; riskLevel: string }> })?.items ?? [],
  });

  const { data: subsData } = useQuery({
    queryKey: ["subcontractors-list"],
    queryFn: () => api.get("/subcontractors", { params: { status: "ACTIVE", limit: 100 } }),
    select: (res) => (res.data.data as { items: Array<{ id: string; companyName: string; tradeCategories?: string[]; city?: string; riskLevel: string }> })?.items ?? [],
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/bids/packages", {
        ...formData,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
        tenderDate: formData.tenderDate || undefined,
        submissionDeadline: formData.submissionDeadline || undefined,
        siteVisitDate: formData.siteVisitDate || undefined,
        queriesDeadline: formData.queriesDeadline || undefined,
      }),
    onSuccess: (response) => {
      const pkg = response.data.data as { id: string };
      router.push(`/bids/${pkg.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const toggleSub = (subId: string) => {
    setFormData((prev) => ({
      ...prev,
      invitedSubs: prev.invitedSubs.includes(subId)
        ? prev.invitedSubs.filter((id) => id !== subId)
        : [...prev.invitedSubs, subId],
    }));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Tender Package</h1>
        <p className="text-muted-foreground">Step {step} of 3</p>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Package Details</CardTitle>
              <CardDescription>Basic information about this tender package</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Project *</Label>
                <select id="projectId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value })} required>
                  <option value="">Select project...</option>
                  {(projectsData ?? []).map((p: { id: string; companyName: string }) => <option key={p.id} value={p.id}>{p.companyName}</option>)}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Package Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Electrical Installation" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference</Label>
                  <Input id="reference" value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} placeholder="e.g., Tender-001" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scopeOfWork">Scope of Work</Label>
                <textarea id="scopeOfWork" className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.scopeOfWork} onChange={(e) => setFormData({ ...formData, scopeOfWork: e.target.value })} placeholder="Describe the scope of work..." />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contractType">Contract Type</Label>
                  <select id="contractType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={formData.contractType} onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}>
                    <option value="NEC4">NEC4</option>
                    <option value="JCT">JCT</option>
                    <option value="TRADITIONAL">Traditional</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedValue">Estimated Value (£)</Label>
                  <Input id="estimatedValue" type="number" value={formData.estimatedValue} onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })} placeholder="250000" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="button" onClick={() => setStep(2)}>Next: Timeline</Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Key dates for the tender process</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenderDate">Tender Issue Date</Label>
                <Input id="tenderDate" type="date" value={formData.tenderDate} onChange={(e) => setFormData({ ...formData, tenderDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="submissionDeadline">Submission Deadline *</Label>
                <Input id="submissionDeadline" type="date" value={formData.submissionDeadline} onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteVisitDate">Site Visit Date</Label>
                <Input id="siteVisitDate" type="date" value={formData.siteVisitDate} onChange={(e) => setFormData({ ...formData, siteVisitDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="queriesDeadline">Queries Deadline</Label>
                <Input id="queriesDeadline" type="date" value={formData.queriesDeadline} onChange={(e) => setFormData({ ...formData, queriesDeadline: e.target.value })} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button type="button" onClick={() => setStep(3)}>Next: Invite Subs</Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Invite Subcontractors</CardTitle>
              <CardDescription>Select subcontractors to invite to this tender</CardDescription>
            </CardHeader>
            <CardContent>
              {(subsData ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No active subcontractors available. Add subcontractors first.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {(subsData ?? []).map((sub: { id: string; companyName: string; tradeCategories?: string[]; city?: string; riskLevel: string }) => (
                    <label key={sub.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={formData.invitedSubs.includes(sub.id)}
                        onChange={() => toggleSub(sub.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{sub.companyName}</div>
                        <div className="text-xs text-muted-foreground">
                          {sub.tradeCategories?.slice(0, 3).join(", ")}
                          {sub.city && " - " + sub.city}
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        sub.riskLevel === "LOW" ? "bg-green-500/10 text-green-600" :
                        sub.riskLevel === "MEDIUM" ? "bg-yellow-500/10 text-yellow-600" :
                        "bg-red-500/10 text-red-600"
                      }>{sub.riskLevel}</Badge>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-3">{formData.invitedSubs.length} selected</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Package"}
              </Button>
            </CardFooter>
          </Card>
        )}

        {createMutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {(createMutation.error as { error?: { message?: string } })?.error?.message || "Failed to create package"}
            </AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
}