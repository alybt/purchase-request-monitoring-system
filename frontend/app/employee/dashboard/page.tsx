"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { getPurchaseRequests } from "@/services/purchase-requests.service";
import type { PRData } from "@/services/purchase-requests.service";

const icons = {
  submitted: (
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
};

export default function EmployeeDashboardPage() {
  const [prs, setPrs] = useState<PRData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPurchaseRequests()
      .then(setPrs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const submittedRequests = prs.length;
  const pendingRequests = prs.filter((pr) => pr.status === "pending").length;
  const approvedRequests = prs.filter((pr) => pr.status === "approved" || pr.status === "completed").length;
  const rejectedRequests = prs.filter((pr) => pr.status === "rejected").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="My Dashboard"
        subtitle="Track your purchase requests and their progress"
        breadcrumbs={[{ label: "Employee" }, { label: "Dashboard" }]}
        actions={
          <Link
            href="/employee/purchase-requests/create"
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
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Submitted" value={submittedRequests} icon={icons.submitted} colorScheme="primary" subtitle="Total PRs created" />
            <StatCard title="Pending" value={pendingRequests} icon={icons.pending} colorScheme="gold" subtitle="Awaiting approval" />
            <StatCard title="Approved" value={approvedRequests} icon={icons.approved} colorScheme="accent" subtitle="Requests approved" />
            <StatCard title="Rejected" value={rejectedRequests} icon={icons.rejected} colorScheme="red" subtitle="Declined requests" />
          </div>

          {/* Recent Requests */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-secondary">My Recent Requests</h3>
              <Link href="/employee/purchase-requests" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                View All →
              </Link>
            </div>

            {prs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <svg className="w-12 h-12 text-secondary/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-secondary/50 font-medium">You haven't submitted any requests yet.</p>
                <Link href="/employee/purchase-requests/create" className="text-sm text-primary font-semibold hover:underline">
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
                        href={`/employee/purchase-requests/${pr.id}`}
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
