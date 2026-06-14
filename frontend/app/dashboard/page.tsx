"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getDashboardMetrics,
  getRecentPRs,
  DashboardMetrics,
  RecentPR,
} from "@/services/dashboard.service";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentPrs, setRecentPrs] = useState<RecentPR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [fetchedMetrics, fetchedRecentPRs] = await Promise.all([
          getDashboardMetrics(),
          getRecentPRs(),
        ]);
        setMetrics(fetchedMetrics);
        setRecentPrs(fetchedRecentPRs);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "request":
        return "bg-yellow-100 text-yellow-800";
      case "approve":
        return "bg-green-100 text-green-800";
      case "released":
        return "bg-blue-100 text-blue-800";
      case "received":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    if (status.toLowerCase() === "request") return "Pending";
    if (status.toLowerCase() === "approve") return "Approved";
    return status;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-primary mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-slate-400 font-semibold">Loading system metrics & pipeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50 p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50 p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary">Admin Overview</h1>
        <p className="text-secondary/70 text-sm mt-1">Global System Status & Key Metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Spent Card - Primary Color Theme */}
        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-primary/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-primary/80 tracking-wide uppercase">Total Spent</h2>
            <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-secondary">
              ₱{metrics?.total_spent ? metrics.total_spent.toLocaleString() : "0.00"}
            </p>
            <p className="text-xs text-primary font-semibold mt-2">
              {metrics?.total_spent_change_percentage && metrics.total_spent_change_percentage >= 0 ? "+" : ""}
              {metrics?.total_spent_change_percentage}% from last month
            </p>
          </div>
        </div>

        {/* Bottlenecks Pipeline Card - Gold Color Theme */}
        <div className="bg-gold/5 p-6 rounded-2xl border border-gold/30 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-gold/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gold tracking-wide uppercase">PR Bottlenecks</h2>
            <div className="p-2 bg-gold/10 text-gold border border-gold/20 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-secondary">{metrics?.bottlenecks || 0}</p>
            <p className="text-xs text-gold font-semibold mt-2">Pending over 48 hours</p>
          </div>
        </div>

        {/* Active Users Card - Accent Color Theme */}
        <div className="bg-accent/5 p-6 rounded-2xl border border-accent/30 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-accent/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-secondary/70 tracking-wide uppercase">Active Users</h2>
            <div className="p-2 bg-accent/20 text-secondary border border-accent/40 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-secondary">{metrics?.active_users || 0}</p>
            <p className="text-xs text-secondary/60 font-medium mt-2">Currently active in system</p>
          </div>
        </div>
      </div>

      {/* Pipeline Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-secondary">Recent Approval Pipeline</h3>
          <Link
            href="/dashboard/purchase-requests"
            className="text-sm font-semibold text-primary hover:text-secondary transition-colors"
          >
            View All
          </Link>
        </div>

        {recentPrs.length === 0 ? (
          <div className="h-48 flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
            <span className="text-sm text-slate-400 font-medium">No purchase requests in pipeline.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">PR Number</th>
                  <th className="px-6 py-4">Requested By</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Purpose</th>
                  <th className="px-6 py-4">Total Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm text-secondary">
                {recentPrs.map((pr) => (
                  <tr key={pr.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary">{pr.pr_number}</td>
                    <td className="px-6 py-4">
                      {pr.user ? `${pr.user.first_name} ${pr.user.last_name}` : "Unknown"}
                    </td>
                    <td className="px-6 py-4">{pr.user?.department || "General"}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{pr.purpose_of_requests}</td>
                    <td className="px-6 py-4 font-semibold">
                      ₱{parseFloat(pr.total_estimated_cost).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(pr.status)}`}>
                        {formatStatus(pr.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {pr.created_at ? pr.created_at.split("T")[0] : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}