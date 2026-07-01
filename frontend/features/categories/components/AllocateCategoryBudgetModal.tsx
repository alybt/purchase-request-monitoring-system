"use client";

import { useState, useEffect } from "react";
import type { Category, DepartmentBudget, CategoryBudget } from "@/services/budget.service";
import { bulkAllocateCategoryBudget } from "@/services/budget.service";

interface AllocateCategoryBudgetModalProps {
  isOpen: boolean;
  departmentBudget: DepartmentBudget | null;
  categories: Category[];
  existingAllocations: CategoryBudget[];
  onClose: () => void;
  onSaved: () => void;
}

export function AllocateCategoryBudgetModal({ isOpen, departmentBudget, categories, existingAllocations, onClose, onSaved }: AllocateCategoryBudgetModalProps) {
  const [allocations, setAllocations] = useState<Record<number, string>>({});
  const [shares, setShares] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const safeNum = (val: any) => {
    if (val === null || val === undefined || val === "") return 0;
    const num = Number(String(val).replace(/,/g, ""));
    return Number.isFinite(num) ? num : 0;
  };

  useEffect(() => {
    if (!isOpen) return;
    setError("");

    const totalDeptBudget = departmentBudget ? safeNum(departmentBudget.allocated) : 0;
    const initialAlloc: Record<number, string> = {};
    const initialShare: Record<number, string> = {};

    categories.forEach((c) => {
      const existing = existingAllocations.find((ex) => ex.category_id === c.id);
      if (existing) {
        initialAlloc[c.id] = String(existing.allocated);
        if (totalDeptBudget > 0) {
          initialShare[c.id] = ((existing.allocated / totalDeptBudget) * 100).toFixed(2);
        } else {
          initialShare[c.id] = "";
        }
      } else {
        initialAlloc[c.id] = "";
        initialShare[c.id] = "";
      }
    });

    setAllocations(initialAlloc);
    setShares(initialShare);
  }, [isOpen, departmentBudget, categories, existingAllocations]);

  if (!isOpen) return null;

  const totalDeptBudget = departmentBudget ? safeNum(departmentBudget.allocated) : 0;
  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + safeNum(val), 0);
  const remainingDeptBudget = totalDeptBudget - totalAllocated;
  const totalShareAllocated = totalDeptBudget > 0 ? (totalAllocated / totalDeptBudget) * 100 : 0;

  const handleAllocationChange = (id: number, val: string) => {
    const rawVal = val.replace(/[^0-9.,]/g, "");
    setAllocations(prev => ({ ...prev, [id]: rawVal }));
    const num = safeNum(rawVal);
    if (totalDeptBudget > 0) {
      setShares(prev => ({ ...prev, [id]: ((num / totalDeptBudget) * 100).toFixed(2) }));
    }
  };

  const handleShareChange = (id: number, val: string) => {
    const rawVal = val.replace(/[^0-9.,]/g, "");
    setShares(prev => ({ ...prev, [id]: rawVal }));
    const shareNum = safeNum(rawVal);
    if (totalDeptBudget > 0) {
      setAllocations(prev => ({ ...prev, [id]: ((shareNum / 100) * totalDeptBudget).toFixed(2) }));
    }
  };

  const handleSave = async () => {
    setError("");
    if (!departmentBudget) {
      setError("Cannot allocate without a department budget for this fiscal year.");
      return;
    }
    if (remainingDeptBudget < 0) {
      setError("Total category allocations exceed the department budget limit.");
      return;
    }

    const payloadAllocations = Object.keys(allocations)
      .map((id) => {
        const rawVal = safeNum(allocations[Number(id)]);
        return {
          category_id: Number(id),
          allocated_amount: rawVal,
        };
      })
      .filter((a) => a.allocated_amount > 0 || existingAllocations.some((ex) => ex.category_id === a.category_id)); // Include if > 0 or already exists to allow zeroing

    setSaving(true);
    try {
      await bulkAllocateCategoryBudget(departmentBudget.fiscal_year, payloadAllocations);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to allocate category budget.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-secondary">Allocate Category Budget</h2>
            <p className="text-sm text-slate-500 mt-1">
              Fiscal Year: {departmentBudget?.fiscal_year || "N/A"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex gap-2">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Department Budget</p>
              <p className="text-xl font-bold text-primary">₱{totalDeptBudget.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Allocated</p>
              <p className={`text-xl font-bold ${totalAllocated > totalDeptBudget ? "text-red-600" : "text-emerald-600"}`}>
                ₱{totalAllocated.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Remaining Budget</p>
              <p className={`text-xl font-bold ${remainingDeptBudget < 0 ? "text-red-600" : "text-secondary"}`}>
                ₱{remainingDeptBudget.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-500 font-semibold text-xs uppercase tracking-wider text-left">
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 w-48">Allocation (₱)</th>
                  <th className="px-6 py-4 w-32">Share (%)</th>
                  <th className="px-6 py-4 w-48 text-right">Remaining (₱)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((c) => {
                  const allocAmount = safeNum(allocations[c.id]);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-semibold text-secondary">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.code}</p>
                      </td>
                      <td className="px-6 py-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₱</span>
                          <input
                            type="text"
                            value={allocations[c.id] || ""}
                            onChange={(e) => handleAllocationChange(c.id, e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-secondary"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="relative">
                          <input
                            type="text"
                            value={shares[c.id] || ""}
                            onChange={(e) => handleShareChange(c.id, e.target.value)}
                            placeholder="0.00"
                            className="w-full pr-8 pl-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-secondary"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="font-medium text-slate-600">₱{allocAmount.toLocaleString()}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td className="px-6 py-4 font-bold text-secondary">Totals</td>
                  <td className="px-6 py-4 font-bold text-secondary">₱{totalAllocated.toLocaleString()}</td>
                  <td className="px-6 py-4 font-bold text-secondary">{totalShareAllocated.toFixed(2)}%</td>
                  <td className="px-6 py-4 font-bold text-secondary text-right">
                    <span className={remainingDeptBudget < 0 ? "text-red-600" : "text-emerald-600"}>
                      ₱{remainingDeptBudget.toLocaleString()}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || remainingDeptBudget < 0}
            className="px-6 py-2.5 text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Saving...
              </>
            ) : (
              "Save Allocations"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
