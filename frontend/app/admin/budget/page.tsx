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



  const fiscalYear = summary?.fiscal_year ?? selectedYear;

  const safeNum = (val: any): number => {
    if (val === null || val === undefined || val === "") return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Company Budget Management"
        subtitle={`Fiscal year ${fiscalYear} budget overview and granular monthly allocation`}
            breadcrumbs={[{ label: "Admin" }, { label: "Company Budget Management" }]}
            actions={
              <div className="flex items-center gap-2">
                {summary && (
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
                <button
                  id="manage-company-budget-btn"
                  onClick={async () => {
                    setCbError(""); setCbSuccess("");
                    
                    const currentYear = new Date().getFullYear();
                      const budgets = await getAllCompanyBudgets().catch(() => []);
                      const existingYears = budgets.map(b => Number(b.fiscal_year));
                      
                      // Show current fiscal year first + any future fiscal years that already have a budget
                      const futureExistingYears = Array.from(new Set(existingYears.filter(y => y >= currentYear)));
                      if (!futureExistingYears.includes(currentYear)) {
                        futureExistingYears.push(currentYear);
                      }
                      futureExistingYears.sort((a, b) => a - b);
                      setCbAllowedYears(futureExistingYears);
                      
                      const targetYear = futureExistingYears.includes(selectedYear) ? selectedYear : futureExistingYears[0];
                      
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              title="Department Budget Allocated"
              value={`₱${safeNum(summary?.total_allocated).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
              icon={icons.total}
              colorScheme="accent"
              subtitle="Total distributed to departments"
            />
            <StatCard
              title="Remaining Budget to Allocate"
              value={`₱${Math.max(0, (safeNum(activeCompanyBudget?.total_budget) + safeNum(activeCompanyBudget?.carry_forward)) - safeNum(summary?.total_allocated)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
              icon={icons.available}
              colorScheme="accent"
              subtitle="Unallocated company budget"
            />
            <StatCard
              title="Total Share Allocated"
              value={`${((safeNum(activeCompanyBudget?.total_budget) + safeNum(activeCompanyBudget?.carry_forward)) > 0 ? (safeNum(summary?.total_allocated) / (safeNum(activeCompanyBudget?.total_budget) + safeNum(activeCompanyBudget?.carry_forward)) * 100) : 0).toFixed(2)}%`}
              icon={icons.total}
              colorScheme="primary"
              subtitle="Percentage of Total Available Budget"
            />
          </div>

          {/* Department Allocation Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-secondary">
                Department Budget Allocation Overview
              </h3>
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
                      <th className="px-6 py-3 text-left">Department</th>
                      <th className="px-6 py-3 text-left">Department Allocation</th>
                      <th className="px-6 py-3 text-left w-24">Share (%)</th>
                      <th className="px-6 py-3 text-left">Reserved Budget</th>
                      <th className="px-6 py-3 text-left">Spent Budget</th>
                      <th className="px-6 py-3 text-left">Remaining Department Budget</th>
                      <th className="px-6 py-3 text-left">Budget Utilization</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.department_summaries.map((dept) => {
                      const utilization = dept.allocated > 0 ? ((dept.reserved + dept.spent) / dept.allocated) * 100 : 0;

                      return (
                        <tr
                          key={dept.department_id}
                          className="transition-colors hover:bg-slate-50/80"
                        >
                          <td className="px-6 py-3.5 font-semibold text-secondary">
                            {dept.department}
                            <span className="ml-2 text-xs font-normal text-secondary/50">{dept.code}</span>
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-secondary">
                            {dept.allocated > 0 ? `₱${safeNum(dept.allocated).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : <span className="text-secondary/40">₱0.00</span>}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                              {(((safeNum(activeCompanyBudget?.total_budget) + safeNum(activeCompanyBudget?.carry_forward)) > 0) ? (safeNum(dept.allocated) / (safeNum(activeCompanyBudget?.total_budget) + safeNum(activeCompanyBudget?.carry_forward)) * 100) : 0).toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-amber-600 font-semibold">₱{safeNum(dept.reserved).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="px-6 py-3.5 text-red-600 font-semibold">₱{safeNum(dept.spent).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="px-6 py-3.5 text-emerald-600 font-semibold">₱{safeNum(dept.available).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
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
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              (dept as any).status === 'active' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-slate-50 text-slate-700 border border-slate-200'
                            }`}>
                              {(dept as any).status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              onClick={() => setViewingBreakdownDept(dept)}
                              className="p-2 text-primary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex justify-center items-center"
                              title="View 12-Month Breakdown"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td className="px-6 py-3.5 font-bold text-secondary">Total</td>
                      <td className="px-6 py-3.5 font-bold text-secondary">₱{summary.total_allocated.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td className="px-6 py-3.5 font-bold text-primary">
                        {((safeNum(activeCompanyBudget?.total_budget) + safeNum(activeCompanyBudget?.carry_forward)) > 0 ? (summary.total_allocated / (safeNum(activeCompanyBudget?.total_budget) + safeNum(activeCompanyBudget?.carry_forward)) * 100) : 0).toFixed(2)}%
                      </td>
                      <td className="px-6 py-3.5 font-bold text-amber-600">₱{summary.total_reserved.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td className="px-6 py-3.5 font-bold text-red-600">₱{summary.total_spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td className="px-6 py-3.5 font-bold text-emerald-600">₱{summary.total_available.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </>
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
                    setShowCompanyBudgetModal(false);
                    setSelectedYear(cbFiscalYear);
                    fetchSummary();
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-secondary/50">Fiscal Year</label>
                  <button
                    type="button"
                    onClick={async () => {
                      const maxAllowed = cbAllowedYears.length > 0 ? Math.max(...cbAllowedYears) : new Date().getFullYear();
                      const nextYear = maxAllowed + 1;
                      if (!cbAllowedYears.includes(nextYear)) {
                        setCbAllowedYears([...cbAllowedYears, nextYear]);
                      }
                      setCbError(""); setCbSuccess("");
                      await loadCbModalData(nextYear);
                    }}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    + Add FY {cbAllowedYears.length > 0 ? Math.max(...cbAllowedYears) + 1 : new Date().getFullYear() + 1}
                  </button>
                </div>
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
          </div>
        </div>
      )}


    </div>
  );
}
