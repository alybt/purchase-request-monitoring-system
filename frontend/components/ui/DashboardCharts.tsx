"use client";

/**
 * DashboardCharts — Pure CSS bar charts (no external charting library required).
 * Renders a vertical bar chart and a simple horizontal distribution list.
 */

interface BarChartProps {
  title: string;
  data: { label: string; value: number }[];
  color?: string;
  maxValue?: number;
}

export function BarChart({ title, data, color = "#408E61", maxValue }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-base font-bold text-secondary mb-4">{title}</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map((d) => {
          const pct = Math.max((d.value / max) * 100, 4);
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-xs font-bold text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                {d.value}
              </span>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{ height: `${pct}%`, backgroundColor: color }}
              />
              <span className="text-xs text-secondary/60 font-medium">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DonutSegment {
  status: string;
  count: number;
  color: string;
}

interface StatusDonutProps {
  title: string;
  data: DonutSegment[];
}

export function StatusDistribution({ title, data }: StatusDonutProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-base font-bold text-secondary mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
          return (
            <div key={d.status}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-secondary capitalize">{d.status}</span>
                <span className="text-sm font-bold text-secondary">
                  {d.count}
                  <span className="text-xs text-secondary/50 font-normal ml-1">({pct}%)</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: d.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
