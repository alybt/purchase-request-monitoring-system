"use client";

import { useEffect, useState } from "react";
import { getDashboardMetrics, DashboardMetrics } from "@/services/dashboard.service";

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReportsData() {
      try {
        setLoading(true);
        const fetchedMetrics = await getDashboardMetrics();
        setMetrics(fetchedMetrics);
      } catch (err: any) {
        setError(err.message || "Failed to load report analytics");
      } finally {
        setLoading(false);
      }
    }
    loadReportsData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-primary mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-slate-400 font-semibold">Generating report charts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50 p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
          Error: {error}
        </div>
      </div>
    );
  }

  // Find max value in monthly data for scale
  const maxMonthSpent = metrics?.monthly_data.reduce((max, d) => (d.spent > max ? d.spent : max), 1) || 1;

  // Find total requests across all departments
  const totalDeptPRs = metrics?.department_breakdown.reduce((sum, d) => sum + d.pr_count, 0) || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50 p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Report Analytics</h1>
          <p className="text-secondary/70 text-sm mt-1">
            Visualize system performance and expenditure trends.
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => window.location.reload()}
          className="border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 10H18.21" />
          </svg>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Area 1 - Monthly Expenditure */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-shadow hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-secondary">Monthly Expenditure</h3>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Last 6 Months
            </span>
          </div>

          {/* Custom Responsive SVG/HTML Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-4 px-4 pt-6 border-b border-l border-slate-200 rounded-xl bg-slate-50/50">
            {metrics?.monthly_data.map((d, index) => {
              const heightPercentage = Math.max((d.spent / maxMonthSpent) * 100, 3); // Minimum 3% height for visibility
              return (
                <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip */}
                  <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap">
                    ₱{d.spent.toLocaleString()}
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPercentage}%` }}
                    className="w-full bg-primary/20 hover:bg-primary border border-primary/30 hover:border-primary rounded-t-md transition-all duration-500 cursor-pointer shadow-sm"
                  />

                  {/* Label */}
                  <span className="text-[10px] font-semibold text-slate-400 mt-2 truncate w-full text-center">
                    {d.month.substring(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart Area 2 - Requests by Department */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-shadow hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-secondary">Requests by Department</h3>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Department Breakdown
            </span>
          </div>

          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {metrics?.department_breakdown.length === 0 ? (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                <span className="text-sm text-slate-400">No department data recorded.</span>
              </div>
            ) : (
              metrics?.department_breakdown.map((dept, index) => {
                const percentage = Math.round((dept.pr_count / totalDeptPRs) * 100);
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-secondary">
                      <span>{dept.department}</span>
                      <span className="text-slate-400">
                        {dept.pr_count} PR{dept.pr_count > 1 ? "s" : ""} ({percentage}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                      />
                    </div>

                    <div className="text-[10px] text-right font-medium text-slate-400">
                      Total Cost: ₱{dept.total_spent.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}