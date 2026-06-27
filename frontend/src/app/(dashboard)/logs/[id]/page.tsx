"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, Sparkles, CloudRain, Users, Thermometer, FileText } from "lucide-react";

const typeColors: Record<string, string> = {
  GENERAL: "bg-slate-500/10 text-slate-500",
  PROGRESS: "bg-blue-500/10 text-blue-500",
  SAFETY: "bg-red-500/10 text-red-500",
  WEATHER: "bg-cyan-500/10 text-cyan-500",
  DELAY: "bg-yellow-500/10 text-yellow-500",
  INSPECTION: "bg-purple-500/10 text-purple-500",
};

interface LogDetail {
  id: string;
  type: string;
  content: string;
  weather?: string | null;
  crewSize?: number | null;
  temperature?: number | null;
  createdAt: string;
  summary?: string | null;
  author?: { name: string };
  project?: { name: string };
}

export default function LogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logId = params.id as string;

  const { data: log, isLoading } = useQuery({
    queryKey: ["log", logId],
    queryFn: () => api.get(`/logs/${logId}`),
    select: (res) => res.data.data as LogDetail,
    enabled: !!logId,
  });

  const summarizeMutation = useMutation({
    mutationFn: () => api.post(`/logs/${logId}/summarize`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["log", logId] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="flex flex-col items-center py-12">
        <h2 className="text-xl font-semibold">Log not found</h2>
        <Button className="mt-4" onClick={() => router.push("/logs")}>Back to Logs</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/logs")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={typeColors[log.type]}>
                {log.type}
              </Badge>
              <span className="text-sm text-muted-foreground">{log.project?.name}</span>
            </div>
            <h1 className="text-2xl font-bold mt-1">Daily Log</h1>
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>{log.author?.name}</div>
          <div>{formatDateTime(log.createdAt)}</div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-6 text-sm">
            {log.weather && (
              <div className="flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-muted-foreground" />
                <span>{log.weather}</span>
              </div>
            )}
            {log.crewSize && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Crew: {log.crewSize}</span>
              </div>
            )}
            {log.temperature != null && (
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
                <span>{log.temperature}°F</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{log.content}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Summary
            </CardTitle>
            {!log.summary && (
              <Button
                size="sm"
                variant="outline"
                disabled={summarizeMutation.isPending}
                onClick={() => summarizeMutation.mutate()}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {summarizeMutation.isPending ? "Generating..." : "Generate Summary"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {log.summary ? (
            <p className="text-sm leading-relaxed bg-muted/50 rounded-lg p-4">{log.summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No summary generated yet. Click the button above to generate an AI summary.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}