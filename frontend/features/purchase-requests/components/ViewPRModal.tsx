"use client";

import { useState, useEffect } from "react";
import { printPurchaseRequest } from "@/lib/print";
import { downloadPRAttachment, uploadPRAttachments, deletePRAttachment, Attachment } from "@/services/purchase-requests.service";

interface PRData {
  id: string;
  prNumber: string;
  department: string;
  amount: number;
  status: "Draft" | "Submitted" | "Approved" | "Rejected" | "Ordered" | "Received" | "Released" | "Completed";
  requestedBy: string;
  dateRequested: string;
  dueDate: string;
  description?: string;
  notes?: string;
  lineItems?: any[];
  statusHistory?: any[];
  attachments?: Attachment[];
}

interface ViewPRModalProps {
  isOpen: boolean;
  pr: PRData | null;
  onClose: () => void;
  onApprove?: (id: string, comments: string) => void;
  onReject?: (id: string, comments: string) => void;
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
  const [localAttachments, setLocalAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (pr?.attachments) {
      setLocalAttachments(pr.attachments);
    }
  }, [pr]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !pr) return;
    setUploading(true);
    try {
      const updatedPR = await uploadPRAttachments(pr.id, Array.from(e.target.files));
      if (updatedPR.attachments) {
        setLocalAttachments(updatedPR.attachments);
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload attachments");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteAttachment = async (attId: number) => {
    if (!confirm("Are you sure you want to delete this attachment?") || !pr) return;
    try {
      const updatedPR = await deletePRAttachment(pr.id, attId);
      if (updatedPR && updatedPR.attachments) {
        setLocalAttachments(updatedPR.attachments);
      } else {
        setLocalAttachments(localAttachments.filter(att => att.id !== attId));
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete attachment");
    }
  };


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

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Supporting Attachments ({localAttachments.length})
              </p>
              <label className="cursor-pointer bg-primary/10 text-primary hover:bg-primary hover:text-white px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1">
                {uploading ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add File</span>
                  </>
                )}
                <input
                  type="file"
                  multiple
                  disabled={uploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {localAttachments.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-2">No attachments uploaded for this request.</p>
              ) : (
                localAttachments.map((att: Attachment) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-xs shadow-sm"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <div className="truncate">
                        <p className="font-medium text-secondary truncate">{att.file_name}</p>
                        <p className="text-[10px] text-slate-400">
                          {(att.file_size / 1024).toFixed(1)} KB • Uploaded by {att.uploader ? `${att.uploader.first_name} ${att.uploader.last_name}` : "User"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => downloadPRAttachment(pr.id, att.id, att.file_name)}
                        className="px-2 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="p-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded text-xs transition-colors"
                        title="Delete attachment"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-3">
            {(pr.status === "Submitted" || pr.status === "pending" || pr.status as string === "Draft") && onApprove && (
              <button
                onClick={() => {
                  const remarks = prompt("Enter approval remarks (optional):", "Approved");
                  if (remarks !== null) onApprove(pr.id, remarks);
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
              >
                Approve PR
              </button>
            )}
            {(pr.status === "Submitted" || pr.status === "pending" || pr.status as string === "Draft") && onReject && (
              <button
                onClick={() => {
                  const reason = prompt("Enter rejection reason:", "");
                  if (reason !== null) onReject(pr.id, reason);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5"
              >
                Reject PR
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
