"use client";

import { useState, useEffect } from "react";

interface Department {
  id: number;
  name: string;
  code: string;
  budget_allocation: number;
  has_allocation: boolean;
  reserved_budget: number;
  spent_budget: number;
}

interface CompanyBudget {
  fiscal_year: number;
  total_budget: number;
  carry_forward: number;
  allocated_amount: number;
}

interface AllocateBudgetModalProps {
  isOpen: boolean;
  fiscalYear: number;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}

const API_URL = "http://127.0.0.1:8000/api";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function AllocateBudgetModal({ isOpen, fiscalYear, departments, onClose, onSaved }: AllocateBudgetModalProps) {
  const [allocations, setAllocations] = useState<Record<number, string>>({});
  const [shares, setShares] = useState<Record<number, string>>({});
  const [companyBudget, setCompanyBudget] = useState<CompanyBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const safeNum = (val: any) => {
    if (val === null || val === undefined || val === "") return 0;
    const num = Number(String(val).replace(/,/g, ""));
    return Number.isFinite(num) ? num : 0;
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError("");

    // Fetch company budget for the selected fiscal year
    fetch(`${API_URL}/company-budget/${fiscalYear}`, { headers: getHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error("Company budget not found for this year.");
        return res.json();
      })
      .then((data) => {
        const budgetObj = data.budget || data;
        setCompanyBudget(budgetObj);
        const tcb = safeNum(budgetObj.total_budget) + safeNum(budgetObj.carry_forward);
        const initialAlloc: Record<number, string> = {};
        const initialShare: Record<number, string> = {};
        departments.forEach((d) => {
          initialAlloc[d.id] = d.has_allocation ? String(d.budget_allocation) : "";
          if (d.has_allocation && tcb > 0) {
            initialShare[d.id] = ((d.budget_allocation / tcb) * 100).toFixed(2);
          } else {
            initialShare[d.id] = "";
          }
        });
        setAllocations(initialAlloc);
        setShares(initialShare);
      })
      .catch((err) => {
        setError(err.message || "Failed to load company budget.");
        setCompanyBudget(null);
      })
      .finally(() => setLoading(false));
  }, [isOpen, fiscalYear, departments]);

  if (!isOpen) return null;

  const totalCompanyBudget = companyBudget ? safeNum(companyBudget.total_budget) + safeNum(companyBudget.carry_forward) : 0;
  
  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + safeNum(val), 0);

  const remainingCompanyBudget = totalCompanyBudget - totalAllocated;
  const totalShareAllocated = totalCompanyBudget > 0 ? (totalAllocated / totalCompanyBudget) * 100 : 0;

  const handleAllocationChange = (id: number, val: string) => {
    const rawVal = val.replace(/[^0-9.,]/g, "");
    setAllocations(prev => ({ ...prev, [id]: rawVal }));
    const num = safeNum(rawVal);
    if (totalCompanyBudget > 0) {
      setShares(prev => ({ ...prev, [id]: ((num / totalCompanyBudget) * 100).toFixed(2) }));
    }
  };

  const handleShareChange = (id: number, val: string) => {
    const rawVal = val.replace(/[^0-9.,]/g, "");
    setShares(prev => ({ ...prev, [id]: rawVal }));
    const shareNum = safeNum(rawVal);
    if (totalCompanyBudget > 0) {
      setAllocations(prev => ({ ...prev, [id]: ((shareNum / 100) * totalCompanyBudget).toFixed(2) }));
    }
  };

  const handleSave = async () => {
    setError("");
    if (!companyBudget) {
      setError("Cannot allocate without a company budget.");
      return;
    }
    if (remainingCompanyBudget < 0) {
      setError("Total department allocations exceed the company budget limit.");
      return;
    }

    const payload = {
      fiscal_year: fiscalYear,
      allocations: Object.keys(allocations).map((id) => {
        const rawVal = safeNum(allocations[Number(id)]);
        return {
          department_id: Number(id),
          allocated_amount: rawVal,
        };
      }),
    };

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/departments/budget/allocate`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to allocate budget.");
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 shrink-0">
          <h2 className="text-lg font-bold text-secondary">
            Allocate Budget - FY {fiscalYear}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-secondary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-secondary/50 py-8">Loading data...</div>
          ) : !companyBudget ? (
            <div className="text-center text-amber-600 py-8 bg-amber-50 rounded-xl border border-amber-200">
              <p className="font-bold">No Company Budget Found</p>
              <p className="text-sm mt-1">Please create a company budget for FY {fiscalYear} before allocating.</p>
            </div>
          ) : (
            <>
              {/* Department Allocations List */}
              <div className="overflow-x-auto">
                <h3 className="text-sm font-bold text-secondary mb-3">Department Allocations</h3>
                {departments.length === 0 ? (
                  <p className="text-sm text-secondary/50 text-center py-4">No active departments found.</p>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold">
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3 w-48">Allocation (₱)</th>
                        <th className="px-4 py-3 w-32">Share (%)</th>
                        <th className="px-4 py-3 text-right">Remaining Budget</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {departments.map((dept) => {
                        const allocationAmount = safeNum(allocations[dept.id]);
                        const remainingDeptBudget = allocationAmount - safeNum(dept.reserved_budget) - safeNum(dept.spent_budget);

                        return (
                          <tr key={dept.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <p className="font-bold text-secondary text-sm">{dept.name}</p>
                              <p className="text-xs text-secondary/50">{dept.code}</p>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={allocations[dept.id] || ""}
                                onChange={(e) => handleAllocationChange(dept.id, e.target.value)}
                                onBlur={(e) => {
                                  const val = e.target.value;
                                  if (val !== "") {
                                    setAllocations(prev => ({ ...prev, [dept.id]: safeNum(val).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) }));
                                  }
                                }}
                                className="w-full px-3 py-2 text-sm font-bold text-secondary bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-right"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={shares[dept.id] || ""}
                                  onChange={(e) => handleShareChange(dept.id, e.target.value)}
                                  onBlur={(e) => {
                                    const val = e.target.value;
                                    if (val !== "") {
                                      setShares(prev => ({ ...prev, [dept.id]: safeNum(val).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) }));
                                    }
                                  }}
                                  className="w-full pl-2 pr-7 py-2 text-sm font-bold text-secondary bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-right"
                                  placeholder="0.00"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/50 font-bold text-sm">%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              <span className={remainingDeptBudget < 0 ? "text-red-600" : "text-emerald-600"}>
                                {remainingDeptBudget < 0 ? "-" : ""}₱{Math.abs(remainingDeptBudget).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Computation Summary */}
              {departments.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 font-mono text-sm text-secondary/80 mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span>Total Company Budget :</span>
                    <span className="font-bold">₱{safeNum(totalCompanyBudget).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Total Allocated :</span>
                    <span className="font-bold">₱{safeNum(totalAllocated).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Remaining Budget :</span>
                    <span className="font-bold">₱{safeNum(remainingCompanyBudget).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200 border-dashed">
                    <span>Total Share :</span>
                    <span className="font-bold">{safeNum(totalShareAllocated).toFixed(2)}%</span>
                  </div>

                  {remainingCompanyBudget < 0 && (
                    <div className="flex justify-between items-center pt-4 text-red-600 font-bold">
                      <span>Over Budget :</span>
                      <span>₱{Math.abs(remainingCompanyBudget).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-bold text-secondary hover:bg-slate-200 bg-white border border-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !companyBudget || remainingCompanyBudget < 0}
            className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
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
