"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import FiscalYearSelector from "@/components/ui/FiscalYearSelector";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { printBudgetAllocation } from "@/lib/print";
import {
  getBudgetSummary,
  updateDepartmentBudget,
  getCompanyBudget,
  getAllCompanyBudgets,
  upsertCompanyBudget,
  type BudgetSummaryResponse,
  type DeptSummaryWithBreakdown,
  type CompanyBudget,
} from "@/services/budget.service";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const icons = {
  total: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  reserved: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  available: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  breakdown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

export default function CompanyBudgetPage() {
  const [summary, setSummary] = useState<BudgetSummaryResponse | null>(null);
  const [activeCompanyBudget, setActiveCompanyBudget] = useState<CompanyBudget | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // Edit modal state
  const [editingDept, setEditingDept] = useState<DeptSummaryWithBreakdown | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMonth, setEditMonth] = useState<number>(new Date().getMonth() + 1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // Deletion state
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<DeptSummaryWithBreakdown | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // 12-Month Breakdown modal state
  const [viewingBreakdownDept, setViewingBreakdownDept] = useState<DeptSummaryWithBreakdown | null>(null);

  // Company Budget modal state
  const [showCompanyBudgetModal, setShowCompanyBudgetModal] = useState(false);
  const [companyBudget, setCompanyBudget] = useState<CompanyBudget | null>(null);
  const [cbFiscalYear, setCbFiscalYear] = useState<number>(new Date().getFullYear());
  const [cbAllowedYears, setCbAllowedYears] = useState<number[]>([]);
  const [cbAmount, setCbAmount] = useState("");
  const [cbCarryForward, setCbCarryForward] = useState("");
  const [cbPrevRemaining, setCbPrevRemaining] = useState(0);
  const [cbSummary, setCbSummary] = useState<BudgetSummaryResponse | null>(null);
  const [cbSaving, setCbSaving] = useState(false);
  const [cbError, setCbError] = useState("");
  const [cbSuccess, setCbSuccess] = useState("");

  const fetchSummary = useCallback(() => {
    setLoading(true);
    Promise.all([
      getBudgetSummary(selectedYear, selectedMonth).catch(() => null),
      getCompanyBudget(selectedYear).catch(() => null)
    ])
      .then(([summaryData, cbData]) => {
        setSummary(summaryData);
        setActiveCompanyBudget(cbData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedYear, selectedMonth]);

  const loadCbModalData = async (targetYear: number) => {
    setCbFiscalYear(targetYear);
    const existing = await getCompanyBudget(targetYear).catch(() => null);
    const currSummary = await getBudgetSummary(targetYear).catch(() => null);
    
    setCompanyBudget(existing);
    setCbSummary(currSummary);
    setCbAmount(existing && Number(existing.total_budget) > 0 ? String(existing.total_budget) : "");

    // Load previous year data
    const prevYear = targetYear - 1;
    const prevCb = await getCompanyBudget(prevYear).catch(() => null);
    const prevSummary = await getBudgetSummary(prevYear).catch(() => null);

    let prevRem = 0;
    if (prevCb && prevSummary) {
      prevRem = (Number(prevCb.total_budget || 0) + Number(prevCb.carry_forward || 0)) - Number(prevSummary.total_reserved || 0) - Number(prevSummary.total_spent || 0);
    }
    const finalPrevRem = isNaN(prevRem) ? 0 : Math.max(0, prevRem);
    setCbPrevRemaining(finalPrevRem);
    
    // Automatically set carry forward budget to previous year's remaining balance if carry_forward isn't explicitly greater than 0
    if (existing && Number(existing.carry_forward) > 0) {
      setCbCarryForward(String(existing.carry_forward));
    } else {
      setCbCarryForward(String(finalPrevRem));
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const openEdit = (dept: DeptSummaryWithBreakdown) => {
    setEditingDept(dept);
    setEditAmount(dept.allocated > 0 ? String(dept.allocated) : "");
    setEditMonth(selectedMonth || new Date().getMonth() + 1);
    setSaveError("");
    setSaveSuccess("");
  };

  const closeEdit = () => {
    setEditingDept(null);
    setEditAmount("");
    setSaveError("");
    setSaveSuccess("");
  };

  const handleSave = async () => {
    if (!editingDept) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      setSaveError("Please enter a valid positive amount.");
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      await updateDepartmentBudget(editingDept.department_id, {
        allocated_amount: amount,
        fiscal_year: selectedYear,
        month: editMonth,
      });

      setSaveSuccess(`₱${amount.toLocaleString()} allocated to ${editingDept.department} for ${MONTH_NAMES[editMonth - 1]} successfully.`);
      fetchSummary();
      setTimeout(() => closeEdit(), 1500);
    } catch (err: any) {
      setSaveError(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedRows([]);
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === (summary?.department_summaries?.length || 0)) {
      setSelectedRows([]);
    } else {
      setSelectedRows((summary?.department_summaries || []).map((d) => d.department_id));
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
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      if (selectedRows.length > 1) {
        const res = await fetch(`http://127.0.0.1:8000/api/departments/budget/bulk-delete`, {
          method: "POST",
          headers,
          body: JSON.stringify({ ids: selectedRows, fiscal_year: selectedYear, month: selectedMonth }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to bulk delete");
      } else {
        const idToDelete = deptToDelete ? deptToDelete.department_id : selectedRows[0];
        const res = await fetch(`http://127.0.0.1:8000/api/departments/${idToDelete}/budget`, {
          method: "DELETE",
          headers,
          body: JSON.stringify({ fiscal_year: selectedYear, month: selectedMonth }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to delete budget");
      }
      setSelectedRows([]);
      setShowDeleteModal(false);
      setIsDeleteMode(false);
      setDeptToDelete(null);
      fetchSummary();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete selected budget(s).");
      setShowDeleteModal(false);
    }
  };

  const fiscalYear = summary?.fiscal_year ?? selectedYear;

  const safeNum = (val: any): number => {
    if (val === null || val === undefined || val === "") return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Company Budget"
        subtitle={`Fiscal year ${fiscalYear} budget overview and granular monthly allocation`}
        breadcrumbs={[{ label: "Admin" }, { label: "Budget Management" }]}
        actions={
          <div className="flex items-center gap-2">
            {!isDeleteMode && summary && (
              <button
                onClick={() => printBudgetAllocation(summary as any)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-sm shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4H7v4a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                Print Report
              </button>
            )}
            {!isDeleteMode && (
              <button
                id="manage-company-budget-btn"
                onClick={async () => {
                  setCbError(""); setCbSuccess("");
                  
                  const budgets = await getAllCompanyBudgets().catch(() => []);
                  const existingYears = budgets.map(b => b.fiscal_year).sort((a, b) => a - b);
                  let maxYear = new Date().getFullYear();
                  if (existingYears.length > 0) {
                      maxYear = existingYears[existingYears.length - 1];
                  }
                  
                  const allowed = [...existingYears];
                  if (!allowed.includes(maxYear + 1)) {
                      allowed.push(maxYear + 1);
                  }
                  if (allowed.length === 0) {
                      allowed.push(new Date().getFullYear());
                  }
                  setCbAllowedYears(allowed);
                  
                  const targetYear = allowed.includes(selectedYear) ? selectedYear : allowed[allowed.length - 1];
                  
                  await loadCbModalData(targetYear);
                  setShowCompanyBudgetModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-sm shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Manage Company Budget
            </button>
            )}
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-secondary/50">Filter Period</p>
        <div className="flex flex-wrap items-center gap-4">
          <FiscalYearSelector
            value={selectedYear}
            onChange={setSelectedYear}
            label="Fiscal Year"
          />

          {/* Month filter */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-secondary/60">Month</span>
            <select value={selectedMonth === null ? "all" : selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === "all" ? null : Number(e.target.value))}
              className="px-3.5 py-2 text-xs font-bold text-secondary bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="all">Full Year (All Months)</option>
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>{name}</option>
              ))}
            </select>
          </div>
          {selectedMonth !== null && (
            <span className="self-end inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-secondary/50">Loading budget data...</div>
      ) : !summary ? (
        <div className="p-12 text-center text-secondary/50">
          No budget data found for FY {fiscalYear}. Click <strong>Edit Budget</strong> on any department to set allocations.
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Approved Budget"
              value={`₱${safeNum(activeCompanyBudget?.total_budget).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
              icon={icons.total}
              colorScheme="primary"
              subtitle={`FY ${fiscalYear} Allocation`}
            />
            <StatCard
              title="Carry Forward"
              value={`₱${safeNum(activeCompanyBudget?.carry_forward).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
              icon={icons.available}
              colorScheme="gold"
              subtitle="From previous FY"
            />
            <StatCard
              title="Total Available Budget"
              value={`₱${(safeNum(activeCompanyBudget?.total_budget) + safeNum(activeCompanyBudget?.carry_forward)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
              icon={icons.available}
              colorScheme="emerald"
              subtitle="Approved + Carry Forward"
            />
            <StatCard
              title="Reserved / Pending PRs"
              value={`₱${safeNum(summary.total_reserved).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
              icon={icons.reserved}
              colorScheme="gold"
              subtitle="In workflow"
            />
            <StatCard
              title="Total Spent"
              value={`₱${safeNum(summary.total_spent).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
              icon={icons.reserved}
              colorScheme="red"
              subtitle="Completed PRs"
            />
            <StatCard
              title="Remaining Budget"
              value={`₱${(
                (safeNum(activeCompanyBudget?.total_budget) + safeNum(activeCompanyBudget?.carry_forward)) -
                safeNum(summary.total_reserved) - safeNum(summary.total_spent)
              ).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
              icon={icons.available}
              colorScheme="accent"
              subtitle="Available for future PRs"
            />
          </div>

          {/* Department Allocation Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-secondary">
                Department Budget Breakdown {selectedMonth ? `(${MONTH_NAMES[selectedMonth - 1]})` : "(Full Year)"}
              </h3>
              <span className="text-xs text-secondary/50 font-semibold">Click "Monthly Breakdown" for 12-month trends</span>
            </div>
            <div className="overflow-x-auto">
              {summary.department_summaries.length === 0 ? (
                <div className="p-8 text-center text-secondary/50 text-sm">
                  No department budgets configured yet for FY {fiscalYear}.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                      {isDeleteMode && (
                        <th className="px-6 py-3 text-left w-12">
                          <input
                            type="checkbox"
                            checked={selectedRows.length === summary.department_summaries.length && summary.department_summaries.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded cursor-pointer border-slate-300 text-primary focus:ring-primary/20"
                          />
                        </th>
                      )}
                      <th className="px-6 py-3 text-left">Department</th>
                      <th className="px-6 py-3 text-left">Allocated</th>
                      <th className="px-6 py-3 text-left">Reserved</th>
                      <th className="px-6 py-3 text-left">Available</th>
                      <th className="px-6 py-3 text-left w-24">Share</th>
                      <th className="px-6 py-3 text-left">Utilization</th>
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
                    {summary.department_summaries.map((dept) => {
                      const isEditing = editingDept?.department_id === dept.department_id;
                      const utilization = dept.allocated > 0 ? ((dept.reserved + dept.spent) / dept.allocated) * 100 : 0;

                      return (
                        <tr
                          key={dept.department_id}
                          className={`transition-colors ${isEditing ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : "hover:bg-slate-50/80"} ${isDeleteMode && selectedRows.includes(dept.department_id) ? "bg-blue-50/50" : ""}`}
                        >
                          {isDeleteMode && (
                            <td className="px-6 py-3.5">
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(dept.department_id)}
                                onChange={() => toggleRow(dept.department_id)}
                                className="rounded cursor-pointer border-slate-300 text-primary focus:ring-primary/20"
                              />
                            </td>
                          )}
                          <td className="px-6 py-3.5 font-semibold text-secondary">
                            {dept.department}
                            <span className="ml-2 text-xs font-normal text-secondary/50">{dept.code}</span>
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-secondary">
                            {dept.allocated > 0 ? `₱${safeNum(dept.allocated).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : <span className="text-secondary/40">₱0.00</span>}
                          </td>
                          <td className="px-6 py-3.5 text-amber-600 font-semibold">₱{safeNum(dept.reserved).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="px-6 py-3.5 text-emerald-600 font-semibold">₱{safeNum(dept.available).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                              {safeNum(dept.percentage).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${Math.min(utilization, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-secondary/60 font-semibold">{utilization.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setViewingBreakdownDept(dept)}
                                className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                title="View 12-Month Breakdown"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => (isEditing ? closeEdit() : openEdit(dept))}
                                className={`p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors ${isEditing ? "bg-blue-50 text-blue-600" : ""}`}
                                title={isEditing ? "Cancel Edit" : "Edit Budget"}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setDeptToDelete(dept);
                                  setSelectedRows([dept.department_id]);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Budget"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      {isDeleteMode && <td />}
                      <td className="px-6 py-3.5 font-bold text-secondary">Total</td>
                      <td className="px-6 py-3.5 font-bold text-secondary">₱{summary.total_allocated.toLocaleString()}</td>
                      <td className="px-6 py-3.5 font-bold text-amber-600">₱{summary.total_reserved.toLocaleString()}</td>
                      <td className="px-6 py-3.5 font-bold text-emerald-600">₱{summary.total_available.toLocaleString()}</td>
                      <td className="px-6 py-3.5 font-bold text-primary">100%</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Edit Budget Panel ── */}
      {editingDept && (
        <div className="bg-white rounded-2xl border border-primary/30 shadow-lg ring-1 ring-primary/10 transition-all">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-primary/5 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white">
                {icons.edit}
              </div>
              <div>
                <p className="text-sm font-bold text-secondary">Edit Monthly Budget Allocation</p>
                <p className="text-xs text-secondary/60">
                  {editingDept.department} ({editingDept.code}) · FY {fiscalYear}
                </p>
              </div>
            </div>
            <button onClick={closeEdit} className="text-secondary/40 hover:text-secondary transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-secondary/50 mb-2">
                  Target Month
                </label>
                <select
                  value={editMonth}
                  onChange={(e) => setEditMonth(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  {MONTH_NAMES.map((mName, idx) => (
                    <option key={idx + 1} value={idx + 1}>{mName} (Month {idx + 1})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-secondary/50 mb-2">
                  Allocated Amount (₱) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/50 font-semibold text-sm">₱</span>
                  <input
                    type="number"
                    value={editAmount}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => { setEditAmount(e.target.value); setSaveError(""); }}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="0.00"
                    min={0}
                    step={1000}
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {saveError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-semibold">
                {saveSuccess}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={closeEdit}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-secondary border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editAmount}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Budget"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 12-Month Breakdown Modal ── */}
      {viewingBreakdownDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div>
                <h3 className="text-base font-bold text-secondary">
                  12-Month Budget Breakdown: {viewingBreakdownDept.department}
                </h3>
                <p className="text-xs text-secondary/60">
                  Code: {viewingBreakdownDept.code} · FY {fiscalYear}
                </p>
              </div>
              <button
                onClick={() => setViewingBreakdownDept(null)}
                className="p-1.5 text-secondary/40 hover:text-secondary hover:bg-slate-200/50 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                  <span className="text-xs text-secondary/60 font-semibold">Total Year Allocated</span>
                  <p className="text-base font-bold text-primary">₱{viewingBreakdownDept.allocated.toLocaleString()}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <span className="text-xs text-amber-800/60 font-semibold">Total Year Reserved</span>
                  <p className="text-base font-bold text-amber-700">₱{viewingBreakdownDept.reserved.toLocaleString()}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <span className="text-xs text-emerald-800/60 font-semibold">Total Year Available</span>
                  <p className="text-base font-bold text-emerald-700">₱{viewingBreakdownDept.available.toLocaleString()}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-secondary/50 uppercase font-semibold">
                      <th className="px-4 py-3 text-left">Month</th>
                      <th className="px-4 py-3 text-right">Allocated</th>
                      <th className="px-4 py-3 text-right">Reserved</th>
                      <th className="px-4 py-3 text-right">Spent</th>
                      <th className="px-4 py-3 text-right">Available</th>
                      <th className="px-4 py-3 text-left">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewingBreakdownDept.monthly_breakdown || []).map((mb) => {
                      const mUtil = mb.allocated > 0 ? ((mb.reserved + mb.spent) / mb.allocated) * 100 : 0;
                      return (
                        <tr key={mb.month} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-semibold text-secondary">{MONTH_NAMES[mb.month - 1]}</td>
                          <td className="px-4 py-3 text-right font-semibold text-secondary">₱{mb.allocated.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium text-amber-600">₱{mb.reserved.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium text-blue-600">₱{mb.spent.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-600">₱{mb.available.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(mUtil, 100)}%` }} />
                              </div>
                              <span className="text-xs text-secondary/60 font-medium">{mUtil.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingBreakdownDept(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-secondary hover:bg-secondary/90 rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Company Budget Modal ── */}
      {showCompanyBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90 backdrop-blur-md rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-secondary">Manage Company Budget</h3>
                  <p className="text-xs text-secondary/60">Set the overall company budget for a fiscal year</p>
                </div>
              </div>
              <button onClick={() => setShowCompanyBudgetModal(false)} className="p-1.5 text-secondary/40 hover:text-secondary hover:bg-slate-200/50 rounded-xl transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {cbSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-secondary text-center">Success!</h3>
                <p className="text-sm text-secondary/60 text-center">{cbSuccess}</p>
              </div>
            ) : (
              <>
                {/* Body */}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const amt = parseFloat(cbAmount);
                  const cf = parseFloat(cbCarryForward || "0");
                  if (isNaN(amt) || amt < 0) { setCbError("Please enter a valid positive amount for Approved Budget."); return; }
                  if (isNaN(cf) || cf < 0) { setCbError("Please enter a valid positive amount for Carry Forward."); return; }
                  if (cf > cbPrevRemaining) { setCbError(`Carry forward cannot exceed previous year's remaining balance (₱${cbPrevRemaining.toLocaleString()}).`); return; }
                  
                  setCbSaving(true); setCbError(""); setCbSuccess("");
                  try {
                    const saved = await upsertCompanyBudget(cbFiscalYear, amt, cf);
                    setCompanyBudget(saved);
                    setCbSuccess(`FY ${cbFiscalYear} company budget saved successfully.`);
                    fetchSummary();
                    setTimeout(() => setShowCompanyBudgetModal(false), 1500);
                  } catch (err: any) {
                    setCbError(err.message || "Failed to save company budget.");
                  } finally {
                    setCbSaving(false);
                  }
                }} className="flex flex-col overflow-hidden">
                  <div className="p-6 space-y-5 overflow-y-auto">
                    {cbError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{cbError}</div>}

              {/* Fiscal Year — Sliding Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-secondary/50 mb-2">Fiscal Year</label>
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                  <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none flex-1">
                    {cbAllowedYears.map((year) => (
                      <button key={year} type="button"
                        onClick={async () => {
                          setCbError(""); setCbSuccess("");
                          await loadCbModalData(year);
                        }}
                        className={`shrink-0 px-2 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          year === cbFiscalYear ? "bg-primary text-white shadow-sm" : "text-secondary/60 hover:text-secondary hover:bg-white"
                        }`}>{year}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fiscal Information */}
              <div>
                 <label className="block text-xs font-bold uppercase tracking-wider text-secondary/50 mb-2">FY {cbFiscalYear - 1} Remaining Budget</label>
                 <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-secondary/70">
                   ₱{(cbPrevRemaining || 0).toLocaleString()}
                 </div>
                 <p className="text-xs text-secondary/50 mt-1">
                   Remaining budget automatically calculated from previous fiscal year.
                 </p>
              </div>

              <div className="w-full h-px bg-slate-100 my-2"></div>

              {/* Approved Budget */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-secondary/50 mb-2">
                  Approved Budget (₱) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/50 font-semibold text-sm">₱</span>
                  <input
                    type="number"
                    value={cbAmount}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => { setCbAmount(e.target.value); setCbError(""); }}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="0.00"
                    min={0}
                    step={10000}
                  />
                </div>
              </div>

              {/* Carry Forward */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-secondary/50 mb-2">
                  Carry Forward (₱) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/50 font-semibold text-sm">₱</span>
                  <input
                    type="number"
                    value={cbCarryForward}
                    disabled={cbPrevRemaining === 0}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => { 
                      const val = Number(e.target.value);
                      if (val > cbPrevRemaining) {
                        setCbError(`Carry forward cannot exceed previous year's remaining balance (₱${cbPrevRemaining.toLocaleString()}).`);
                      } else {
                        setCbError("");
                      }
                      setCbCarryForward(e.target.value); 
                    }}
                    className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 transition-all ${
                      cbPrevRemaining === 0 
                        ? "bg-slate-100 border-slate-200 text-secondary/40 cursor-not-allowed"
                        : "border-slate-200 text-secondary focus:ring-primary/30 focus:border-primary"
                    }`}
                    placeholder="0.00"
                    min={0}
                    max={cbPrevRemaining}
                    step={10000}
                  />
                </div>
                <p className="text-xs text-secondary/50 mt-1">
                  You may reduce or set this to zero, but it cannot exceed the remaining balance.
                </p>
              </div>

              {/* Total Available Budget */}
              <div>
                 <label className="block text-xs font-bold uppercase tracking-wider text-secondary/50 mb-2">Total Available Budget</label>
                 <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-extrabold text-lg flex items-center justify-between">
                   <span>₱{(Number(cbAmount || 0) + Number(cbCarryForward || 0)).toLocaleString()}</span>
                   <span className="text-xs font-semibold text-emerald-700/60 uppercase">Approved + Carry Forward</span>
                 </div>
              </div>

              <div className="w-full h-px bg-slate-100 my-2"></div>

              {/* Fiscal Summary (Read-Only) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-secondary/70 mb-3">Fiscal Summary Status</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-secondary/50 font-semibold mb-1">Reserved Amount</p>
                    <p className="font-bold text-gold">₱{cbSummary?.total_reserved.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary/50 font-semibold mb-1">Total Spent</p>
                    <p className="font-bold text-red-600">₱{cbSummary?.total_spent.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary/50 font-semibold mb-1">Remaining Budget</p>
                    <p className="font-bold text-accent">₱{((Number(cbAmount || 0) + Number(cbCarryForward || 0)) - (cbSummary?.total_reserved || 0) - (cbSummary?.total_spent || 0)).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex shrink-0 items-center justify-end gap-3 rounded-b-2xl z-10">
                  <button
                    type="button"
                    onClick={() => setShowCompanyBudgetModal(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-secondary border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cbSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {cbSaving ? "Saving..." : "Save Budget"}
                  </button>
                </div>
              </form>
            </>
          )}
      </div>
    </div>
      )}

      {/* Delete Budget Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        selectedCount={selectedRows.length}
        entityName="Budget"
        onClose={() => {
          setShowDeleteModal(false);
          if (!isDeleteMode) {
            setDeptToDelete(null);
            setSelectedRows([]);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
