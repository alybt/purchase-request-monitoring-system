"use client";

import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  colorScheme?: "primary" | "gold" | "accent" | "red" | "blue" | "purple" | "emerald";
  trend?: { value: number; label: string };
}

const schemes = {
  primary: {
    bg: "bg-primary/5 border-primary/20 hover:border-primary/40",
    iconBg: "bg-primary/10 border-primary/20 text-primary",
    label: "text-primary/80",
    trend: "text-primary",
  },
  gold: {
    bg: "bg-gold/5 border-gold/30 hover:border-gold/50",
    iconBg: "bg-gold/10 border-gold/20 text-gold",
    label: "text-gold",
    trend: "text-gold",
  },
  accent: {
    bg: "bg-accent/5 border-accent/30 hover:border-accent/50",
    iconBg: "bg-accent/20 border-accent/40 text-secondary",
    label: "text-secondary/70",
    trend: "text-accent",
  },
  red: {
    bg: "bg-red-50 border-red-200 hover:border-red-300",
    iconBg: "bg-red-100 border-red-200 text-red-600",
    label: "text-red-600",
    trend: "text-red-500",
  },
  blue: {
    bg: "bg-blue-50 border-blue-200 hover:border-blue-300",
    iconBg: "bg-blue-100 border-blue-200 text-blue-600",
    label: "text-blue-600",
    trend: "text-blue-500",
  },
  purple: {
    bg: "bg-purple-50 border-purple-200 hover:border-purple-300",
    iconBg: "bg-purple-100 border-purple-200 text-purple-600",
    label: "text-purple-600",
    trend: "text-purple-500",
  },
  emerald: {
    bg: "bg-emerald-50 border-emerald-200 hover:border-emerald-300",
    iconBg: "bg-emerald-100 border-emerald-200 text-emerald-600",
    label: "text-emerald-700",
    trend: "text-emerald-600",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  colorScheme = "primary",
  trend,
}: StatCardProps) {
  const s = schemes[colorScheme];
  return (
    <div
      className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${s.bg}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-xs font-bold tracking-wide uppercase ${s.label}`}>
          {title}
        </h2>
        <div className={`p-2 border rounded-lg ${s.iconBg}`}>{icon}</div>
      </div>
      <div>
        <p className="text-3xl font-bold text-secondary">{value}</p>
        {trend && (
          <p className={`text-xs font-semibold mt-1 ${s.trend}`}>
            {trend.value >= 0 ? "+" : ""}
            {trend.value}% {trend.label}
          </p>
        )}
        {subtitle && !trend && (
          <p className="text-xs text-secondary/60 font-medium mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
