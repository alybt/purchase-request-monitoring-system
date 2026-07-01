"use client";

interface MonthSelectorProps {
  value: number | null;
  onChange: (month: number | null) => void;
  className?: string;
  label?: string;
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

export default function MonthSelector({
  value,
  onChange,
  className = "",
  label,
}: MonthSelectorProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <span className="text-xs font-semibold text-secondary/60">{label}</span>
      )}
      <select
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
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
  );
}
