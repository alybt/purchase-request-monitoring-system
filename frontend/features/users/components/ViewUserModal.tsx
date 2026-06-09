"use client";

interface UserData {
  id: string;
  name: string;
  email: string;
  department: string;
  role: "admin" | "approver" | "requester";
  status: "active" | "inactive";
  joinDate: string;
}

interface ViewUserModalProps {
  isOpen: boolean;
  user: UserData | null;
  onClose: () => void;
}

const getRoleColor = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-purple-100 text-purple-800";
    case "approver":
      return "bg-blue-100 text-blue-800";
    case "requester":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function ViewUserModal({
  isOpen,
  user,
  onClose,
}: ViewUserModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-secondary">User Details</h2>
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
        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Full Name
            </p>
            <p className="text-sm font-medium text-secondary">{user.name}</p>
          </div>

          {/* Email */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Email Address
            </p>
            <p className="text-sm font-medium text-secondary">{user.email}</p>
          </div>

          {/* Department */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Department
            </p>
            <p className="text-sm font-medium text-secondary">
              {user.department}
            </p>
          </div>

          {/* Role */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Role
            </p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getRoleColor(user.role)}`}
            >
              {user.role}
            </span>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Status
            </p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(user.status)}`}
            >
              {user.status}
            </span>
          </div>

          {/* Join Date */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Join Date
            </p>
            <p className="text-sm font-medium text-secondary">
              {user.joinDate}
            </p>
          </div>

          {/* Close Button */}
          <div className="pt-4">
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
