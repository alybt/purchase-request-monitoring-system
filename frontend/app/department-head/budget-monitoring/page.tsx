"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { getMyDepartmentBudget } from "@/services/budget.service";
import type { DepartmentBudget, CategoryBudget } from "@/services/budget.service";

const icons = {
  budget: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  available: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  reserved: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  spent: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

export default function BudgetMonitoringPage() {
  const [budget, setBudget] = useState<DepartmentBudget | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyDepartmentBudget()
      .then((data) => {
        setBudget(data.department_budget);
        setCategoryBudgets(data.category_budgets);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Budget Monitoring"
        subtitle="Track your department budget utilization by category"
        breadcrumbs={[{ label: "Department Head" }, { label: "Budget Monitoring" }]}
      />

      {loading ? (
        <div className="p-8 text-center text-secondary/50">Loading budget data...</div>
      ) : (
        <>
          {/* Overall Budget Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Department Budget"
              value={budget ? `₱${budget.allocated.toLocaleString()}` : "N/A"}
              icon={icons.budget}
              colorScheme="primary"
              subtitle="Total allocation"
            />
            <StatCard
              title="Available Budget"
              value={budget ? `₱${budget.available.toLocaleString()}` : "N/A"}
              icon={icons.available}
              colorScheme="accent"
              subtitle="Ready to use"
            />
            <StatCard
              title="Reserved Budget"
              value={budget ? `₱${budget.reserved.toLocaleString()}` : "N/A"}
              icon={icons.reserved}
              colorScheme="gold"
              subtitle="Pending PRs"
            />
            <StatCard
              title="Spent Budget"
              value={budget ? `₱${budget.spent.toLocaleString()}` : "N/A"}
              icon={icons.spent}
              colorScheme="blue"
              subtitle="Completed"
            />
          </div>

          {/* Category Budget Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-secondary">Category Budget Utilization</h3>
            </div>
            <div className="overflow-x-auto">
              {categoryBudgets.length === 0 ? (
                <div className="p-8 text-center text-secondary/50 text-sm">No category budgets found for this fiscal year.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                      <th className="px-6 py-3 text-left">Category</th>
                      <th className="px-6 py-3 text-left">Allocated</th>
                      <th className="px-6 py-3 text-left">Reserved</th>
                      <th className="px-6 py-3 text-left">Spent</th>
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
                          <td className="px-6 py-3">₱{cat.allocated.toLocaleString()}</td>
                          <td className="px-6 py-3 text-amber-600 font-semibold">₱{cat.reserved.toLocaleString()}</td>
                          <td className="px-6 py-3 text-blue-600 font-semibold">₱{cat.spent.toLocaleString()}</td>
                          <td className="px-6 py-3 text-emerald-600 font-semibold">₱{cat.available.toLocaleString()}</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
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
                </table>
              )}
            </div>
          </div>

          {/* Budget Utilization Chart */}
          {categoryBudgets.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-base font-bold text-secondary mb-4">Budget Utilization by Category</h3>
              <div className="space-y-4">
                {categoryBudgets.map((cat) => {
                  const utilization = cat.allocated > 0
                    ? ((cat.reserved + cat.spent) / cat.allocated) * 100
                    : 0;
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-secondary">{cat.category}</span>
                        <span className="text-sm text-secondary/60">{utilization.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-secondary/50">
                        <span>₱{cat.allocated.toLocaleString()} allocated</span>
                        <span>₱{cat.available.toLocaleString()} available</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
