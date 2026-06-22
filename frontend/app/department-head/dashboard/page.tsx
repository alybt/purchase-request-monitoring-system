"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getPurchaseRequests } from "@/services/purchase-requests.service";
import { getMyDepartmentBudget } from "@/services/budget.service";
import type { PRData } from "@/services/purchase-requests.service";
import type { DepartmentBudget, CategoryBudget } from "@/services/budget.service";

const icons = {
  budget: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  available: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  reserved: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  spent: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
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
};

export default function DepartmentHeadDashboardPage() {
  const [prs, setPrs] = useState<PRData[]>([]);
  const [budget, setBudget] = useState<DepartmentBudget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPurchaseRequests().catch(() => [] as PRData[]),
      getMyDepartmentBudget().catch(() => ({ department_budget: null, category_budgets: [] })),
    ]).then(([prData, budgetData]) => {
      setPrs(prData);
      setBudget(budgetData.department_budget);
    }).finally(() => setLoading(false));
  }, []);

  const pendingRequests = prs.filter((pr) => pr.status === "Submitted").length;
  const approvedRequests = prs.filter((pr) => pr.status === "Approved").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Department Head Dashboard"
        subtitle="Track your department budget and purchase requests"
        breadcrumbs={[{ label: "Department Head" }, { label: "Dashboard" }]}
        actions={
          <Link
            href="/department-head/purchase-requests/create"
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Request
          </Link>
        }
      />

      {loading ? (
        <div className="p-8 text-center text-secondary/50">Loading dashboard...</div>
      ) : (
        <>
          {/* Budget Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Department Budget"
              value={budget ? `₱${budget.allocated.toLocaleString()}` : "N/A"}
              icon={icons.budget}
              colorScheme="primary"
              subtitle="Total allocation"
            />
            <StatCard
              title="Available Budget"
              value={budget ? `₱${budget.available.toLocaleString()}` : "N/A"}
              icon={icons.available}
              colorScheme="accent"
              subtitle="Ready to use"
            />
            <StatCard
              title="Reserved Budget"
              value={budget ? `₱${budget.reserved.toLocaleString()}` : "N/A"}
              icon={icons.reserved}
              colorScheme="gold"
              subtitle="Pending PRs"
            />
            <StatCard
              title="Spent Budget"
              value={budget ? `₱${budget.spent.toLocaleString()}` : "N/A"}
              icon={icons.spent}
              colorScheme="blue"
              subtitle="Completed"
            />
          </div>

          {/* PR Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard title="Pending Requests" value={pendingRequests} icon={icons.pending} colorScheme="gold" subtitle="Awaiting approval" />
            <StatCard title="Approved Requests" value={approvedRequests} icon={icons.approved} colorScheme="accent" subtitle="Ready for procurement" />
          </div>

          {/* Recent Requests */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-secondary">My Recent Requests</h3>
              <Link href="/department-head/purchase-requests" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                View All →
              </Link>
            </div>

            {prs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <svg className="w-12 h-12 text-secondary/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-secondary/50 font-medium">You haven&apos;t submitted any requests yet.</p>
                <Link href="/department-head/purchase-requests/create" className="text-sm text-primary font-semibold hover:underline">
                  Create your first request →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {prs.slice(0, 5).map((pr) => (
                  <li key={pr.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-primary">{pr.prNumber}</p>
                      <p className="text-xs text-secondary/60 mt-0.5 max-w-xs truncate">{pr.description}</p>
                      <p className="text-xs text-secondary/40 mt-0.5">{pr.dateRequested}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-secondary">₱{pr.amount.toLocaleString()}</p>
                        <StatusBadge status={pr.status} />
                      </div>
                      <Link
                        href={`/department-head/purchase-requests/${pr.id}`}
                        className="text-xs font-semibold text-secondary/60 hover:text-primary transition-colors"
                      >
                        View →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
