"use client";

import { useState, useCallback, useEffect } from "react";
import { getAvailableFiscalYears } from "@/services/budget.service";

interface FiscalYearSelectorProps {
  value: number | "";
  onChange: (year: number | "") => void;
  monthValue?: number | null;
  onMonthChange?: (month: number | null) => void;
  windowSize?: number;
  className?: string;
  label?: string;
  allowAllYears?: boolean;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Dynamic Fiscal Year Selector — displays all fiscal years available across the database,
 * and optionally displays a Month selector immediately beside it if monthValue/onMonthChange are provided.
 * Navigation buttons shift backward/forward through the available years.
 */
export default function FiscalYearSelector({
  value,
  onChange,
  monthValue,
  onMonthChange,
  className = "",
  label,
  allowAllYears = false,
}: FiscalYearSelectorProps) {
  const [availableYears, setAvailableYears] = useState<number[]>([
    value === "" ? new Date().getFullYear() : value
  ]);

  useEffect(() => {
    let mounted = true;
    getAvailableFiscalYears()
      .then(years => {
        if (!mounted) return;
        if (years.length > 0) {
          setAvailableYears(years);
          if (value !== "" && !years.includes(value)) {
            // Auto-select the latest year if current value is not in database
            onChange(years[years.length - 1]);
          }
        } else {
          const currentYear = new Date().getFullYear();
          setAvailableYears([currentYear]);
          if (value !== "" && value !== currentYear) {
            onChange(currentYear);
          }
        }
      })
      .catch(console.error);
    return () => { mounted = false; };
  }, []); // Only fetch once on mount

  // If the parent passes a value that is not in availableYears (e.g., newly created year), add it.
  useEffect(() => {
    if (value !== "" && availableYears.length > 0 && !availableYears.includes(value)) {
      setAvailableYears(prev => [...prev, value].sort((a, b) => a - b));
    }
  }, [value, availableYears]);

  const currentIndex = value === "" ? -1 : availableYears.indexOf(value);

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
    <div className={`flex flex-wrap items-end gap-4 ${className}`}>
      <div className="flex flex-col gap-1">
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
            disabled={value === "" || currentIndex <= 0}
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
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            className="min-w-[120px] px-3.5 py-2 text-xs font-bold text-secondary bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {allowAllYears && (
              <option value="">All Fiscal Years</option>
            )}
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
            disabled={value === "" || currentIndex === -1 || currentIndex >= availableYears.length - 1}
            title={`Next fiscal year`}
            className="p-2 rounded-xl text-secondary/40 bg-slate-50 border border-slate-200 hover:text-secondary hover:bg-white transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {onMonthChange && (
        <div className="flex flex-col gap-1">
          {label && (
            <span className="text-xs font-semibold text-secondary/60">
              Month
            </span>
          )}
          <select
            value={monthValue ?? ""}
            onChange={(e) =>
              onMonthChange(e.target.value ? Number(e.target.value) : null)
            }
            className="min-w-[140px] px-3.5 py-2 text-xs font-bold text-secondary bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Months</option>
            {MONTH_NAMES.map((monthLabel, index) => (
              <option key={monthLabel} value={index + 1}>
                {monthLabel}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
