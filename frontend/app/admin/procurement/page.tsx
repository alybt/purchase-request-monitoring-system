"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

export default function ProcurementTrackingPage() {
  const [purchaseRequests] = useState([
    { id: 1, prNumber: "PR-2026-001", department: "Information Technology", category: "IT Equipment", amount: 450000, status: "Approved", requestedBy: "Juan Reyes", date: "2026-06-20" },
    { id: 2, prNumber: "PR-2026-002", department: "Information Technology", category: "IT Equipment", amount: 300000, status: "Submitted", requestedBy: "Juan Reyes", date: "2026-06-21" },
    { id: 3, prNumber: "PR-2026-003", department: "Information Technology", category: "IT Equipment", amount: 500000, status: "Rejected", requestedBy: "Juan Reyes", date: "2026-06-15" },
    { id: 4, prNumber: "PR-2026-004", department: "Information Technology", category: "IT Equipment", amount: 150000, status: "Ordered", requestedBy: "Juan Reyes", date: "2026-06-10" },
  ]);

  const [selectedPR, setSelectedPR] = useState<number | null>(null);

  const handleStatusUpdate = (prId: number, newStatus: string) => {
    // TODO: Call API to update status
    console.log(`Updating PR ${prId} to ${newStatus}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Procurement Tracking"
        subtitle="Track and manage purchase request procurement status"
        breadcrumbs={[{ label: "Admin" }, { label: "Procurement Tracking" }]}
      />

      {/* PR List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-secondary">Purchase Requests</h3>
          <div className="flex gap-2">
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Ordered">Ordered</option>
              <option value="Received">Received</option>
              <option value="Released">Released</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                <th className="px-6 py-3 text-left">PR Number</th>
                <th className="px-6 py-3 text-left">Department</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Requested By</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseRequests.map((pr) => (
                <tr key={pr.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-bold text-primary">{pr.prNumber}</td>
                  <td className="px-6 py-3 text-secondary">{pr.department}</td>
                  <td className="px-6 py-3 text-secondary/70">{pr.category}</td>
                  <td className="px-6 py-3 font-semibold text-secondary">₱{pr.amount.toLocaleString()}</td>
                  <td className="px-6 py-3 text-secondary/70">{pr.requestedBy}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={pr.status} />
                  </td>
                  <td className="px-6 py-3 text-secondary/50 text-xs">{pr.date}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => setSelectedPR(pr.id)}
                      className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Panel */}
      {selectedPR && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-secondary">Update PR Status</h3>
            <button
              onClick={() => setSelectedPR(null)}
              className="text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors"
            >
              Close
            </button>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-secondary/60">Selected PR: <span className="font-semibold text-secondary">{purchaseRequests.find(pr => pr.id === selectedPR)?.prNumber}</span></p>
              <p className="text-sm text-secondary/60">Current Status: <StatusBadge status={purchaseRequests.find(pr => pr.id === selectedPR)?.status || ""} /></p>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm font-semibold text-secondary">Update Status To:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => handleStatusUpdate(selectedPR, "Ordered")}
                  className="px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-sm font-semibold hover:bg-blue-100 transition-colors"
                >
                  Ordered
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedPR, "Received")}
                  className="px-4 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-800 text-sm font-semibold hover:bg-indigo-100 transition-colors"
                >
                  Received
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedPR, "Released")}
                  className="px-4 py-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-800 text-sm font-semibold hover:bg-purple-100 transition-colors"
                >
                  Released
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedPR, "Completed")}
                  className="px-4 py-2 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm font-semibold hover:bg-green-100 transition-colors"
                >
                  Completed
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-secondary mb-2">Remarks (Optional)</label>
              <textarea
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                rows={3}
                placeholder="Add remarks for this status update"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setSelectedPR(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-secondary hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleStatusUpdate(selectedPR, "Ordered");
                  setSelectedPR(null);
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Flow Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-secondary mb-4">Procurement Status Flow</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">Draft</span>
          <span className="text-secondary/40">→</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Submitted</span>
          <span className="text-secondary/40">→</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Approved</span>
          <span className="text-secondary/40">→</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Ordered</span>
          <span className="text-secondary/40">→</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">Received</span>
          <span className="text-secondary/40">→</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Released</span>
          <span className="text-secondary/40">→</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Completed</span>
        </div>
        <div className="mt-4 text-sm text-secondary/60">
          <p className="font-semibold text-secondary">Rejection Path:</p>
          <p>Submitted → Rejected</p>
        </div>
      </div>
    </div>
  );
}
