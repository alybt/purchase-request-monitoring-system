import React, { useState, useEffect } from "react";

export type StatusAction =
  | "Approved"
  | "Rejected"
  | "Received"
  | "Released"
  | "Completed"
  | "Draft";

interface StatusConfirmationModalProps {
  isOpen: boolean;
  action: StatusAction;
  onClose: () => void;
  onConfirm: (remarks: string) => Promise<void>;
}

export default function StatusConfirmationModal({
  isOpen,
  action,
  onClose,
  onConfirm,
}: StatusConfirmationModalProps) {
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRemarks("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onConfirm(remarks);
      onClose();
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  const actionConfig: Record<string, any> = {
    Approved: {
      color: "emerald", // Green
      bgIcon: "bg-emerald-100",
      textIcon: "text-emerald-600",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
      borderAccent: "border-t-4 border-t-emerald-500",
      title: "Approve Purchase Request",
      description:
        "You are about to approve this Purchase Request. Once approved, it can proceed to procurement.",
      remarksLabel: "Remarks",
      remarksHelper: "Remarks are optional.",
      placeholder: "Approval remarks (optional)",
      btnText: "Approve Request",
      icon: (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    Rejected: {
      color: "red", // Red
      bgIcon: "bg-red-100",
      textIcon: "text-red-600",
      btnClass: "bg-red-600 hover:bg-red-700 text-white",
      borderAccent: "border-t-4 border-t-red-500",
      title: "Reject Purchase Request",
      description:
        "Rejecting this Purchase Request will stop the approval process. The Department Head will be notified.",
      remarksLabel: "Remarks",
      remarksHelper:
        "Providing a reason helps the requesting department understand the decision.",
      placeholder: "Reason for rejection (optional)",
      btnText: "Reject Request",
      icon: (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    Received: {
      color: "purple", // Purple
      bgIcon: "bg-purple-100",
      textIcon: "text-purple-600",
      btnClass: "bg-purple-600 hover:bg-purple-700 text-white",
      borderAccent: "border-t-4 border-t-purple-500",
      title: "Mark Items as Received",
      description:
        "Confirm that all ordered items have been received from the supplier.",
      remarksLabel: "Remarks",
      remarksHelper: "Remarks are optional.",
      placeholder: "Receiving remarks (optional)",
      btnText: "Mark as Received",
      icon: (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
    Released: {
      color: "orange", // Orange
      bgIcon: "bg-orange-100",
      textIcon: "text-orange-600",
      btnClass: "bg-orange-600 hover:bg-orange-700 text-white",
      borderAccent: "border-t-4 border-t-orange-500",
      title: "Release Items",
      description:
        "Confirm that the received items have been released to the requesting department.",
      remarksLabel: "Remarks",
      remarksHelper: "Remarks are optional.",
      placeholder: "Release remarks (optional)",
      btnText: "Release Items",
      icon: (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
          />
        </svg>
      ),
    },
    Completed: {
      color: "teal", // Teal
      bgIcon: "bg-teal-100",
      textIcon: "text-teal-600",
      btnClass: "bg-teal-600 hover:bg-teal-700 text-white",
      borderAccent: "border-t-4 border-t-teal-500",
      title: "Confirm Receipt",
      description:
        "Confirm that your department has successfully received the released items. This will complete the Purchase Request.",
      remarksLabel: "Remarks",
      remarksHelper: "Remarks are optional.",
      placeholder: "Confirmation remarks (optional)",
      btnText: "Confirm Receipt",
      icon: (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
  };

  const config = actionConfig[action];

  if (!config) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal */}
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative transform transition-all scale-100 opacity-100 ${config.borderAccent}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <form onSubmit={handleSubmit}>
          <div className="p-8 pb-6 flex flex-col items-center text-center">
            {/* Icon */}
            <div
              className={`p-4 rounded-full ${config.bgIcon} ${config.textIcon} mb-5 shadow-sm`}
            >
              {config.icon}
            </div>

            {/* Header */}
            <h3
              id="modal-title"
              className="text-xl font-extrabold text-secondary mb-2"
            >
              {config.title}
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              {config.description}
            </p>
          </div>

          <div className="px-8 pb-8 space-y-2">
            <label className="block text-sm font-semibold text-secondary">
              {config.remarksLabel}{" "}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={config.placeholder}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-secondary placeholder-slate-400 resize-none transition-colors"
              disabled={isSubmitting}
              autoFocus
            />
            <p className="text-xs text-slate-400 pl-1">
              {config.remarksHelper}
            </p>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex gap-3 flex-col sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 transition-colors w-full sm:w-auto disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed ${config.btnClass}`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                config.btnText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
