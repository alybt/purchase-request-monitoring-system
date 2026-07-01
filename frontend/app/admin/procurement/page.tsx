"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

export default function ProcurementTrackingPage() {
  const [purchaseRequests] = useState([
    { id: 1, prNumber: "PR-2026-001", department: "Information Technology", category: "IT Equipment", amount: 450000, status: "Approved", requestedBy: "Juan Reyes", date: "2026-06-20" },
    { id: 2, prNumber: "PR-2026-002", department: "Information Technology", category: "IT Equipment", amount: 300000, status: "Pending", requestedBy: "Juan Reyes", date: "2026-06-21" },
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
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-secondary">Purchase Requests</h3>
            <div className="relative group cursor-help">
              <svg className="w-4 h-4 text-secondary/40 hover:text-secondary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute left-6 top-0 hidden group-hover:block w-80 p-4 bg-slate-800 text-white rounded-xl shadow-xl z-50 pointer-events-none">
                <p className="font-bold text-white mb-2 text-sm">Procurement Status Flow</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800">Draft</span>
                  <span className="text-slate-400 text-xs">→</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">Pending</span>
                  <span className="text-slate-400 text-xs">→</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">Approved</span>
                  <span className="text-slate-400 text-xs">→</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">Ordered</span>
                  <span className="text-slate-400 text-xs">→</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">Received</span>
                  <span className="text-slate-400 text-xs">→</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">Released</span>
                  <span className="text-slate-400 text-xs">→</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">Completed</span>
                </div>
                <div className="mt-3 text-xs text-slate-300">
                  <p className="font-semibold text-white">Rejection Path:</p>
                  <p className="mt-1">Pending <span className="text-slate-400 mx-1">→</span> Rejected</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
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

      {/* Status Update Modal */}
      {selectedPR && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 shrink-0">
              <h2 className="text-lg font-bold text-secondary">Update PR Status</h2>
              <button
                onClick={() => setSelectedPR(null)}
                className="text-slate-400 hover:text-secondary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-secondary/60 font-semibold uppercase tracking-wider mb-1">Selected PR</p>
                  <p className="font-bold text-primary text-lg">{purchaseRequests.find(pr => pr.id === selectedPR)?.prNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary/60 font-semibold uppercase tracking-wider mb-1">Current Status</p>
                  <div>
                    <StatusBadge status={purchaseRequests.find(pr => pr.id === selectedPR)?.status || ""} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-semibold text-secondary">Update Status To:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleStatusUpdate(selectedPR, "Ordered")}
                    className="px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-sm font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all text-center"
                  >
                    Ordered
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedPR, "Received")}
                    className="px-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800 text-sm font-semibold hover:bg-indigo-100 hover:border-indigo-300 transition-all text-center"
                  >
                    Received
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedPR, "Released")}
                    className="px-4 py-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-800 text-sm font-semibold hover:bg-purple-100 hover:border-purple-300 transition-all text-center"
                  >
                    Released
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedPR, "Completed")}
                    className="px-4 py-3 rounded-xl border border-green-200 bg-green-50 text-green-800 text-sm font-semibold hover:bg-green-100 hover:border-green-300 transition-all text-center"
                  >
                    Completed
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">Remarks (Optional)</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                  rows={4}
                  placeholder="Add remarks for this status update"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl shrink-0">
              <button
                onClick={() => setSelectedPR(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-secondary border border-slate-200 hover:bg-white transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleStatusUpdate(selectedPR, "Ordered");
                  setSelectedPR(null);
                }}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-sm"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
