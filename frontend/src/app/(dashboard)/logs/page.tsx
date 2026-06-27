"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Plus, Search, FileText, Sparkles, Eye, Trash2, Loader2 } from "lucide-react";

const typeColors: Record<string, string> = {
  GENERAL: "bg-slate-500/10 text-slate-600",
  PROGRESS: "bg-blue-500/10 text-blue-600",
  SAFETY: "bg-red-500/10 text-red-600",
  WEATHER: "bg-cyan-500/10 text-cyan-600",
  DELAY: "bg-yellow-500/10 text-yellow-600",
  INSPECTION: "bg-purple-500/10 text-purple-600",
};

export default function LogsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["logs", { search, type: typeFilter }],
    queryFn: () => api.get("/logs", { params: { search, type: typeFilter || undefined } }),
    select: (res) => res.data.data,
  });

  const summarizeMutation = useMutation({
    mutationFn: (logId: string) => api.post(`/logs/${logId}/summarize`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["logs"] }),
  });

  const items = (data as any)?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Logs</h1>
          <p className="text-muted-foreground">Track daily site activity</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          New Log
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <select className="h-10 w-36 rounded-md border border-input bg-background px-3 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="GENERAL">General</option>
          <option value="PROGRESS">Progress</option>
          <option value="SAFETY">Safety</option>
          <option value="WEATHER">Weather</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No logs yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Start tracking daily site activity</p>
            <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <Plus className="h-4 w-4" />Create First Log
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((log: any) => (
            <Card key={log.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={typeColors[log.type] || "bg-gray-500/10 text-gray-600"}>
                        {log.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{log.project?.name}</span>
                      {log.summary && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />AI
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2">{log.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{log.author?.name}</span>
                      <span>{formatDate(log.createdAt)}</span>
                      {log.weather && <span>{log.weather}</span>}
                      {log.crewSize && <span>Crew: {log.crewSize}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!log.summary && (
                      <button
                        onClick={() => summarizeMutation.mutate(log.id)}
                        disabled={summarizeMutation.isPending}
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                        title="Generate AI summary"
                      >
                        {summarizeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      </button>
                    )}
                    <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
