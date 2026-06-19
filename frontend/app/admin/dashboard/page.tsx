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
  total: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export default function AdminDashboardPage() {
  const [prs, setPrs] = useState<PRData[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPurchaseRequests(),
      getUsers(),
    ])
      .then(([prData, userData]) => {
        setPrs(prData);
        setActiveUsers(userData.filter(u => u.status === 'active').length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalPRs = prs.length;
  const pendingRequests = prs.filter((pr) => pr.status === "pending").length;
  const approvedRequests = prs.filter((pr) => pr.status === "approved" || pr.status === "completed").length;
  const rejectedRequests = prs.filter((pr) => pr.status === "rejected").length;

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
    { status: "Pending", count: pendingRequests, color: "#EAB308" },
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
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <StatCard title="Total PRs" value={totalPRs} icon={icons.total} colorScheme="primary" subtitle="All time requests" />
            <StatCard title="Pending" value={pendingRequests} icon={icons.pending} colorScheme="gold" subtitle="Awaiting action" />
            <StatCard title="Approved" value={approvedRequests} icon={icons.approved} colorScheme="accent" subtitle="This period" />
            <StatCard title="Rejected" value={rejectedRequests} icon={icons.rejected} colorScheme="red" subtitle="Declined" />
            <StatCard title="Active Users" value={activeUsers} icon={icons.users} colorScheme="blue" subtitle="Currently active" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              title="Monthly Purchase Requests"
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
              <Link href="/admin/pr-management" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
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
