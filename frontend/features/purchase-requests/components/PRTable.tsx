"use client";

import { useState } from "react";

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

const mockData: PRData[] = [
  {
    id: "1",
    prNumber: "PR-2026-001",
    department: "IT",
    amount: 50000,
    status: "pending",
    requestedBy: "John Doe",
    dateRequested: "2026-06-01",
    dueDate: "2026-06-15",
  },
  {
    id: "2",
    prNumber: "PR-2026-002",
    department: "HR",
    amount: 25000,
    status: "approved",
    requestedBy: "Jane Smith",
    dateRequested: "2026-05-28",
    dueDate: "2026-06-10",
  },
  {
    id: "3",
    prNumber: "PR-2026-003",
    department: "Finance",
    amount: 75000,
    status: "pending",
    requestedBy: "Mike Johnson",
    dateRequested: "2026-06-02",
    dueDate: "2026-06-20",
  },
  {
    id: "4",
    prNumber: "PR-2026-004",
    department: "Operations",
    amount: 35000,
    status: "completed",
    requestedBy: "Sarah Williams",
    dateRequested: "2026-05-15",
    dueDate: "2026-06-01",
  },
  {
    id: "5",
    prNumber: "PR-2026-005",
    department: "Marketing",
    amount: 45000,
    status: "rejected",
    requestedBy: "Tom Brown",
    dateRequested: "2026-06-03",
    dueDate: "2026-06-18",
  },
];

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

export default function PRTable() {
  const [data] = useState<PRData[]>(mockData);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedRows.length === data.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map((item) => item.id));
    }
  };

  const toggleRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-6 py-4 text-left">
              <input
                type="checkbox"
                checked={selectedRows.length === data.length && data.length > 0}
                onChange={toggleSelectAll}
                className="rounded cursor-pointer"
              />
            </th>
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
              className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedRows.includes(row.id)}
                  onChange={() => toggleRow(row.id)}
                  className="rounded cursor-pointer"
                />
              </td>
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
                <button className="text-primary hover:text-primary/80 font-medium transition-colors">
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
