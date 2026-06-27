export function ProjectProgressChart() {
  const projects = [
    { name: "Office Renovation", progress: 78, color: "bg-primary" },
    { name: "Residential Complex", progress: 32, color: "bg-blue-500" },
    { name: "Warehouse Extension", progress: 65, color: "bg-green-500" },
    { name: "Retail Unit", progress: 90, color: "bg-purple-500" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Progress by Project</h3>
        <span className="text-xs text-muted-foreground">Last 30 days</span>
      </div>
      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{project.name}</span>
              <span className="text-muted-foreground">{project.progress}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${project.color}`}
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
