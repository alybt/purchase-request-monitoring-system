"use client";

import { useState } from "react";
import type { UserData } from "@/services/users.service";

interface UserTableProps {
  data: UserData[];
  selectedRows: string[];
  onSelectRows: (ids: string[]) => void;
  onView: (user: UserData) => void;
  onEdit: (user: UserData) => void;
  onDelete: (user: UserData) => void;
  isDeleteMode?: boolean;
  onToggleDeleteMode?: () => void;
  onConfirmBulkDelete?: () => void;
  showCheckboxes?: boolean;
}

const getRoleColor = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-purple-100 text-purple-800";
    case "department_head":
      return "bg-blue-100 text-blue-800";
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
  isDeleteMode = false,
  onToggleDeleteMode,
  onConfirmBulkDelete,
  showCheckboxes = false,
}: UserTableProps) {
  const displayCheckboxes = isDeleteMode || showCheckboxes;
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
            {displayCheckboxes && (
              <th className="px-6 py-4 text-left w-12">
                <input
                  type="checkbox"
                  checked={
                    selectedRows.length === data.length && data.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="rounded cursor-pointer border-slate-300 text-primary focus:ring-primary/20"
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
            <th className="px-6 py-4 text-right text-sm font-semibold text-secondary">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                isDeleteMode && selectedRows.includes(row.id)
                  ? "bg-blue-50/50"
                  : ""
              }`}
            >
              {displayCheckboxes && (
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => toggleRow(row.id)}
                    className="rounded cursor-pointer border-slate-300 text-primary focus:ring-primary/20"
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
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onView(row)}
                    className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                    title="View user details"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onEdit(row)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit user"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(row)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete user"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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
