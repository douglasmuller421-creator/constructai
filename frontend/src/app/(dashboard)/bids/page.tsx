"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Plus, Search, FileText, Clock } from "lucide-react";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  ISSUED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  CLOSED: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  AWARDED: "bg-green-500/10 text-green-600 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function BidsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["bid-packages", { status: statusFilter }],
    queryFn: () => api.get("/bids/packages", { params: { status: statusFilter || undefined } }),
    select: (res) => res.data.data as { items: Array<{ id: string; name: string; status: string; project?: { name: string }; invitedSubs?: string[]; bids?: Array<{ id: string }>; createdAt: string; submissionDeadline?: string; estimatedValue?: number }> },
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Tender Packages
          </h1>
          <p className="text-muted-foreground">Manage bid packages and subcontractor procurement</p>
        </div>
        <Link href="/bids/new">
          <Button><Plus className="mr-2 h-4 w-4" />New Package</Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search packages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select className="flex h-10 w-36 rounded-md border border-input bg-background px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="ISSUED">Issued</option>
          <option value="CLOSED">Closed</option>
          <option value="AWARDED">Awarded</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardHeader><Skeleton className="h-5 w-48" /></CardHeader><CardContent><Skeleton className="h-4 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No bid packages yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">Create your first tender package to start procurement.</p>
            <Link href="/bids/new"><Button>Create First Package</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((pkg: any) => (
            <Link key={pkg.id} href={`/bids/${pkg.id}`}>
              <Card className="transition-colors hover:border-primary/50 cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColors[pkg.status]}>{pkg.status}</Badge>
                      <span className="text-xs text-muted-foreground">{pkg.project?.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(pkg.createdAt)}</span>
                  </div>
                  <CardTitle className="text-base mt-2">{pkg.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {pkg.estimatedValue && <span>Est: {formatCurrency(pkg.estimatedValue)}</span>}
                      {pkg.submissionDeadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />Due: {formatDate(pkg.submissionDeadline)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">{pkg._count?.bids ?? 0} bids</Badge>
                      {pkg.invitedSubs?.length > 0 && (
                        <Badge variant="secondary" className="text-xs">{pkg.invitedSubs.length} invited</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
