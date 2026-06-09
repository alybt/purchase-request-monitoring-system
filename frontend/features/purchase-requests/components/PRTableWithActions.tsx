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
}

interface PRTableWithActionsProps {
  data: PRData[];
  selectedRows: string[];
  onSelectRows: (ids: string[]) => void;
  onView: (pr: PRData) => void;
  onEdit: (pr: PRData) => void;
  onDelete: (pr: PRData) => void;
  showCheckboxes: boolean;
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

export default function PRTableWithActions({
  data,
  selectedRows,
  onSelectRows,
  onView,
  onEdit,
  onDelete,
  showCheckboxes,
}: PRTableWithActionsProps) {
  const toggleSelectAll = () => {
    if (selectedRows.length === data.length) {
      onSelectRows([]);
    } else {
      onSelectRows(data.map((item) => item.id));
    }
  };

  const toggleRow = (id: string) => {
    if (selectedRows.includes(id)) {
      onSelectRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      onSelectRows([...selectedRows, id]);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {showCheckboxes && (
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={
                    selectedRows.length === data.length && data.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="rounded cursor-pointer"
                />
              </th>
            )}
            <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">
              PR Number
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">
              Department
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">
              Amount
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">
              Status
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">
              Requested By
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">
              Date
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">
              Due Date
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                showCheckboxes && selectedRows.includes(row.id)
                  ? "bg-blue-50"
                  : ""
              }`}
            >
              {showCheckboxes && (
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => toggleRow(row.id)}
                    className="rounded cursor-pointer"
                  />
                </td>
              )}
              <td className="px-6 py-4 text-sm font-medium text-secondary">
                {row.prNumber}
              </td>
              <td className="px-6 py-4 text-sm text-secondary/70">
                {row.department}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-secondary">
                ₱{row.amount.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(row.status)}`}
                >
                  {row.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-secondary/70">
                {row.requestedBy}
              </td>
              <td className="px-6 py-4 text-sm text-secondary/70">
                {row.dateRequested}
              </td>
              <td className="px-6 py-4 text-sm text-secondary/70">
                {row.dueDate}
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(row)}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                    title="View PR details"
                  >
                    View
                  </button>
                  <span className="text-slate-200">|</span>
                  <button
                    onClick={() => onEdit(row)}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    title="Edit PR"
                  >
                    Edit
                  </button>
                  <span className="text-slate-200">|</span>
                  <button
                    onClick={() => onDelete(row)}
                    className="text-red-600 hover:text-red-700 font-medium transition-colors"
                    title="Delete PR"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
