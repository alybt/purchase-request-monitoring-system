"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import ActivityFeed from "@/components/ui/ActivityFeed";
import { getPurchaseRequests } from "@/services/purchase-requests.service";
import type { PRData } from "@/services/purchase-requests.service";

const icons = {
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

export default function ApproverDashboardPage() {
  const [prs, setPrs] = useState<PRData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPurchaseRequests()
      .then(setPrs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pendingPRs = prs.filter((p) => p.status === "pending");
  const pendingApprovals = pendingPRs.length;

  const todayStr = new Date().toISOString().split("T")[0];
  const historyPRs = prs.filter((pr) => pr.status !== "pending");

  let approvedToday = 0;
  let rejectedToday = 0;

  const recentActivity = historyPRs
    .map((pr) => {
      const latestApproval = pr.approvals && pr.approvals.length > 0 
        ? pr.approvals[pr.approvals.length - 1] 
        : null;
        
      let decision = pr.status;
      if (latestApproval?.status === "Reject") decision = "rejected";
      else if (latestApproval?.status === "Approve") decision = "approved";

      const actionDate = latestApproval?.action_date?.split("T")[0] || pr.dateRequested;

      if (actionDate === todayStr) {
        if (decision === "approved" || decision === "completed") approvedToday++;
        if (decision === "rejected") rejectedToday++;
      }

      return {
        id: pr.id,
        title: pr.prNumber,
        subtitle: `${pr.requestedBy} · ${pr.department}`,
        timestamp: actionDate,
        badge: decision,
        badgeColor:
          decision === "approved" || decision === "completed"
            ? "bg-emerald-100 text-emerald-700"
            : decision === "rejected"
            ? "bg-red-100 text-red-700"
            : "bg-orange-100 text-orange-700",
      };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Approver Dashboard"
        subtitle="Your pending approvals and recent decisions"
        breadcrumbs={[{ label: "Approver" }, { label: "Dashboard" }]}
      />

      {loading ? (
        <div className="p-8 text-center text-secondary/50">Loading dashboard...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Pending Approvals" value={pendingApprovals} icon={icons.pending} colorScheme="gold" subtitle="Awaiting your decision" />
            <StatCard title="Approved Today" value={approvedToday} icon={icons.approved} colorScheme="primary" subtitle="Decisions made today" />
            <StatCard title="Rejected Today" value={rejectedToday} icon={icons.rejected} colorScheme="red" subtitle="Declined today" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Queue */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-secondary">Pending Approvals Queue</h3>
                <Link href="/approver/pending" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                  View All →
                </Link>
              </div>
              {pendingPRs.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-sm text-secondary/50 font-medium">No pending approvals. 🎉</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {pendingPRs.slice(0, 5).map((pr) => (
                    <li key={pr.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-primary">{pr.prNumber}</p>
                        <p className="text-xs text-secondary/70 mt-0.5">{pr.requestedBy} · {pr.department}</p>
                        <p className="text-xs text-secondary/50 mt-0.5 max-w-xs truncate">{pr.description}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-secondary">₱{pr.amount.toLocaleString()}</p>
                          <p className="text-xs text-secondary/50">{pr.dateRequested}</p>
                        </div>
                        <Link
                          href={`/approver/pending/${pr.id}`}
                          className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Review
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Activity Feed */}
            <ActivityFeed items={recentActivity} title="Recent Decisions" />
          </div>
        </>
      )}
    </div>
  );
}
