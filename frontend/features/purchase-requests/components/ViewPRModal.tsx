"use client";

import { useState, useEffect } from "react";
import { printPurchaseRequest } from "@/lib/print";
import { downloadPRAttachment, uploadPRAttachments, deletePRAttachment, Attachment, PRData } from "@/services/purchase-requests.service";

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
    case "Pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
                Current Status
              </p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(pr.status)}`}
              >
                {pr.status}
              </span>
            </div>
          </div>

          {/* Procurement Timeline */}
          {pr.status !== "Rejected" && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Procurement Timeline
              </p>
              <div className="flex items-center w-full bg-slate-50 p-4 rounded-xl border border-slate-100 overflow-x-auto scrollbar-hide">
                {["Draft", "Pending", "Approved", "Ordered", "Received", "Released", "Completed"].map((stage, idx, arr) => {
                  const stageIndex = arr.indexOf(stage);
                  const currentStageIndex = arr.indexOf(pr.status);
                  
                  let isCompleted = stageIndex < currentStageIndex;
                  let isCurrent = stageIndex === currentStageIndex;
                  
                  if (pr.status === "Completed") {
                    isCompleted = stageIndex <= currentStageIndex;
                    isCurrent = stage === "Completed";
                  }

                  return (
                    <div key={stage} className="flex items-center">
                      <div className={`flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${isCurrent ? "bg-primary text-white shadow-md ring-2 ring-primary/20" : isCompleted ? "bg-primary/20 text-primary" : "bg-slate-200 text-slate-400"}`}>
                        {stage}
                      </div>
                      {idx < arr.length - 1 && (
                        <div className={`w-4 h-0.5 mx-1 rounded-full shrink-0 ${isCompleted && !isCurrent ? "bg-primary/50" : "bg-slate-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Department, Category, and Amount */}
          <div className="grid grid-cols-3 gap-4">
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
                Category
              </p>
              <p className="text-sm font-medium text-secondary">
                {pr.category || "General"}
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

          {/* Procurement Information */}
          {pr.orderedAt && (
            <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                <p className="text-xs font-bold text-secondary uppercase tracking-wider">
                  Procurement Information
                </p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Supplier Name
                  </p>
                  <p className="text-sm font-medium text-secondary">
                    {pr.supplierName || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Purchase Order No.
                  </p>
                  <p className="text-sm font-medium text-secondary">
                    {pr.purchaseOrderNumber || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Expected Delivery
                  </p>
                  <p className="text-sm font-medium text-secondary">
                    {pr.expectedDeliveryDate || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Ordered By
                  </p>
                  <p className="text-sm font-medium text-secondary">
                    {pr.orderer ? `${pr.orderer.first_name} ${pr.orderer.last_name}` : "Not specified"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Ordered On
                  </p>
                  <p className="text-sm font-medium text-secondary">
                    {new Date(pr.orderedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    Remarks
                  </p>
                  <p className="text-sm font-medium text-secondary">
                    {pr.procurementRemarks || "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          )}

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
                    <div className="flex items-center gap-3 overflow-hidden">
                      {att.file_type?.startsWith('image/') || att.file_type?.startsWith('video/') ? (
                        <div 
                          className="w-10 h-10 rounded overflow-hidden shrink-0 bg-slate-100 border border-slate-200 cursor-pointer relative group"
                          onClick={() => setPreviewImage(att.preview_url || null)}
                          title="Click to preview"
                        >
                          {att.file_type?.startsWith('image/') ? (
                            <img src={att.preview_url} alt={att.file_name} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                          ) : (
                            <video src={att.preview_url} className="w-full h-full object-cover" />
                          )}
                          {att.file_type?.startsWith('video/') && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded shrink-0 bg-primary/10 flex items-center justify-center text-primary">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </div>
                      )}
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

          {/* Activity History */}
          {pr.statusHistory && pr.statusHistory.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Activity History
              </p>
              <div className="space-y-4">
                {pr.statusHistory.map((hist: any, index: number) => (
                  <div key={hist.id || index} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                    <p className="font-bold text-primary mb-3 text-base">
                      {hist.to_status}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">By:</p>
                        <p className="text-sm font-medium text-secondary">
                          {hist.changer ? `${hist.changer.first_name} ${hist.changer.last_name}` : "System User"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Date:</p>
                        <p className="text-sm font-medium text-secondary">
                          {hist.created_at ? new Date(hist.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Remarks:</p>
                      <p className="text-sm text-secondary/80 bg-slate-50 p-2.5 rounded-lg whitespace-pre-wrap">
                        {hist.remarks || "No remarks provided."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-3">
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

      {/* Image/Video Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors p-2"
              title="Close preview"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {previewImage.endsWith('.mp4') || previewImage.endsWith('.mov') || previewImage.endsWith('.webm') ? (
              <video src={previewImage} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
            ) : (
              <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
