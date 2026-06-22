// Reusable Status Badge
interface StatusBadgeProps {
  status: string;
  variant?: "pr" | "user" | "workflow" | "decision";
}

const colorMap: Record<string, string> = {
  // PR statuses - New 8-status workflow
  draft: "bg-slate-100 text-slate-800 border border-slate-200",
  submitted: "bg-amber-100 text-amber-800 border border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  rejected: "bg-red-100 text-red-800 border border-red-200",
  ordered: "bg-blue-100 text-blue-800 border border-blue-200",
  received: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  released: "bg-purple-100 text-purple-800 border border-purple-200",
  completed: "bg-green-100 text-green-800 border border-green-200",
  // User statuses
  active: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  inactive: "bg-slate-100 text-slate-600 border border-slate-200",
  suspended: "bg-red-100 text-red-800 border border-red-200",
  // Roles
  admin: "bg-purple-100 text-purple-800 border border-purple-200",
  department_head: "bg-teal-100 text-teal-800 border border-teal-200",
  // Workflow
  returned: "bg-orange-100 text-orange-800 border border-orange-200",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const classes = colorMap[status.toLowerCase()] ?? "bg-gray-100 text-gray-600 border border-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${classes}`}>
      {status}
    </span>
  );
}
