"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Shield, Plus, CheckCircle2, Clock, AlertTriangle, Sparkles, Loader2 } from "lucide-react";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600",
  IN_PROGRESS: "bg-blue-500/10 text-blue-600",
  COMPLETED: "bg-green-500/10 text-green-600",
  FAILED: "bg-red-500/10 text-red-600",
};

export default function SafetyPage() {
  const { data: checklists, isLoading } = useQuery({
    queryKey: ["safety-checklists"],
    queryFn: () => api.get("/safety/checklists"),
    select: (res) => res.data.data,
  });

  const items = (checklists as any[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Safety Checklists
          </h1>
          <p className="text-muted-foreground">Manage site safety and compliance</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          New Checklist
        </button>
      </div>

      {/* Compliance Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p className="text-sm text-muted-foreground">Compliant</p>
            </div>
            <p className="text-2xl font-bold mt-1">{items.filter((c: any) => c.status === "COMPLETED").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <p className="text-2xl font-bold mt-1">{items.filter((c: any) => c.status === "IN_PROGRESS").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <p className="text-2xl font-bold mt-1">{items.filter((c: any) => c.status === "PENDING").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
            <p className="text-2xl font-bold mt-1">{items.filter((c: any) => c.status === "FAILED").length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Checklists */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : items.length === 0 ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No safety checklists yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Generate a template or create from scratch</p>
            <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <Sparkles className="h-4 w-4" />
              Generate Template
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((checklist: any) => {
            const itemsList = Array.isArray(checklist.items) ? checklist.items : [];
            const checkedCount = itemsList.filter((i: any) => i.checked).length;
            const progress = itemsList.length > 0 ? Math.round((checkedCount / itemsList.length) * 100) : 0;

            return (
              <Card key={checklist.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className={statusColors[checklist.status]}>
                      {checklist.status}
                    </Badge>
                    {checklist.dueDate && (
                      <span className="text-xs text-muted-foreground">Due: {formatDate(checklist.dueDate)}</span>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">{checklist.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{checklist.project?.name}</p>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{checkedCount}/{itemsList.length} items</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {checklist.aiNotes && (
                    <div className="mt-3 rounded-md bg-muted/50 p-3 text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="font-medium">AI Insights</span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2">{checklist.aiNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
