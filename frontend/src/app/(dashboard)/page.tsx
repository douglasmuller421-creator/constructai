"use client";

import { KPICard } from "@/components/dashboard/kpi-card";
import { AIInsightsPanel } from "@/components/dashboard/ai-insights";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DeadlinesPanel } from "@/components/dashboard/deadlines-panel";
import { ProjectProgressChart } from "@/components/dashboard/progress-chart";
import { BudgetChart } from "@/components/dashboard/budget-chart";
import {
  FolderKanban,
  DollarSign,
  Shield,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your construction projects
        </p>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Active Projects"
          value="24"
          change="+2 this month"
          changeType="positive"
          icon={<FolderKanban className="h-5 w-5 text-primary" />}
          iconBg="bg-orange-100"
        />
        <KPICard
          title="Budget Utilized"
          value="78%"
          change="+12% vs last month"
          changeType="negative"
          icon={<DollarSign className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <KPICard
          title="Open Safety Issues"
          value="8"
          change="-3 resolved"
          changeType="positive"
          icon={<Shield className="h-5 w-5 text-red-600" />}
          iconBg="bg-red-100"
        />
        <KPICard
          title="AI Risk Score"
          value="12%"
          change="Low risk"
          changeType="neutral"
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-100"
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectProgressChart />
        <BudgetChart />
      </div>

      {/* Row 3: Activity + Deadlines */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityFeed />
        <DeadlinesPanel />
      </div>

      {/* Row 4: AI Insights (Full Width) */}
      <AIInsightsPanel />
    </div>
  );
}
