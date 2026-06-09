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

const mockData: UserData[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@company.com",
    department: "IT",
    role: "admin",
    status: "active",
    joinDate: "2025-01-15",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@company.com",
    department: "HR",
    role: "approver",
    status: "active",
    joinDate: "2025-02-20",
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike.johnson@company.com",
    department: "Finance",
    role: "approver",
    status: "active",
    joinDate: "2025-03-10",
  },
  {
    id: "4",
    name: "Sarah Williams",
    email: "sarah.williams@company.com",
    department: "Operations",
    role: "requester",
    status: "inactive",
    joinDate: "2025-01-05",
  },
  {
    id: "5",
    name: "Tom Brown",
    email: "tom.brown@company.com",
    department: "Marketing",
    role: "requester",
    status: "active",
    joinDate: "2025-04-12",
  },
];

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

export default function UserTable() {
  const [data] = useState<UserData[]>(mockData);
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
                <button className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
