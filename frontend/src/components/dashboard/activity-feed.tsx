"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { FileText, HardHat, Shield, DollarSign, Users } from "lucide-react";

const sampleActivity = [
  {
    id: "1",
    type: "log",
    message: "Project Alpha updated",
    user: "John M.",
    time: new Date(Date.now() - 1000 * 60 * 2),
    icon: FileText,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "2",
    type: "safety",
    message: "Safety report submitted",
    user: "Sarah K.",
    time: new Date(Date.now() - 1000 * 60 * 60),
    icon: Shield,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    id: "3",
    type: "subcontractor",
    message: "New subcontractor added",
    user: "Mike T.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 3),
    icon: Users,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    id: "4",
    type: "cost",
    message: "Cost estimate generated",
    user: "AI Assistant",
    time: new Date(Date.now() - 1000 * 60 * 60 * 5),
    icon: DollarSign,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
];

export function ActivityFeed() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold">Recent Activity</h3>
        <button className="text-xs font-medium text-primary hover:text-primary/80">
          View All
        </button>
      </div>
      <div className="divide-y divide-border">
        {sampleActivity.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
            >
              <div
                className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${item.iconBg}`}
              >
                <Icon className={`h-4 w-4 ${item.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">
                  {item.message}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.user} · {format(item.time, "h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
