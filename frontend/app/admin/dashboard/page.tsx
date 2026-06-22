"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { BarChart, StatusDistribution } from "@/components/ui/DashboardCharts";
import { getPurchaseRequests } from "@/services/purchase-requests.service";
import { getUsers } from "@/services/users.service";
import type { PRData } from "@/services/purchase-requests.service";

const icons = {
  budget: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  allocated: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  available: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  pending: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  approved: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  rejected: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function AdminDashboardPage() {
  const [prs, setPrs] = useState<PRData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mock budget data - will be replaced with API calls
  const companyBudget = 10000000;
  const allocatedBudget = 10000000;
  const availableBudget = companyBudget - allocatedBudget;

  useEffect(() => {
    getPurchaseRequests()
      .then(setPrs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pendingRequests = prs.filter((pr) => pr.status === "Submitted").length;
  const approvedRequests = prs.filter((pr) => pr.status === "Approved").length;
  const rejectedRequests = prs.filter((pr) => pr.status === "Rejected").length;

  // Calculate monthly trend
  const monthCounts: Record<string, number> = {};
  prs.forEach(pr => {
    const d = new Date(pr.dateRequested);
    if (!isNaN(d.getTime())) {
      const month = d.toLocaleString('default', { month: 'short' });
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    }
  });
  const monthlyTrend = Object.keys(monthCounts).map(month => ({
    label: month,
    value: monthCounts[month],
  }));

  const statusDistribution = [
    { status: "Submitted", count: pendingRequests, color: "#EAB308" },
    { status: "Approved", count: approvedRequests, color: "#10B981" },
    { status: "Rejected", count: rejectedRequests, color: "#EF4444" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Admin Overview"
        subtitle="Global system status & key metrics"
        breadcrumbs={[{ label: "Admin" }, { label: "Dashboard" }]}
      />

      {loading ? (
        <div className="p-8 text-center text-secondary/50">Loading dashboard data...</div>
      ) : (
        <>
          {/* Budget Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total Company Budget" value={`₱${companyBudget.toLocaleString()}`} icon={icons.budget} colorScheme="primary" subtitle="Fiscal Year 2026" />
            <StatCard title="Total Allocated Budget" value={`₱${allocatedBudget.toLocaleString()}`} icon={icons.allocated} colorScheme="accent" subtitle="To departments" />
            <StatCard title="Total Available Budget" value={`₱${availableBudget.toLocaleString()}`} icon={icons.available} colorScheme="gold" subtitle="Unallocated" />
          </div>

          {/* PR Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Pending Requests" value={pendingRequests} icon={icons.pending} colorScheme="gold" subtitle="Awaiting review" />
            <StatCard title="Approved Requests" value={approvedRequests} icon={icons.approved} colorScheme="accent" subtitle="Ready for procurement" />
            <StatCard title="Rejected Requests" value={rejectedRequests} icon={icons.rejected} colorScheme="red" subtitle="Declined" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              title="Monthly Procurement Trends"
              data={monthlyTrend}
              color="#408E61"
            />
            <StatusDistribution
              title="PR Status Distribution"
              data={statusDistribution}
            />
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-secondary">Recent Purchase Requests</h3>
              <Link href="/admin/purchase-requests" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                View All →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                    <th className="px-6 py-3 text-left">PR Number</th>
                    <th className="px-6 py-3 text-left">Requestor</th>
                    <th className="px-6 py-3 text-left">Department</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prs.slice(0, 5).map((pr) => (
                    <tr key={pr.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-bold text-primary">{pr.prNumber}</td>
                      <td className="px-6 py-3 text-secondary">{pr.requestedBy}</td>
                      <td className="px-6 py-3 text-secondary/70">{pr.department}</td>
                      <td className="px-6 py-3 font-semibold text-secondary">₱{pr.amount.toLocaleString()}</td>
                      <td className="px-6 py-3">
                        <StatusBadge status={pr.status} />
                      </td>
                      <td className="px-6 py-3 text-secondary/50 text-xs">{pr.dateRequested}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
