"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, MapPin, Calendar, DollarSign, FileText, ClipboardCheck, Plus, Edit } from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.get(`/projects/${projectId}`),
    select: (res) => res.data.data,
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center py-12">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <button onClick={() => router.push("/projects")} className="mt-4 text-primary hover:underline">
          Back to projects
        </button>
      </div>
    );
  }

  const p = project as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/projects")} className="p-2 rounded-lg hover:bg-accent">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{p.name}</h1>
              <Badge
                variant="outline"
                className={
                  p.status === "ACTIVE" ? "bg-green-500/10 text-green-600" :
                  p.status === "PLANNING" ? "bg-blue-500/10 text-blue-600" :
                  "bg-yellow-500/10 text-yellow-600"
                }
              >
                {p.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(p.startDate)}</span>
            </div>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm hover:bg-accent">
          <Edit className="h-4 w-4" />
          Edit
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Budget</p>
            <p className="text-2xl font-bold">{formatCurrency(p.budget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Costs</p>
            <p className="text-2xl font-bold">{p._count?.costs ?? 0}</p>
            <p className="text-xs text-muted-foreground">entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Daily Logs</p>
            <p className="text-2xl font-bold">{p._count?.logs ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Safety</p>
            <p className="text-2xl font-bold">{p._count?.checklists ?? 0}</p>
            <p className="text-xs text-muted-foreground">checklists</p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {p.description && (
            <Card>
              <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{p.description}</p></CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <button className="text-sm text-primary hover:underline">View all</button>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <button className="text-sm text-primary mt-2 hover:underline">
                  <span className="flex items-center gap-1"><Plus className="h-3 w-3" />Add first log</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Project Owner</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                  {p.owner?.name?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">{p.owner?.name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{p.owner?.email || ""}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent transition-colors">
                <Plus className="h-4 w-4 text-primary" />
                Add Daily Log
              </button>
              <button className="w-full flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent transition-colors">
                <FileText className="h-4 w-4 text-primary" />
                Create Tender
              </button>
              <button className="w-full flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent transition-colors">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                New Safety Checklist
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
