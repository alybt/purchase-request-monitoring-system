"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import SearchFilters from "@/components/ui/SearchFilters";
import EmptyState from "@/components/ui/EmptyState";
import { getPurchaseRequests } from "@/services/purchase-requests.service";
import type { PRData } from "@/services/purchase-requests.service";

interface HistoryItem {
  id: string;
  prNumber: string;
  requestor: string;
  department: string;
  amount: number;
  decision: string;
  date: string;
  remarks: string;
}

export default function ApproverHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []); // Only fetch once, filter on frontend since we fetch all

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Fetch all PRs
      const data = await getPurchaseRequests("", "", "");
      
      // Filter out pending PRs to get history
      const historyData = data
        .filter((pr) => pr.status !== "pending")
        .map((pr) => {
          // Find the most recent approval/rejection for remarks and date
          const latestApproval = pr.approvals && pr.approvals.length > 0 
            ? pr.approvals[pr.approvals.length - 1] 
            : null;
            
          let decision = pr.status;
          if (latestApproval?.status === "Reject") decision = "rejected";
          else if (latestApproval?.status === "Approve") decision = "approved";

          return {
            id: pr.id,
            prNumber: pr.prNumber,
            requestor: pr.requestedBy,
            department: pr.department,
            amount: pr.amount,
            decision: decision,
            date: latestApproval?.action_date ? latestApproval.action_date.split("T")[0] : pr.dateRequested,
            remarks: latestApproval?.comments || "",
          };
        });
        
      setHistory(historyData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = history.filter((item) => {
    const matchSearch =
      !search ||
      item.prNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.requestor.toLowerCase().includes(search.toLowerCase());
    const matchDecision = !decisionFilter || item.decision === decisionFilter;
    return matchSearch && matchDecision;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Approval History"
        subtitle={`${history.length} total decisions made`}
        breadcrumbs={[{ label: "Approver" }, { label: "Approval History" }]}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <SearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          placeholder="Search by PR number or requestor..."
          filters={[
            {
              label: "Decision",
              value: decisionFilter,
              onChange: setDecisionFilter,
              options: [
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
                { label: "Completed", value: "completed" },
              ],
            },
          ]}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-secondary/50">Loading approval history...</div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No history found" description="No approval history matches your filters." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                <th className="px-6 py-3 text-left">PR Number</th>
                <th className="px-6 py-3 text-left">Requestor</th>
                <th className="px-6 py-3 text-left">Department</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Decision</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-primary">{item.prNumber}</td>
                  <td className="px-6 py-4 font-medium text-secondary">{item.requestor}</td>
                  <td className="px-6 py-4 text-secondary/70">{item.department}</td>
                  <td className="px-6 py-4 font-semibold text-secondary">₱{item.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.decision} />
                  </td>
                  <td className="px-6 py-4 text-secondary/50 text-xs">{item.date}</td>
                  <td className="px-6 py-4 text-secondary/70 max-w-xs truncate text-xs italic">
                    {item.remarks || "—"}
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
