"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import {
  DepartmentFormModal,
  DepartmentViewModal,
} from "@/features/departments/components/DepartmentModals";
import { AllocateBudgetModal } from "@/features/departments/components/AllocateBudgetModal";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import FiscalYearSelector from "@/components/ui/FiscalYearSelector";
import MonthSelector from "@/components/ui/MonthSelector";

const API_URL = "http://127.0.0.1:8000/api";

function getHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  has_allocation: boolean;
  budget_allocation: number;
  available_budget: number;
  reserved_budget: number;
  spent_budget: number;
  share: number;
  fiscal_year: number;
  status: string;
}

export default function DepartmentManagementPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [totalCompanyBudget, setTotalCompanyBudget] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterYear, setFilterYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [filterMonth, setFilterMonth] = useState<number | null>(null);

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [showAllocateBudget, setShowAllocateBudget] = useState(false);
  const [viewDept, setViewDept] = useState<Department | null>(null);
  const [editDept, setEditDept] = useState<Department | null>(null);

  // Deletion state
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const fetchDepts = () => {
    setLoading(true);
    const params = new URLSearchParams({ fiscal_year: String(filterYear) });
    if (filterMonth !== null) {
      params.append("month", String(filterMonth));
    }
    fetch(`${API_URL}/departments?${params.toString()}`, {
      headers: getHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        setDepartments(data.departments || []);
        setTotalCompanyBudget(data.total_company_budget || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDepts();
  }, [filterYear, filterMonth]);

  const handleCreateDept = async (form: {
    name: string;
    code: string;
    description: string;
    status: string;
  }) => {
    const res = await fetch(`${API_URL}/departments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create department");
    setShowAdd(false);
    fetchDepts();
  };

  const handleUpdateDept = async (form: {
    name: string;
    code: string;
    description: string;
    status: string;
  }) => {
    if (!editDept) return;
    const res = await fetch(`${API_URL}/departments/${editDept.id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update department");
    setEditDept(null);
    fetchDepts();
  };

  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedRows([]);
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === departments.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(departments.map((d) => d.id));
    }
  };

  const toggleRow = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteError("");
    try {
      if (selectedRows.length > 1) {
        const res = await fetch(`${API_URL}/departments/bulk-delete`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ ids: selectedRows }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to bulk delete");
      } else {
        const idToDelete = deptToDelete ? deptToDelete.id : selectedRows[0];
        const res = await fetch(`${API_URL}/departments/${idToDelete}`, {
          method: "DELETE",
          headers: getHeaders(),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Failed to delete department");
      }
      setSelectedRows([]);
      setShowDeleteModal(false);
      setIsDeleteMode(false);
      setDeptToDelete(null);
      fetchDepts();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete selected department(s).");
      setShowDeleteModal(false);
    }
  };

  const totalAllocated = departments.reduce(
    (s, d) => s + (d.budget_allocation || 0),
    0,
  );
  const totalDeptRemaining = departments.reduce(
    (s, d) => s + (d.available_budget || 0),
    0,
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Department Management"
        subtitle="Manage departments and their budget allocations"
        breadcrumbs={[{ label: "Admin" }, { label: "Department Management" }]}
        actions={
          <div className="flex items-center gap-2">
            {!isDeleteMode && (
              <>
                <button
                  id="add-department-btn"
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-2 bg-white border border-slate-200 text-secondary px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Department
                </button>
                <button
                  id="allocate-budget-btn"
                  onClick={() => setShowAllocateBudget(true)}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                >
                  <span className="w-4 h-4 flex items-center justify-center text-sm font-semibold">
                    ₱
                  </span>
                  Allocate Budget
                </button>
              </>
            )}
          </div>
        }
      />
      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm relative">
          <span className="font-semibold">Error: </span>
          {deleteError}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-secondary/50">
          Filter Period
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <FiscalYearSelector
            value={filterYear}
            onChange={setFilterYear}
            label="Fiscal Year"
          />
          <MonthSelector
            value={filterMonth}
            onChange={setFilterMonth}
            label="Month"
          />
        </div>
      </div>

      {/* Department Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-secondary">
            Departments — FY {filterYear}
          </h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-secondary/50">
              Loading departments...
            </div>
          ) : departments.length === 0 ? (
            <div className="p-8 text-center text-secondary/50">
              No departments found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                  {isDeleteMode && (
                    <th className="px-6 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedRows.length === departments.length &&
                          departments.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="rounded cursor-pointer border-slate-300 text-primary focus:ring-primary/20"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left">Department Name</th>
                  <th className="px-6 py-3 text-left">Department Code</th>
                  <th className="px-6 py-3 text-left">Department Allocation</th>
                  <th className="px-6 py-3 text-left w-24">Share (%)</th>
                  <th className="px-6 py-3 text-left">
                    Remaining Department Budget
                  </th>
                  <th className="px-6 py-3 text-left w-24">Status</th>
                  <th className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!isDeleteMode ? (
                        <button
                          onClick={handleToggleDeleteMode}
                          className="px-2.5 py-1.5 text-red-600 font-semibold hover:bg-red-50 rounded-lg transition-colors text-xs"
                          title="Enable Bulk Delete"
                        >
                          Delete
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={handleToggleDeleteMode}
                            className="px-2.5 py-1.5 text-secondary hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-2.5 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors"
                          >
                            Delete ({selectedRows.length})
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((dept) => (
                  <tr
                    key={dept.id}
                    className={`hover:bg-slate-50 transition-colors ${isDeleteMode && selectedRows.includes(dept.id) ? "bg-blue-50/50" : ""}`}
                  >
                    {isDeleteMode && (
                      <td className="px-6 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(dept.id)}
                          onChange={() => toggleRow(dept.id)}
                          className="rounded cursor-pointer border-slate-300 text-primary focus:ring-primary/20"
                        />
                      </td>
                    )}
                    <td className="px-6 py-3 font-semibold text-secondary">
                      {dept.name}
                    </td>
                    <td className="px-6 py-3 font-mono text-secondary/70">
                      {dept.code}
                    </td>
                    <td className="px-6 py-3 font-semibold text-secondary">
                      {dept.has_allocation ? (
                        `₱${dept.budget_allocation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      ) : (
                        <span className="text-secondary/40 font-normal italic">
                          Not Allocated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 font-semibold text-secondary/70">
                      {dept.has_allocation ? (
                        `${dept.share.toFixed(2)}%`
                      ) : (
                        <span className="text-secondary/40 font-normal italic">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 font-semibold">
                      {dept.has_allocation ? (
                        <span
                          className={
                            dept.available_budget < 0
                              ? "text-red-600"
                              : "text-emerald-600"
                          }
                        >
                          ₱
                          {dept.available_budget.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        <span className="text-secondary/40 italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          dept.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {dept.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewDept(dept)}
                          className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditDept(dept)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Department"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setDeptToDelete(dept);
                            setSelectedRows([dept.id]);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Department"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {(totalCompanyBudget > 0 || totalAllocated > 0) && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    {isDeleteMode && <td />}
                    <td
                      className="px-6 py-2.5 font-bold text-secondary"
                      colSpan={2}
                    >
                      Total Allocated
                    </td>
                    <td className="px-6 py-2.5 font-bold text-secondary">
                      ₱
                      {totalAllocated.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-2.5 font-bold text-secondary/70">
                      {(totalCompanyBudget > 0
                        ? (totalAllocated / totalCompanyBudget) * 100
                        : 0
                      ).toFixed(2)}
                      %
                    </td>
                    <td className="px-6 py-2.5 font-bold text-secondary">
                      ₱
                      {totalDeptRemaining.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td colSpan={2} />
                  </tr>
                  <tr className="bg-slate-50 border-t border-slate-100">
                    {isDeleteMode && <td />}
                    <td
                      className="px-6 py-2.5 font-bold text-secondary"
                      colSpan={2}
                    >
                      Total Company Budget
                    </td>
                    <td className="px-6 py-2.5 font-bold text-primary">
                      ₱
                      {totalCompanyBudget.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-2.5 font-bold text-primary">
                      {totalCompanyBudget > 0 ? "100.00%" : "0.00%"}
                    </td>
                    <td className="px-6 py-2.5 font-bold text-primary">
                      ₱
                      {totalAllocated.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td colSpan={2} />
                  </tr>
                  <tr className="bg-slate-50 border-t border-slate-100">
                    {isDeleteMode && <td />}
                    <td
                      className="px-6 py-2.5 font-bold text-secondary"
                      colSpan={2}
                    >
                      Remaining Unallocated
                    </td>
                    <td className="px-6 py-2.5 font-bold text-accent">
                      ₱
                      {Math.max(
                        0,
                        totalCompanyBudget - totalAllocated,
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-2.5 font-bold text-accent">
                      {(totalCompanyBudget > 0
                        ? (Math.max(0, totalCompanyBudget - totalAllocated) /
                            totalCompanyBudget) *
                          100
                        : 0
                      ).toFixed(2)}
                      %
                    </td>
                    <td className="px-6 py-2.5 font-bold text-accent">
                      ₱
                      {Math.max(
                        0,
                        totalAllocated - totalDeptRemaining,
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>

      {/* Add Department Modal */}
      <DepartmentFormModal
        isOpen={showAdd}
        isEditMode={false}
        onClose={() => setShowAdd(false)}
        onSubmit={handleCreateDept}
      />

      {/* View Department Modal */}
      <DepartmentViewModal
        isOpen={!!viewDept}
        department={viewDept}
        onClose={() => setViewDept(null)}
        onEdit={() => {
          const d = viewDept;
          setViewDept(null);
          setEditDept(d);
        }}
      />

      {/* Edit Department Modal */}
      <DepartmentFormModal
        isOpen={!!editDept}
        isEditMode={true}
        initialData={editDept}
        onClose={() => setEditDept(null)}
        onSubmit={handleUpdateDept}
      />
      {/* Delete Department Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        selectedCount={selectedRows.length}
        entityName="Department"
        onClose={() => {
          setShowDeleteModal(false);
          if (!isDeleteMode) {
            setDeptToDelete(null);
            setSelectedRows([]);
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      <AllocateBudgetModal
        isOpen={showAllocateBudget}
        fiscalYear={filterYear}
        departments={departments}
        onClose={() => setShowAllocateBudget(false)}
        onSaved={() => {
          fetchDepts();
        }}
      />
    </div>
  );
}
