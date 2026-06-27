"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Phone, Mail, MapPin } from "lucide-react";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-600 border-green-500/20",
  SUSPENDED: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  BLACKLISTED: "bg-red-500/10 text-red-600 border-red-500/20",
};

interface SubDetail {
  companyName: string;
  tradingName?: string | null;
  registrationNo?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  postcode?: string | null;
  status: string;
  riskLevel: string;
  insuranceExpiry?: string | null;
  rating: number;
}

export default function SubcontractorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subId = params.id as string;

  const { data: sub, isLoading } = useQuery({
    queryKey: ["subcontractor", subId],
    queryFn: () => api.get(`/subcontractors/${subId}`),
    select: (res) => res.data.data as SubDetail,
    enabled: !!subId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card><CardContent className="pt-6 space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="flex flex-col items-center py-12">
        <h2 className="text-xl font-semibold">Subcontractor not found</h2>
        <Button className="mt-4" onClick={() => router.push("/subcontractors")}>Back</Button>
      </div>
    );
  }

  const insuranceExpired = sub.insuranceExpiry && new Date(sub.insuranceExpiry) < new Date();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/subcontractors")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{sub.companyName}</h1>
              <Badge variant="outline" className={statusColors[sub.status]}>{sub.status}</Badge>
            </div>
            {sub.registrationNo && <p className="text-xs text-muted-foreground">Reg: {sub.registrationNo}</p>}
          </div>
        </div>
        <Button>Invite to Bid</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Company Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {sub.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{sub.email}</div>}
              {sub.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{sub.phone}</div>}
              {sub.city && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" />{sub.city}{sub.postcode ? ", " + sub.postcode : ""}</div>}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Insurance</CardTitle></CardHeader>
            <CardContent>
              {!sub.insuranceExpiry ? (
                <Badge variant="outline" className="bg-gray-500/10 text-gray-500">No data</Badge>
              ) : insuranceExpired ? (
                <Badge variant="outline" className="bg-red-500/10 text-red-600">Expired</Badge>
              ) : (
                <Badge variant="outline" className="bg-green-500/10 text-green-600">Valid until {formatDate(sub.insuranceExpiry)}</Badge>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Rating</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sub.rating > 0 ? sub.rating.toFixed(1) : "—"}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
