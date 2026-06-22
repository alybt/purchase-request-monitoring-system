"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import SearchFilters from "@/components/ui/SearchFilters";
import EmptyState from "@/components/ui/EmptyState";
import { getPurchaseRequests } from "@/services/purchase-requests.service";
import type { PRData } from "@/services/purchase-requests.service";

export default function DepartmentHeadPRListPage() {
  const [prs, setPrs] = useState<PRData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchPRs();
  }, [search, statusFilter]);

  const fetchPRs = async () => {
    setLoading(true);
    try {
      const data = await getPurchaseRequests(search, "", statusFilter);
      setPrs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="My Purchase Requests"
        subtitle={`${prs.length} total requests`}
        breadcrumbs={[{ label: "Department Head" }, { label: "My Purchase Requests" }]}
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <SearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          placeholder="Search by PR number, purpose..."
          filters={[
            {
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: "Draft", value: "Draft" },
                { label: "Submitted", value: "Submitted" },
                { label: "Approved", value: "Approved" },
                { label: "Rejected", value: "Rejected" },
                { label: "Ordered", value: "Ordered" },
                { label: "Received", value: "Received" },
                { label: "Released", value: "Released" },
                { label: "Completed", value: "Completed" },
              ],
            },
          ]}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-secondary/50">Loading requests...</div>
        ) : prs.length === 0 ? (
          <EmptyState
            title="No requests found"
            description="Try adjusting your search or submit a new purchase request."
            action={
              <Link
                href="/department-head/purchase-requests/create"
                className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90"
              >
                Create Request
              </Link>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                <th className="px-6 py-3 text-left">PR Number</th>
                <th className="px-6 py-3 text-left">Purpose</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prs.map((pr) => (
                <tr key={pr.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-primary">{pr.prNumber}</td>
                  <td className="px-6 py-4 text-secondary/80 max-w-[200px] truncate">{pr.description}</td>
                  <td className="px-6 py-4 text-secondary/70">{pr.category || "N/A"}</td>
                  <td className="px-6 py-4 font-semibold text-secondary">₱{pr.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={pr.status} />
                  </td>
                  <td className="px-6 py-4 text-secondary/50 text-xs">{pr.dateRequested}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/department-head/purchase-requests/${pr.id}`}
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      View Details →
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
