"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { printBudgetAllocation } from "@/lib/print";

const API_URL = "http://127.0.0.1:8000/api";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface DeptSummary {
  department_id: number;
  department: string;
  code: string;
  allocated: number;
  reserved: number;
  spent: number;
  available: number;
  percentage: number;
}

interface BudgetSummary {
  fiscal_year: number;
  total_allocated: number;
  total_reserved: number;
  total_spent: number;
  total_available: number;
  department_summaries: DeptSummary[];
}

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
};

export default function CompanyBudgetPage() {
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editingDept, setEditingDept] = useState<DeptSummary | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const fetchSummary = () => {
    setLoading(true);
    fetch(`${API_URL}/departments/budget-summary`, { headers: getHeaders() })
      .then((r) => r.json())
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const openEdit = (dept: DeptSummary) => {
    setEditingDept(dept);
    setEditAmount(dept.allocated > 0 ? String(dept.allocated) : "");
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
      const res = await fetch(`${API_URL}/departments/${editingDept.department_id}/budget`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ allocated_amount: amount }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.message || "Failed to update budget.");
        return;
      }

      setSaveSuccess(`₱${amount.toLocaleString()} allocated to ${editingDept.department} successfully.`);
      // Refresh the summary data
      fetchSummary();
      // Auto-close after 1.5s
      setTimeout(() => closeEdit(), 1500);
    } catch {
      setSaveError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const fiscalYear = summary?.fiscal_year ?? new Date().getFullYear();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Company Budget"
        subtitle={`Fiscal year ${fiscalYear} budget overview`}
        breadcrumbs={[{ label: "Admin" }, { label: "Budget Management" }]}
        actions={
          summary && (
            <button
              onClick={() => printBudgetAllocation(summary)}
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

      {loading ? (
        <div className="p-8 text-center text-secondary/50">Loading budget data...</div>
      ) : !summary ? (
        <div className="p-8 text-center text-secondary/50">
          No budget data found for FY {fiscalYear}. Click <strong>Edit Budget</strong> on any department to set allocations.
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Allocated"
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-secondary">Department Budget Breakdown</h3>
              <span className="text-xs text-secondary/50 font-semibold">FY {fiscalYear} · Click "Edit" to update allocations</span>
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
                      <th className="px-6 py-3 text-left">Department</th>
                      <th className="px-6 py-3 text-left">Allocated</th>
                      <th className="px-6 py-3 text-left">Reserved</th>
                      <th className="px-6 py-3 text-left">Available</th>
                      <th className="px-6 py-3 text-left">Share</th>
                      <th className="px-6 py-3 text-left">Utilization</th>
                      <th className="px-6 py-3 text-left">Action</th>
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
                          className={`transition-colors ${isEditing ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : "hover:bg-slate-50"}`}
                        >
                          <td className="px-6 py-3 font-semibold text-secondary">
                            {dept.department}
                            <span className="ml-2 text-xs font-normal text-secondary/50">{dept.code}</span>
                          </td>
                          <td className="px-6 py-3 font-semibold text-secondary">
                            {dept.allocated > 0 ? `₱${dept.allocated.toLocaleString()}` : <span className="text-secondary/40">Not set</span>}
                          </td>
                          <td className="px-6 py-3 text-amber-600 font-semibold">₱{dept.reserved.toLocaleString()}</td>
                          <td className="px-6 py-3 text-emerald-600 font-semibold">₱{dept.available.toLocaleString()}</td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                              {dept.percentage}%
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${Math.min(utilization, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-secondary/60">{utilization.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <button
                              onClick={() => (isEditing ? closeEdit() : openEdit(dept))}
                              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
                                isEditing
                                  ? "bg-slate-100 text-secondary hover:bg-slate-200"
                                  : "text-primary hover:bg-primary/10"
                              }`}
                            >
                              {icons.edit}
                              {isEditing ? "Cancel" : "Edit Budget"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td className="px-6 py-3 font-bold text-secondary">Total</td>
                      <td className="px-6 py-3 font-bold text-secondary">₱{summary.total_allocated.toLocaleString()}</td>
                      <td className="px-6 py-3 font-bold text-amber-600">₱{summary.total_reserved.toLocaleString()}</td>
                      <td className="px-6 py-3 font-bold text-emerald-600">₱{summary.total_available.toLocaleString()}</td>
                      <td className="px-6 py-3 font-bold text-primary">100%</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Edit Budget Slide-in Panel ── */}
      {editingDept && (
        <div className="bg-white rounded-2xl border border-primary/30 shadow-lg ring-1 ring-primary/10">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-primary/5 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                {icons.edit}
              </div>
              <div>
                <p className="text-sm font-bold text-secondary">Edit Budget Allocation</p>
                <p className="text-xs text-secondary/60">
                  {editingDept.department} · FY {fiscalYear}
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
            {/* Current snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Current Allocated", value: `₱${editingDept.allocated.toLocaleString()}`, color: "text-secondary" },
                { label: "Reserved (PRs)", value: `₱${editingDept.reserved.toLocaleString()}`, color: "text-amber-600" },
                { label: "Spent", value: `₱${editingDept.spent.toLocaleString()}`, color: "text-blue-600" },
                { label: "Available", value: `₱${editingDept.available.toLocaleString()}`, color: "text-emerald-600" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-xs text-secondary/50 mb-1">{item.label}</p>
                  <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Input */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                New Allocated Budget (₱) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/50 font-semibold text-sm">₱</span>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => { setEditAmount(e.target.value); setSaveError(""); }}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="e.g. 2000000"
                  min={0}
                  step={1000}
                  autoFocus
                />
              </div>
              {editAmount && !isNaN(parseFloat(editAmount)) && (
                <p className="mt-1.5 text-xs text-secondary/60">
                  = ₱{parseFloat(editAmount).toLocaleString()}
                  {editingDept.reserved > 0 && (
                    <span className={`ml-2 font-semibold ${parseFloat(editAmount) >= editingDept.reserved ? "text-emerald-600" : "text-red-500"}`}>
                      · {parseFloat(editAmount) >= editingDept.reserved ? "✓ Covers reserved amount" : "⚠ Below reserved amount"}
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Errors / Success */}
            {saveError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-semibold">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {saveSuccess}
              </div>
            )}

            {/* Actions */}
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
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Budget
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
