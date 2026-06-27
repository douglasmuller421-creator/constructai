import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  iconBg: string;
}

export function KPICard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  iconBg,
}: KPICardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {change && (
            <div className="flex items-center gap-1 pt-1">
              {changeType === "positive" ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              ) : changeType === "negative" ? (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              ) : null}
              <span
                className={cn(
                  "text-xs font-medium",
                  changeType === "positive" && "text-green-600",
                  changeType === "negative" && "text-red-600",
                  changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {change}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-lg",
            iconBg
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
