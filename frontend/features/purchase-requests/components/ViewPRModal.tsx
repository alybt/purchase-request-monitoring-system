"use client";

import { useState, useEffect } from "react";
import { printPurchaseRequest } from "@/lib/print";

import type { PRData } from "@/services/purchase-requests.service";

interface ViewPRModalProps {
  isOpen: boolean;
  pr: PRData | null;
  onClose: () => void;
  onApprove?: (id: string, comments: string) => Promise<void> | void;
  onReject?: (id: string, comments: string) => Promise<void> | void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Draft":
      return "bg-slate-100 text-slate-800";
    case "Submitted":
      return "bg-yellow-100 text-yellow-800";
    case "Approved":
      return "bg-green-100 text-green-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    case "Ordered":
      return "bg-blue-100 text-blue-800";
    case "Received":
      return "bg-indigo-100 text-indigo-800";
    case "Released":
      return "bg-purple-100 text-purple-800";
    case "Completed":
      return "bg-emerald-100 text-emerald-800";
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

  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 shrink-0 sticky top-0 bg-white">
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
                      <tr
                        key={item.id}
                        className="border-b border-slate-200 text-secondary last:border-b-0"
                      >
                        <td className="px-4 py-2 font-medium">
                          {item.item_name}
                        </td>
                        <td className="px-4 py-2">{item.quantity}</td>
                        <td className="px-4 py-2">
                          ₱{parseFloat(item.unit_price).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 font-semibold">
                          ₱{parseFloat(item.total_price).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Status History */}
          {pr.statusHistory && pr.statusHistory.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Status History
              </p>
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {pr.statusHistory.map((history: any) => (
                  <div
                    key={history.id}
                    className="text-xs text-secondary border-b border-slate-200 pb-2 last:border-b-0 last:pb-0"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-800">
                        {history.user ? `${history.user.first_name} ${history.user.last_name}` : "System"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${getStatusColor(history.status)}`}
                      >
                        {history.status}
                      </span>
                    </div>
                    {history.remarks && (
                      <p className="text-slate-600 italic">"{history.remarks}"</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(history.changed_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Close, Approve, Reject & Print Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-3">
            {onApprove && pr.status?.toLowerCase() === "submitted" && (
              <button
                onClick={() => onApprove(pr.id, "Approved via View Modal")}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
            )}
            {onReject && pr.status?.toLowerCase() === "submitted" && (
              <button
                onClick={() => onReject(pr.id, "Rejected via View Modal")}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            )}
            <button
              onClick={() => printPurchaseRequest(pr)}
              className="flex-1 bg-slate-100 text-secondary border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4H7v4a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Print / Sign Voucher
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
