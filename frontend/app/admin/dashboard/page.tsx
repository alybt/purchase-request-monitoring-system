"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { BarChart, StatusDistribution } from "@/components/ui/DashboardCharts";
import { getPurchaseRequests } from "@/services/purchase-requests.service";
import { getCompanyBudget, getBudgetSummary } from "@/services/budget.service";
import { getUsers } from "@/services/users.service";
import type { PRData } from "@/services/purchase-requests.service";

const icons = {
  budget: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 4v16M9 6h5a3 3 0 010 6H9M6 9h9M6 12h9"
      />
    </svg>
  ),
  allocated: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  available: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  ),
  pending: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  approved: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  rejected: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

export default function AdminDashboardPage() {
  const [prs, setPrs] = useState<PRData[]>([]);
  const [loading, setLoading] = useState(true);

  const safeNum = (val: any): number => {
    if (val === null || val === undefined || val === "") return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const [companyBudget, setCompanyBudget] = useState(0);
  const [allocatedBudget, setAllocatedBudget] = useState(0);
  const availableBudget = Math.max(
    0,
    safeNum(companyBudget) - safeNum(allocatedBudget),
  );

  useEffect(() => {
    const year = new Date().getFullYear();
    Promise.all([
      getPurchaseRequests().catch(() => []),
      getCompanyBudget(year).catch(() => null),
      getBudgetSummary(year).catch(() => null),
    ])
      .then(([prsData, cbData, summaryData]) => {
        setPrs(prsData as PRData[]);
        if (cbData)
          setCompanyBudget(
            safeNum(cbData.total_budget) + safeNum(cbData.carry_forward),
          );
        if (summaryData)
          setAllocatedBudget(safeNum(summaryData.total_allocated));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pendingRequests = prs.filter((pr) => pr.status === "Pending").length;
  const approvedRequests = prs.filter((pr) => pr.status === "Approved").length;
  const rejectedRequests = prs.filter((pr) => pr.status === "Rejected").length;

  // Calculate Purchase Request Trends by Category
  const categoryCounts: Record<string, number> = {};
  prs
    .filter((pr) => pr.status !== "Draft")
    .forEach((pr) => {
      const categoryName = pr.category || "Uncategorized";
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
    });

  const categoryTrend = Object.keys(categoryCounts)
    .map((category) => ({
      label: category,
      value: categoryCounts[category] || 0,
    }))
    .sort((a, b) => b.value - a.value);

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
        <div className="p-8 text-center text-secondary/50">
          Loading dashboard data...
        </div>
      ) : (
        <>
          {/* Budget Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Company Budget"
              value={`₱${safeNum(companyBudget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={icons.budget}
              colorScheme="primary"
              subtitle={`Fiscal Year ${new Date().getFullYear()}`}
            />
            <StatCard
              title="Total Allocated Budget"
              value={`₱${safeNum(allocatedBudget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={icons.allocated}
              colorScheme="accent"
              subtitle="To departments"
            />
            <StatCard
              title="Total Available Budget"
              value={`₱${safeNum(availableBudget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={icons.available}
              colorScheme="gold"
              subtitle="Unallocated"
            />
          </div>

          {/* PR Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Pending Requests"
              value={pendingRequests}
              icon={icons.pending}
              colorScheme="gold"
              subtitle="Awaiting review"
            />
            <StatCard
              title="Approved Requests"
              value={approvedRequests}
              icon={icons.approved}
              colorScheme="accent"
              subtitle="Ready for procurement"
            />
            <StatCard
              title="Rejected Requests"
              value={rejectedRequests}
              icon={icons.rejected}
              colorScheme="red"
              subtitle="Declined"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              title="Purchase Request Trends by Category"
              data={categoryTrend}
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
              <h3 className="text-base font-bold text-secondary">
                Recent Purchase Requests
              </h3>
              <Link
                href="/admin/purchase-requests"
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
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
                    <tr
                      key={pr.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-3 font-bold text-primary">
                        {pr.prNumber}
                      </td>
                      <td className="px-6 py-3 text-secondary">
                        {pr.requestedBy}
                      </td>
                      <td className="px-6 py-3 text-secondary/70">
                        {pr.department}
                      </td>
                      <td className="px-6 py-3 font-semibold text-secondary">
                        ₱{pr.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={pr.status} />
                      </td>
                      <td className="px-6 py-3 text-secondary/50 text-xs">
                        {pr.dateRequested}
                      </td>
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
