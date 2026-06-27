import {
  Clock,
  FileText,
  Truck,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

const sampleDeadlines = [
  {
    id: "1",
    title: "Tender Due",
    project: "Electrical Phase 2",
    date: "Tomorrow, 5:00 PM",
    urgent: true,
    icon: FileText,
  },
  {
    id: "2",
    title: "RAMS Review",
    project: "Warehouse Extension",
    date: "Jun 28, 2026",
    urgent: false,
    icon: ShieldCheck,
  },
  {
    id: "3",
    title: "Inspection",
    project: "Residential Complex",
    date: "Jul 1, 2026",
    urgent: false,
    icon: AlertCircle,
  },
  {
    id: "4",
    title: "Material Delivery",
    project: "Office Renovation",
    date: "Jul 3, 2026",
    urgent: false,
    icon: Truck,
  },
];

export function DeadlinesPanel() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold">Upcoming Deadlines</h3>
        <button className="text-xs font-medium text-primary hover:text-primary/80">
          View Calendar
        </button>
      </div>
      <div className="divide-y divide-border">
        {sampleDeadlines.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
            >
              <div
                className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                  item.urgent ? "bg-red-100" : "bg-slate-100"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    item.urgent ? "text-red-600" : "text-slate-500"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-tight">
                    {item.title}
                  </p>
                  {item.urgent && (
                    <span className="flex h-2 w-2 rounded-full bg-red-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{item.project}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {item.date}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
