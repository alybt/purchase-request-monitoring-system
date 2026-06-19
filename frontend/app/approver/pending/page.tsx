"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import SearchFilters from "@/components/ui/SearchFilters";
import { getPurchaseRequests } from "@/services/purchase-requests.service";
import type { PRData } from "@/services/purchase-requests.service";

export default function ApproverPendingPage() {
  const [prs, setPrs] = useState<PRData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  useEffect(() => {
    fetchPendingPRs();
  }, [search, deptFilter]);

  const fetchPendingPRs = async () => {
    setLoading(true);
    try {
      const data = await getPurchaseRequests(search, deptFilter, "pending");
      setPrs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Pending Approvals"
        subtitle={`${prs.length} requests awaiting your decision`}
        breadcrumbs={[{ label: "Approver" }, { label: "Pending Approvals" }]}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <SearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          placeholder="Search by PR number, requestor or department..."
          filters={[
            {
              label: "Department",
              value: deptFilter,
              onChange: setDeptFilter,
              options: ["IT", "HR", "Finance", "Operations", "Marketing"].map((d) => ({ label: d, value: d })),
            },
          ]}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-secondary/50">Loading pending approvals...</div>
        ) : prs.length === 0 ? (
          <EmptyState
            title="No pending approvals"
            description="You're all caught up! No requests need your attention right now."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                <th className="px-6 py-3 text-left">PR Number</th>
                <th className="px-6 py-3 text-left">Requestor</th>
                <th className="px-6 py-3 text-left">Department</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Date Submitted</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prs.map((pr) => (
                <tr key={pr.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-primary">{pr.prNumber}</td>
                  <td className="px-6 py-4 font-medium text-secondary">{pr.requestedBy}</td>
                  <td className="px-6 py-4 text-secondary/70">{pr.department}</td>
                  <td className="px-6 py-4 font-semibold text-secondary">₱{pr.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-secondary/50 text-xs">{pr.dateRequested}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={pr.status} />
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/approver/pending/${pr.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
