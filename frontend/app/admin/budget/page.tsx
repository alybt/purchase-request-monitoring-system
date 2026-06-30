"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { printBudgetAllocation } from "@/lib/print";
import {
  getBudgetSummary,
  updateDepartmentBudget,
  type BudgetSummaryResponse,
  type DeptSummaryWithBreakdown,
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

  // 12-Month Breakdown modal state
  const [viewingBreakdownDept, setViewingBreakdownDept] = useState<DeptSummaryWithBreakdown | null>(null);

  const fetchSummary = () => {
    setLoading(true);
    getBudgetSummary(selectedYear, selectedMonth)
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedYear, selectedMonth]);

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

  const fiscalYear = summary?.fiscal_year ?? selectedYear;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Company Budget"
        subtitle={`Fiscal year ${fiscalYear} budget overview and granular monthly allocation`}
        breadcrumbs={[{ label: "Admin" }, { label: "Budget Management" }]}
        actions={
          summary && (
            <button
              onClick={() => printBudgetAllocation(summary as any)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-sm shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4H7v4a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Print Report
            </button>
          )
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary/50">Filter Period:</span>
          
          {/* Fiscal Year Input */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3.5 py-2 text-xs font-bold text-secondary bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {[selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
              <option key={y} value={y}>FY {y}</option>
            ))}
          </select>

          {/* Month Selector */}
          <select
            value={selectedMonth === null ? "all" : selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value === "all" ? null : Number(e.target.value))}
            className="px-3.5 py-2 text-xs font-bold text-secondary bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Full Year (All Months)</option>
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>{name} ({idx + 1})</option>
            ))}
          </select>
        </div>

        {selectedMonth !== null && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
            Showing figures for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </span>
        )}
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
              title={selectedMonth ? `${MONTH_NAMES[selectedMonth - 1]} Allocated` : "Total Allocated"}
              value={`₱${summary.total_allocated.toLocaleString()}`}
              icon={icons.total}
              colorScheme="primary"
              subtitle={`FY ${fiscalYear}`}
            />
            <StatCard
              title="Reserved / In Use"
              value={`₱${summary.total_reserved.toLocaleString()}`}
              icon={icons.reserved}
              colorScheme="gold"
              subtitle="Pending PRs"
            />
            <StatCard
              title="Available Budget"
              value={`₱${summary.total_available.toLocaleString()}`}
              icon={icons.available}
              colorScheme="accent"
              subtitle="Unspent"
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
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                      <th className="px-6 py-3.5 text-left">Department</th>
                      <th className="px-6 py-3.5 text-left">Allocated</th>
                      <th className="px-6 py-3.5 text-left">Reserved</th>
                      <th className="px-6 py-3.5 text-left">Available</th>
                      <th className="px-6 py-3.5 text-left">Share</th>
                      <th className="px-6 py-3.5 text-left">Utilization</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.department_summaries.map((dept) => {
                      const utilization =
                        dept.allocated > 0
                          ? ((dept.reserved + dept.spent) / dept.allocated) * 100
                          : 0;
                      const isEditing = editingDept?.department_id === dept.department_id;
                      return (
                        <tr
                          key={dept.department_id}
                          className={`transition-colors ${isEditing ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : "hover:bg-slate-50/80"}`}
                        >
                          <td className="px-6 py-3.5 font-semibold text-secondary">
                            {dept.department}
                            <span className="ml-2 text-xs font-normal text-secondary/50">{dept.code}</span>
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-secondary">
                            {dept.allocated > 0 ? `₱${dept.allocated.toLocaleString()}` : <span className="text-secondary/40">₱0</span>}
                          </td>
                          <td className="px-6 py-3.5 text-amber-600 font-semibold">₱{dept.reserved.toLocaleString()}</td>
                          <td className="px-6 py-3.5 text-emerald-600 font-semibold">₱{dept.available.toLocaleString()}</td>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                              {dept.percentage}%
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
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingBreakdownDept(dept)}
                                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-secondary/70 hover:text-secondary hover:bg-slate-100 transition-all"
                                title="View 12-Month Breakdown"
                              >
                                {icons.breakdown}
                                Monthly
                              </button>
                              <button
                                onClick={() => (isEditing ? closeEdit() : openEdit(dept))}
                                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
                                  isEditing
                                    ? "bg-slate-100 text-secondary hover:bg-slate-200"
                                    : "text-primary hover:bg-primary/10"
                                }`}
                              >
                                {icons.edit}
                                {isEditing ? "Cancel" : "Edit"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
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
    </div>
  );
}
