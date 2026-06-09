"use client";

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
}

interface ViewPRModalProps {
  isOpen: boolean;
  pr: PRData | null;
  onClose: () => void;
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

export default function ViewPRModal({ isOpen, pr, onClose }: ViewPRModalProps) {
  if (!isOpen || !pr) return null;

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

          {/* Notes */}
          {pr.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Notes
              </p>
              <p className="text-sm text-secondary/70 bg-slate-50 p-3 rounded-lg">
                {pr.notes}
              </p>
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
