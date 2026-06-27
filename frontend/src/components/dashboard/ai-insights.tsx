import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

interface Insight {
  id: string;
  type: "warning" | "danger" | "success" | "info";
  title: string;
  description: string;
}

const sampleInsights: Insight[] = [
  {
    id: "1",
    type: "warning",
    title: "Project Alpha may be delayed 6 days",
    description:
      "Weather forecast and subcontractor availability indicate schedule risk on critical path.",
  },
  {
    id: "2",
    type: "danger",
    title: "Concrete package exceeds estimate",
    description:
      "Current material costs are 18% above initial estimate. Review supplier contracts.",
  },
  {
    id: "3",
    type: "warning",
    title: "Safety incidents trending upward",
    description:
      "3 minor incidents this week across active projects. Schedule refresher training.",
  },
  {
    id: "4",
    type: "success",
    title: "Electrical package on schedule",
    description:
      "ABC Electric submitted bid within budget. Recommend proceeding with award.",
  },
];

const typeConfig = {
  warning: {
    icon: AlertTriangle,
    bg: "bg-orange-50",
    text: "text-orange-700",
    iconColor: "text-orange-500",
  },
  danger: {
    icon: AlertTriangle,
    bg: "bg-red-50",
    text: "text-red-700",
    iconColor: "text-red-500",
  },
  success: {
    icon: CheckCircle2,
    bg: "bg-green-50",
    text: "text-green-700",
    iconColor: "text-green-500",
  },
  info: {
    icon: TrendingUp,
    bg: "bg-blue-50",
    text: "text-blue-700",
    iconColor: "text-blue-500",
  },
};

export function AIInsightsPanel() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-100">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold">AI Recommendations</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          Updated 5 min ago
        </span>
      </div>
      <div className="divide-y divide-border">
        {sampleInsights.map((insight) => {
          const config = typeConfig[insight.type];
          const Icon = config.icon;
          return (
            <div
              key={insight.id}
              className="flex items-start gap-3 px-5 py-4 hover:bg-muted/30 transition-colors"
            >
              <div
                className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${config.bg}`}
              >
                <Icon className={`h-4 w-4 ${config.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${config.text}`}>
                  {insight.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {insight.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
