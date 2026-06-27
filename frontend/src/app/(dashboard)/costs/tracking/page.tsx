"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, Plus, Download, Filter } from "lucide-react";

export default function CostTrackingPage() {
  const [projectFilter, setProjectFilter] = useState("");

  const costSummary = {
    totalBudget: 1250000,
    committed: 820000,
    spent: 445000,
    remaining: 805000,
    categories: [
      { name: "Materials", amount: 210000, percent: 47, color: "bg-blue-500" },
      { name: "Labor", amount: 135000, percent: 30, color: "bg-green-500" },
      { name: "Equipment", amount: 65000, percent: 15, color: "bg-amber-500" },
      { name: "Subcontractor", amount: 25000, percent: 6, color: "bg-purple-500" },
      { name: "Other", amount: 10000, percent: 2, color: "bg-gray-500" },
    ],
  };

  const budgetPercent = Math.round((costSummary.spent / costSummary.totalBudget) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cost Tracking</h1>
          <p className="text-muted-foreground">Monitor project budgets and spending</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm hover:bg-accent">
            <Filter className="h-4 w-4" />Filter
          </button>
          <button className="inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm hover:bg-accent">
            <Download className="h-4 w-4" />Export
          </button>
          <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />Add Cost
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Total Budget</p><p className="text-2xl font-bold">{formatCurrency(costSummary.totalBudget)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Committed</p><p className="text-2xl font-bold">{formatCurrency(costSummary.committed)}</p><p className="text-xs text-muted-foreground">{Math.round((costSummary.committed / costSummary.totalBudget) * 100)}% of budget</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Spent</p><p className="text-2xl font-bold">{formatCurrency(costSummary.spent)}</p><p className="text-xs text-green-600">{budgetPercent}% of budget</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4"><p className="text-sm text-muted-foreground">Remaining</p><p className="text-2xl font-bold text-green-600">{formatCurrency(costSummary.remaining)}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">Budget vs Actual</CardTitle></CardHeader><CardContent><div className="space-y-4"><div><div className="flex justify-between text-sm mb-1"><span>Spent</span><span className="font-medium">{formatCurrency(costSummary.spent)}</span></div><div className="h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-primary" style={{ width: `${budgetPercent}%` }} /></div><p className="text-xs text-muted-foreground mt-1">{budgetPercent}% of {formatCurrency(costSummary.totalBudget)}</p></div><div><div className="flex justify-between text-sm mb-1"><span>Committed</span><span className="font-medium">{formatCurrency(costSummary.committed)}</span></div><div className="h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-amber-500" style={{ width: `${Math.round((costSummary.committed / costSummary.totalBudget) * 100)}%` }} /></div></div></div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">By Category</CardTitle></CardHeader><CardContent className="space-y-3">{costSummary.categories.map((cat) => (<div key={cat.name}><div className="flex justify-between text-sm mb-1"><span>{cat.name}</span><span className="font-medium">{formatCurrency(cat.amount)}</span></div><div className="h-2 rounded-full bg-muted"><div className={`h-2 rounded-full ${cat.color}`} style={{ width: `${cat.percent}%` }} /></div></div>))}</CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle className="text-base">Recent Cost Entries</CardTitle></CardHeader><CardContent><div className="flex flex-col items-center justify-center py-12 text-center"><DollarSign className="h-10 w-10 text-muted-foreground/50 mb-3" /><p className="text-sm text-muted-foreground mb-2">No cost entries yet</p><p className="text-xs text-muted-foreground">Add cost entries manually or submit bids to auto-populate</p></div></CardContent></Card>
    </div>
  );
}
