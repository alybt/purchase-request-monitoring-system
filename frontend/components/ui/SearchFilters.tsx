"use client";

interface SearchFiltersProps {
  searchValue: string;
  onSearchChange: (val: string) => void;
  filters?: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: { label: string; value: string }[];
  }[];
  placeholder?: string;
}

export default function SearchFilters({
  searchValue,
  onSearchChange,
  filters = [],
  placeholder = "Search...",
}: SearchFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
        />
      </div>

      {/* Filter Dropdowns */}
      {filters.map((filter) => (
        <select
          key={filter.label}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
        >
          <option value="">{filter.label}: All</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
