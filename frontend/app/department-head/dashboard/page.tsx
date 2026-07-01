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
  categoryAllocated: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  categoryRemaining: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  document: (
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  completed: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
};

export default function DepartmentHeadDashboardPage() {
  const [prs, setPrs] = useState<PRData[]>([]);
  const [budget, setBudget] = useState<DepartmentBudget | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {}
      }
    }

    Promise.all([
      getPurchaseRequests().catch(() => [] as PRData[]),
      getMyDepartmentBudget().catch(() => ({ department_budget: null, category_budgets: [] })),
    ]).then(([prData, budgetData]) => {
      setPrs(prData);
      setBudget(budgetData.department_budget);
      setCategoryBudgets(budgetData.category_budgets);
    }).finally(() => setLoading(false));
  }, []);

  const totalPrs = prs.length;
  const pendingRequests = prs.filter((pr) => pr.status === "Pending" || pr.status === "pending").length;
  const approvedRequests = prs.filter((pr) => pr.status === "Approved" || pr.status === "Ordered" || pr.status === "Received" || pr.status === "Released").length;
  const completedRequests = prs.filter((pr) => pr.status === "Completed").length;

  const categoryAllocated = categoryBudgets.reduce((sum, c) => sum + c.allocated, 0);
  const categoryRemaining = (budget?.allocated || 0) - categoryAllocated;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <PageHeader
        title="Department Head Dashboard"
        subtitle="Track your department budget and purchase requests"
        breadcrumbs={[{ label: "Department Head" }, { label: "Dashboard" }]}
      />

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <svg className="animate-spin h-8 w-8 text-primary mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-slate-500 font-medium">Loading dashboard...</span>
        </div>
      ) : (
        <>
          {/* Context Plain Text */}
          <div className="mb-2">
            <p className="text-base font-bold text-secondary">Fiscal Year {budget?.fiscal_year || new Date().getFullYear()}</p>
          </div>

          {/* KPI Grid - Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard
              title="Total Department Allocation"
              value={budget ? `₱${budget.allocated.toLocaleString()}` : "N/A"}
              icon={icons.budget}
              colorScheme="primary"
              subtitle="Total Admin Allocation"
            />
            <StatCard
              title="Total Allocated Budget"
              value={`₱${categoryAllocated.toLocaleString()}`}
              icon={icons.categoryAllocated}
              colorScheme="blue"
              subtitle="Assigned to Categories"
            />
            <StatCard
              title="Total Available Budget"
              value={`₱${Math.max(0, categoryRemaining).toLocaleString()}`}
              icon={icons.categoryRemaining}
              colorScheme="gold"
              subtitle="Unallocated to Categories"
            />
          </div>

          {/* KPI Grid - PRs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard 
              title="Pending Requests" 
              value={pendingRequests} 
              icon={icons.pending} 
              colorScheme="gold" 
              subtitle="Awaiting Approval" 
            />
            <StatCard 
              title="Approved Requests" 
              value={approvedRequests} 
              icon={icons.approved} 
              colorScheme="accent" 
              subtitle="In Progress" 
            />
            <StatCard 
              title="Rejected Requests" 
              value={prs.filter((pr) => pr.status === "Rejected").length} 
              icon={icons.document} 
              colorScheme="red" 
              subtitle="Declined" 
            />
          </div>

          {/* Recent Requests */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-secondary">My Recent Requests</h3>
              <Link href="/department-head/purchase-requests" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                View All PRs →
              </Link>
            </div>

            {prs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-slate-500 font-medium">No purchase requests found.</p>
                <Link href="/department-head/purchase-requests" className="text-sm text-primary font-semibold hover:underline mt-2">
                  Go to My Requests to create one
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {prs.slice(0, 5).map((pr) => (
                  <li key={pr.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-secondary">{pr.prNumber}</p>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">{pr.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{pr.dateRequested}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-bold text-secondary">₱{pr.amount.toLocaleString()}</p>
                        <StatusBadge status={pr.status} />
                      </div>
                      <Link
                        href={`/department-head/purchase-requests`}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="View details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
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
