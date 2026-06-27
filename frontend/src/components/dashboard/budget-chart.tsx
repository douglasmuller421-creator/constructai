export function BudgetChart() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const budgetData = [120, 180, 220, 280, 320, 380];
  const actualData = [115, 175, 240, 290, 350, 410];
  const maxValue = 500;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Budget vs Actual Cost</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">Budget</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Actual</span>
          </div>
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-40">
        {months.map((month, i) => {
          const budgetHeight = (budgetData[i] / maxValue) * 100;
          const actualHeight = (actualData[i] / maxValue) * 100;
          return (
            <div key={month} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-end gap-1 h-32 w-full justify-center">
                <div
                  className="w-4 rounded-t bg-primary/80 transition-all duration-300"
                  style={{ height: `${budgetHeight}%` }}
                  title={`Budget: £${budgetData[i]}K`}
                />
                <div
                  className="w-4 rounded-t bg-blue-500/80 transition-all duration-300"
                  style={{ height: `${actualHeight}%` }}
                  title={`Actual: £${actualData[i]}K`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{month}</span>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div>
          <p className="text-xs text-muted-foreground">Total Budget</p>
          <p className="text-sm font-semibold">£500,000</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Spent to Date</p>
          <p className="text-sm font-semibold text-orange-600">£410,000</p>
        </div>
      </div>
    </div>
  );
}
