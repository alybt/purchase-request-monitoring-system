"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { getMyDepartmentBudget, getCategories } from "@/services/budget.service";
import type { DepartmentBudget, CategoryBudget, Category } from "@/services/budget.service";
import { AllocateCategoryBudgetModal } from "@/features/categories/components/AllocateCategoryBudgetModal";
import FiscalYearSelector from "@/components/ui/FiscalYearSelector";
import { getFiscalYear } from "@/lib/date-utils";

const icons = {
  budget: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  allocated: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  remaining: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
};

export default function CategoryBudgetPage() {
  const [budget, setBudget] = useState<DepartmentBudget | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [filterYear, setFilterYear] = useState<number | "">(getFiscalYear());
  const [filterMonth, setFilterMonth] = useState<number | null>(null);

  const [annualBudget, setAnnualBudget] = useState<DepartmentBudget | null>(null);
  const [annualCategoryBudgets, setAnnualCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [loadingAnnual, setLoadingAnnual] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      getMyDepartmentBudget(filterYear, filterMonth).catch(() => ({ department_budget: null, category_budgets: [] })),
      getCategories().catch(() => [] as Category[]),
    ]).then(([budgetData, cats]) => {
      setBudget(budgetData.department_budget);
      setCategoryBudgets(budgetData.category_budgets);
      setAllCategories(cats);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [filterYear, filterMonth]);

  const handleOpenAllocateModal = () => {
    if (filterMonth) {
      setLoadingAnnual(true);
      getMyDepartmentBudget(filterYear, null)
        .then((budgetData) => {
          setAnnualBudget(budgetData.department_budget);
          setAnnualCategoryBudgets(budgetData.category_budgets);
          setShowAllocateModal(true);
        })
        .catch(console.error)
        .finally(() => setLoadingAnnual(false));
    } else {
      setShowAllocateModal(true);
    }
  };

  const totalAllocatedToCategories = categoryBudgets.reduce((sum, c) => sum + c.allocated, 0);
  const remainingToAllocate = budget ? budget.allocated - totalAllocatedToCategories : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Category Budget"
        subtitle="View and manage your department's category budget allocations"
        breadcrumbs={[{ label: "Department Head" }, { label: "Category Budget" }]}
        actions={
          <button
            disabled={loadingAnnual}
            onClick={handleOpenAllocateModal}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
          >
            {loadingAnnual ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Loading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Allocate Category Budget
              </>
            )}
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-secondary/50">
          Filter Period
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <FiscalYearSelector
            value={filterYear}
            onChange={setFilterYear}
            monthValue={filterMonth}
            onMonthChange={setFilterMonth}
            label="Fiscal Year"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-secondary/50">Loading budget data...</div>
      ) : (
        <>
          {/* Budget Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Department Budget"
              value={budget ? `₱${budget.allocated.toLocaleString()}` : "N/A"}
              icon={icons.budget}
              colorScheme="primary"
              subtitle="Total allocation"
            />
            <StatCard
              title="Allocated to Categories"
              value={`₱${totalAllocatedToCategories.toLocaleString()}`}
              icon={icons.allocated}
              colorScheme="accent"
              subtitle="Category budgets"
            />
            <StatCard
              title="Remaining Budget"
              value={`₱${Math.max(remainingToAllocate, 0).toLocaleString()}`}
              icon={icons.remaining}
              colorScheme="gold"
              subtitle="Unallocated"
            />
          </div>

          {/* Category Allocation Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-secondary">Category Budget Allocations</h3>
              <span className="text-xs text-secondary/50">FY {budget?.fiscal_year ?? getFiscalYear()}</span>
            </div>
            <div className="overflow-x-auto">
              {categoryBudgets.length === 0 ? (
                <div className="p-8 text-center text-secondary/50 text-sm">
                  No category budgets have been allocated for this fiscal year.
                  <br />
                  <span className="text-xs text-secondary/40">Contact your administrator to set up department budgets.</span>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                      <th className="px-6 py-3 text-left">Category</th>
                      <th className="px-6 py-3 text-left">Allocated Budget</th>
                      <th className="px-6 py-3 text-left">Available</th>
                      <th className="px-6 py-3 text-left">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categoryBudgets.map((cat) => {
                      const utilization = cat.allocated > 0
                        ? ((cat.reserved + cat.spent) / cat.allocated) * 100
                        : 0;
                      return (
                        <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-semibold text-secondary">{cat.category}</td>
                          <td className="px-6 py-3 font-semibold text-secondary">₱{cat.allocated.toLocaleString()}</td>
                          <td className="px-6 py-3 text-emerald-600 font-semibold">₱{cat.available.toLocaleString()}</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${Math.min(utilization, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-secondary">{utilization.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50">
                      <td className="px-6 py-4 text-sm font-bold text-secondary">Total</td>
                      <td className="px-6 py-4 text-sm font-bold text-secondary">₱{totalAllocatedToCategories.toLocaleString()}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>

        </>
      )}

      {showAllocateModal && (
        <AllocateCategoryBudgetModal
          isOpen={showAllocateModal}
          departmentBudget={filterMonth ? annualBudget : budget}
          categories={allCategories}
          existingAllocations={filterMonth ? annualCategoryBudgets : categoryBudgets}
          onClose={() => setShowAllocateModal(false)}
          onSaved={() => {
            setShowAllocateModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
