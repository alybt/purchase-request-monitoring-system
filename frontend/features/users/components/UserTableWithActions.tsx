"use client";

import { useState } from "react";

interface UserData {
  id: string;
  name: string;
  email: string;
  department: string;
  role: "admin" | "approver" | "requester";
  status: "active" | "inactive";
  joinDate: string;
}

interface UserTableProps {
  data: UserData[];
  selectedRows: string[];
  onSelectRows: (ids: string[]) => void;
  onView: (user: UserData) => void;
  onEdit: (user: UserData) => void;
  onDelete: (user: UserData) => void;
  showCheckboxes: boolean;
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

export default function UserTable({
  data,
  selectedRows,
  onSelectRows,
  onView,
  onEdit,
  onDelete,
  showCheckboxes,
}: UserTableProps) {
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
              Name
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">
              Email
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">
              Department
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">
              Role
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">
              Status
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-secondary">
              Join Date
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
                {row.name}
              </td>
              <td className="px-6 py-4 text-sm text-secondary/70">
                {row.email}
              </td>
              <td className="px-6 py-4 text-sm text-secondary/70">
                {row.department}
              </td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getRoleColor(row.role)}`}
                >
                  {row.role}
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(row.status)}`}
                >
                  {row.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-secondary/70">
                {row.joinDate}
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(row)}
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                    title="View user details"
                  >
                    View
                  </button>
                  <span className="text-slate-200">|</span>
                  <button
                    onClick={() => onEdit(row)}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    title="Edit user"
                  >
                    Edit
                  </button>
                  <span className="text-slate-200">|</span>
                  <button
                    onClick={() => onDelete(row)}
                    className="text-red-600 hover:text-red-700 font-medium transition-colors"
                    title="Delete user"
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
