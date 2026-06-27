"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const logTypes = [
  { value: "GENERAL", label: "General" },
  { value: "PROGRESS", label: "Progress" },
  { value: "SAFETY", label: "Safety" },
  { value: "WEATHER", label: "Weather" },
  { value: "DELAY", label: "Delay" },
  { value: "INSPECTION", label: "Inspection" },
];

interface ProjectItem {
  id: string;
  name: string;
}

export default function NewLogPage() {
  const router = useRouter();
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState("GENERAL");
  const [content, setContent] = useState("");
  const [weather, setWeather] = useState("");
  const [crewSize, setCrewSize] = useState("");
  const [temperature, setTemperature] = useState("");

  const { data: projectsData } = useQuery({
    queryKey: ["projects-list"],
    queryFn: () => api.get("/projects", { params: { limit: 50 } }),
    select: (res) => (res.data.data as { items: ProjectItem[] })?.items ?? [],
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/logs", {
        projectId,
        type,
        content,
        weather: weather || undefined,
        crewSize: crewSize ? parseInt(crewSize) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
      }),
    onSuccess: (response) => {
      const log = response.data.data as { id: string };
      router.push(`/logs/${log.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Daily Log</h1>
        <p className="text-muted-foreground">Record site activity for today</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Entry</CardTitle>
          <CardDescription>Fill in the details about today&apos;s site activity</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {createMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {(createMutation.error as { error?: { message?: string } })?.error?.message || "Failed to create log"}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="projectId">Project *</Label>
              <select
                id="projectId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                <option value="">Select a project...</option>
                {(projectsData ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Log Type *</Label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {logTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Activity Description *</Label>
              <textarea
                id="content"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Describe what happened today on site..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="weather">Weather</Label>
                <Input id="weather" placeholder="e.g., Clear, 72°F" value={weather} onChange={(e) => setWeather(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crewSize">Crew Size</Label>
                <Input id="crewSize" type="number" placeholder="e.g., 8" value={crewSize} onChange={(e) => setCrewSize(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°F)</Label>
                <Input id="temperature" type="number" placeholder="e.g., 72" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                "Save Log"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}