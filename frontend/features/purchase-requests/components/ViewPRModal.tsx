"use client";

import { useState, useEffect } from "react";

interface PRData {
  id: string;
  prNumber: string;
  department: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  requestedBy: string;
  dateRequested: string;
  dueDate: string;
  description?: string;
  notes?: string;
  lineItems?: any[];
  approvals?: any[];
}

interface ViewPRModalProps {
  isOpen: boolean;
  pr: PRData | null;
  onClose: () => void;
  onApprove?: (id: string, comments: string) => Promise<void>;
  onReject?: (id: string, comments: string) => Promise<void>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function ViewPRModal({
  isOpen,
  pr,
  onClose,
  onApprove,
  onReject,
}: ViewPRModalProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen || !pr) return null;

  const isApproverOrAdmin =
    currentUser?.role === "admin" || currentUser?.role === "approver";
  const isPending = pr.status === "pending";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-secondary">
            Purchase Request Details
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-secondary transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* PR Number and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                PR Number
              </p>
              <p className="text-sm font-bold text-primary">{pr.prNumber}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Status
              </p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(pr.status)}`}
              >
                {pr.status}
              </span>
            </div>
          </div>

          {/* Department and Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Department
              </p>
              <p className="text-sm font-medium text-secondary">
                {pr.department}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Amount
              </p>
              <p className="text-sm font-bold text-secondary">
                ₱{pr.amount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Description */}
          {pr.description && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Description
              </p>
              <p className="text-sm text-secondary/70 bg-slate-50 p-3 rounded-lg">
                {pr.description}
              </p>
            </div>
          )}

          {/* Requested By and Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Requested By
              </p>
              <p className="text-sm font-medium text-secondary">
                {pr.requestedBy}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Date Requested
              </p>
              <p className="text-sm font-medium text-secondary">
                {pr.dateRequested}
              </p>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Due Date
            </p>
            <p className="text-sm font-medium text-secondary">{pr.dueDate}</p>
          </div>

          {/* Line Items Detail */}
          {pr.lineItems && pr.lineItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Line Items
              </p>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <th className="px-4 py-2">Item Name</th>
                      <th className="px-4 py-2">Qty</th>
                      <th className="px-4 py-2">Unit Price</th>
                      <th className="px-4 py-2">Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pr.lineItems.map((item: any) => (
                      <tr key={item.id} className="border-b border-slate-200 text-secondary last:border-b-0">
                        <td className="px-4 py-2 font-medium">{item.item_name}</td>
                        <td className="px-4 py-2">{item.quantity}</td>
                        <td className="px-4 py-2">₱{parseFloat(item.unit_price).toLocaleString()}</td>
                        <td className="px-4 py-2 font-semibold">₱{parseFloat(item.total_price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Approval Logs History */}
          {pr.approvals && pr.approvals.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Approval History
              </p>
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {pr.approvals.map((app: any) => (
                  <div key={app.id} className="text-xs text-secondary border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-800">
                        {app.approver?.first_name} {app.approver?.last_name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                        app.status === "Approve" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {app.status === "Approve" ? "Approved" : "Rejected"}
                      </span>
                    </div>
                    {app.comments && (
                      <p className="text-slate-600 italic">"{app.comments}"</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(app.action_date).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval Form Panel (only for approvers/admins & when pending) */}
          {isApproverOrAdmin && isPending && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <p className="text-xs font-bold text-secondary uppercase tracking-wide">
                Approval Action Panel
              </p>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Enter approval or rejection comments (optional)..."
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none bg-white text-secondary"
              />
              <div className="flex gap-3">
                <button
                  disabled={submitting}
                  onClick={async () => {
                    if (onReject && pr) {
                      setSubmitting(true);
                      await onReject(pr.id, comments);
                      setComments("");
                      setSubmitting(false);
                    }
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Reject PR"}
                </button>
                <button
                  disabled={submitting}
                  onClick={async () => {
                    if (onApprove && pr) {
                      setSubmitting(true);
                      await onApprove(pr.id, comments);
                      setComments("");
                      setSubmitting(false);
                    }
                  }}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Approve PR"}
                </button>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="w-full bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
