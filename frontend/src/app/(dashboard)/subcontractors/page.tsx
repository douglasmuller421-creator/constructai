"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Building2, Phone, Mail, MapPin, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-600 border-green-500/20",
  SUSPENDED: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  BLACKLISTED: "bg-red-500/10 text-red-600 border-red-500/20",
};

const riskColors: Record<string, string> = {
  LOW: "bg-green-500/10 text-green-600",
  MEDIUM: "bg-yellow-500/10 text-yellow-600",
  HIGH: "bg-red-500/10 text-red-600",
};

export default function SubcontractorsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["subcontractors", { search, status: statusFilter, riskLevel: riskFilter }],
    queryFn: () =>
      api.get("/subcontractors", {
        params: { search, status: statusFilter || undefined, riskLevel: riskFilter || undefined },
      }),
    select: (res) => (res.data.data as { items: Array<{ id: string; companyName: string; tradingName?: string; city?: string; postcode?: string; status: string; riskLevel: string; insuranceExpiry?: string | null; rating: number; tradeCategories?: string[]; _count?: { documents: number; endorsements: number; bids: number } }> })?.items ?? [],
  });

  const items = ((data as any)?.items ?? []) as Array<{ id: string; companyName: string; tradingName?: string; city?: string; postcode?: string; status: string; riskLevel: string; insuranceExpiry?: string | null; rating: number; tradeCategories?: string[]; _count?: { documents: number; endorsements: number; bids: number } }>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            Subcontractors
          </h1>
          <p className="text-muted-foreground">Manage your supply chain and compliance</p>
        </div>
        <Link href="/subcontractors/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Subcontractor
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, company number, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="flex h-10 w-32 rounded-md border border-input bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BLACKLISTED">Blacklisted</option>
        </select>
        <select
          className="flex h-10 w-32 rounded-md border border-input bg-background px-3 text-sm"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
        >
          <option value="">All Risk</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-5 w-48" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No subcontractors found</h3>
            <p className="mb-4 text-sm text-muted-foreground">Add subcontractors to track their compliance and bidding.</p>
            <Link href="/subcontractors/new"><Button>Add First Subcontractor</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Company</th>
                <th className="px-4 py-3 text-left font-medium">Contact</th>
                <th className="px-4 py-3 text-left font-medium">Location</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Risk</th>
                <th className="px-4 py-3 text-center font-medium">Insurance</th>
              </tr>
            </thead>
            <tbody>
              {items.map((sub: any) => {
                const insuranceExpired = sub.insuranceExpiry && new Date(sub.insuranceExpiry) < new Date();
                const insuranceExpiringSoon = sub.insuranceExpiry && !insuranceExpired &&
                  new Date(sub.insuranceExpiry) < new Date(Date.now() + 30 * 86400000);
                return (
                  <tr key={sub.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link href={"/subcontractors/" + sub.id} className="font-medium hover:text-primary">
                        {sub.companyName}
                      </Link>
                      {sub.tradingName && <div className="text-xs text-muted-foreground">t/a {sub.tradingName}</div>}
                      {sub.tradeCategories?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {sub.tradeCategories.slice(0, 3).map((cat: string) => (
                            <Badge key={cat} variant="secondary" className="text-[10px] h-4">{cat}</Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sub.primaryContactName && <div className="flex items-center gap-1 text-xs"><Building2 className="h-3 w-3 text-muted-foreground" />{sub.primaryContactName}</div>}
                      {sub.email && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{sub.email}</div>}
                      {sub.phone && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{sub.phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {sub.city && <div className="flex items-center gap-1 text-xs"><MapPin className="h-3 w-3 text-muted-foreground" />{sub.city}{sub.postcode ? ", " + sub.postcode : ""}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={statusColors[sub.status]}>{sub.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={riskColors[sub.riskLevel]}>{sub.riskLevel}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!sub.insuranceExpiry ? (
                        <Badge variant="outline" className="bg-gray-500/10 text-gray-500">No data</Badge>
                      ) : insuranceExpired ? (
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 flex items-center gap-1 w-fit mx-auto"><AlertTriangle className="h-3 w-3" /> Expired</Badge>
                      ) : insuranceExpiringSoon ? (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 flex items-center gap-1 w-fit mx-auto"><Clock className="h-3 w-3" /> Expiring</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 flex items-center gap-1 w-fit mx-auto"><CheckCircle2 className="h-3 w-3" /> Valid</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(data as any)?.pagination && (data as any).pagination.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {items.length} of {(data as any).pagination.total} subcontractors</span>
        </div>
      )}
    </div>
  );
}