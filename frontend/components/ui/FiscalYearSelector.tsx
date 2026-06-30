"use client";

import { useState, useCallback, useEffect } from "react";
import { getAllCompanyBudgets } from "@/services/budget.service";

interface FiscalYearSelectorProps {
  value: number;
  onChange: (year: number) => void;
  windowSize?: number;
  className?: string;
  label?: string;
}

/**
 * Dynamic Fiscal Year Selector — displays only fiscal years that exist in the database.
 * Navigation buttons shift backward/forward through the available years.
 */
export default function FiscalYearSelector({
  value,
  onChange,
  className = "",
  label,
}: FiscalYearSelectorProps) {
  const [availableYears, setAvailableYears] = useState<number[]>([value]);

  useEffect(() => {
    let mounted = true;
    getAllCompanyBudgets()
      .then(budgets => {
        if (!mounted) return;
        const years = budgets.map(b => b.fiscal_year).sort((a, b) => a - b);
        if (years.length > 0) {
          setAvailableYears(years);
          if (!years.includes(value)) {
            // Auto-select the latest year if the current value is not in the database
            onChange(years[years.length - 1]);
          }
        } else {
          setAvailableYears([new Date().getFullYear()]);
          if (value !== new Date().getFullYear()) {
            onChange(new Date().getFullYear());
          }
        }
      })
      .catch(console.error);
    return () => { mounted = false; };
  }, []); // Only fetch once on mount

  const currentIndex = availableYears.indexOf(value);

  const shiftBack = useCallback(() => {
    if (currentIndex > 0) {
      onChange(availableYears[currentIndex - 1]);
    }
  }, [currentIndex, availableYears, onChange]);

  const shiftForward = useCallback(() => {
    if (currentIndex !== -1 && currentIndex < availableYears.length - 1) {
      onChange(availableYears[currentIndex + 1]);
    }
  }, [currentIndex, availableYears, onChange]);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <span className="text-xs font-semibold text-secondary/60">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1">
        {/* Previous window button */}
        <button
          type="button"
          onClick={shiftBack}
          disabled={currentIndex <= 0}
          title={`Previous fiscal year`}
          className="p-2 rounded-xl text-secondary/40 bg-slate-50 border border-slate-200 hover:text-secondary hover:bg-white transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Year Dropdown */}
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 px-3.5 py-2 text-xs font-bold text-secondary bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              FY {year}
            </option>
          ))}
        </select>

        {/* Next window button */}
        <button
          type="button"
          onClick={shiftForward}
          disabled={currentIndex === -1 || currentIndex >= availableYears.length - 1}
          title={`Next fiscal year`}
          className="p-2 rounded-xl text-secondary/40 bg-slate-50 border border-slate-200 hover:text-secondary hover:bg-white transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
