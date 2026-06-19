"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { BarChart, StatusDistribution } from "@/components/ui/DashboardCharts";
import { getDashboardMetrics, DashboardMetrics } from "@/services/dashboard.service";
import { getPurchaseRequests } from "@/services/purchase-requests.service";

export default function AdminReportsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [statusCounts, setStatusCounts] = useState<{ pending: number, approved: number, rejected: number }>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  // Filters for UI only
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    Promise.all([
      getDashboardMetrics(),
      getPurchaseRequests()
    ])
      .then(([metricsData, prData]) => {
        setMetrics(metricsData);
        
        let pending = 0;
        let approved = 0;
        let rejected = 0;
        prData.forEach(pr => {
          if (pr.status === "pending") pending++;
          else if (pr.status === "approved" || pr.status === "completed") approved++;
          else if (pr.status === "rejected") rejected++;
        });
        setStatusCounts({ pending, approved, rejected });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleExport = (format: string) => {
    alert(`Exporting as ${format}… (frontend-only demo)`);
  };

  if (loading) {
    return <div className="p-8 text-center text-secondary/50">Loading reports...</div>;
  }

  const totalSpending = metrics?.total_spent || 0;
  const totalRequests = metrics?.department_breakdown.reduce((s, d) => s + d.pr_count, 0) || 0;
  const avgApprovalTime = "N/A"; // Could be calculated if timestamps were tracked fully

  const monthlyTrendData = metrics?.monthly_data.map(d => ({
    label: d.month.substring(0, 3), // short month
    value: Math.round(d.spent / 1000)
  })).reverse() || [];

  const statusDistribution = [
    { status: "Pending", count: statusCounts.pending, color: "#EAB308" },
    { status: "Approved", count: statusCounts.approved, color: "#10B981" },
    { status: "Rejected", count: statusCounts.rejected, color: "#EF4444" },
  ];

  const departmentBreakdown = metrics?.department_breakdown.map(d => ({
    department: d.department || "General",
    count: d.pr_count,
    amount: d.total_spent
  })) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Procurement spending trends and request analytics"
        breadcrumbs={[{ label: "Admin" }, { label: "Reports" }]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => handleExport("CSV")} className="text-xs font-semibold text-secondary/70 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              CSV
            </button>
            <button onClick={() => handleExport("Excel")} className="text-xs font-semibold text-secondary/70 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Excel
            </button>
            <button onClick={() => handleExport("PDF")} className="text-xs font-semibold text-white bg-primary border border-primary px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              PDF
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-secondary/60">From:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-secondary/60">To:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">All Departments</option>
            {["IT", "HR", "Finance", "Operations", "Marketing"].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <p className="text-xs font-bold uppercase text-secondary/50 tracking-wide mb-2">Total Spending</p>
          <p className="text-3xl font-extrabold text-secondary">₱{totalSpending.toLocaleString()}</p>
          {metrics?.total_spent_change_percentage != null && (
            <p className={`text-xs font-semibold mt-1 ${metrics.total_spent_change_percentage >= 0 ? 'text-primary' : 'text-red-500'}`}>
              {metrics.total_spent_change_percentage >= 0 ? '+' : ''}{metrics.total_spent_change_percentage}% from last period
            </p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <p className="text-xs font-bold uppercase text-secondary/50 tracking-wide mb-2">Total Requests</p>
          <p className="text-3xl font-extrabold text-secondary">{totalRequests}</p>
          <p className="text-xs text-gold font-semibold mt-1">Across all departments</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <p className="text-xs font-bold uppercase text-secondary/50 tracking-wide mb-2">Avg Approval Time</p>
          <p className="text-3xl font-extrabold text-secondary">{avgApprovalTime}</p>
          <p className="text-xs text-secondary/50 font-medium mt-1">From submission to decision</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Monthly Spending Trend (₱K)"
          data={monthlyTrendData}
          color="#408E61"
        />
        <StatusDistribution
          title="Approval Status Distribution"
          data={statusDistribution}
        />
      </div>

      {/* Requests per Department Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-secondary">Requests Per Department</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                <th className="px-6 py-3 text-left">Department</th>
                <th className="px-6 py-3 text-left">Requests</th>
                <th className="px-6 py-3 text-left">Total Spend</th>
                <th className="px-6 py-3 text-left">Avg per Request</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departmentBreakdown.map((row) => (
                <tr key={row.department} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-semibold text-secondary">{row.department}</td>
                  <td className="px-6 py-3 text-secondary/70">{row.count}</td>
                  <td className="px-6 py-3 font-semibold text-secondary">₱{row.amount.toLocaleString()}</td>
                  <td className="px-6 py-3 text-secondary/70">₱{row.count > 0 ? Math.round(row.amount / row.count).toLocaleString() : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
