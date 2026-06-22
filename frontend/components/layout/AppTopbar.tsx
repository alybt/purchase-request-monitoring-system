"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUserDisplayName, getStoredUser, StoredUser } from "@/lib/auth-utils";

interface AppTopbarProps {
  pageTitle?: string;
  role?: "admin" | "department_head";
}

const notifications = [
  { id: "n1", text: "PR-2026-001 is awaiting your approval", time: "5m ago", unread: true },
  { id: "n2", text: "PR-2026-004 has been completed", time: "1h ago", unread: true },
  { id: "n3", text: "New user Ana Reyes registered", time: "3h ago", unread: false },
];

export default function AppTopbar({ pageTitle, role }: AppTopbarProps) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const displayName = getUserDisplayName(user);
  const initial = displayName.charAt(0).toUpperCase();
  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleLogout = async () => {
    try {
      const { logout } = await import("@/services/auth.service");
      await logout();
    } catch { /* swallow */ }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Build breadcrumbs from pathname
  const segments = pathname?.split("/").filter(Boolean) ?? [];
  const breadcrumbs = segments.map((seg, i) => ({
    label: seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Left: breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-secondary/50 font-medium overflow-hidden">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-secondary/30">/</span>}
              <span className={i === breadcrumbs.length - 1 ? "text-secondary font-semibold" : "hover:text-primary cursor-pointer"}
                onClick={() => i < breadcrumbs.length - 1 && router.push(crumb.href)}>
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              className="relative p-2 text-secondary/60 hover:text-secondary hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-secondary">Notifications</p>
                </div>
                <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id} className={`px-4 py-3 hover:bg-slate-50 cursor-pointer ${n.unread ? "bg-primary/5" : ""}`}>
                      <p className="text-sm text-secondary">{n.text}</p>
                      <p className="text-xs text-secondary/50 mt-0.5">{n.time}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-secondary leading-tight">{displayName}</p>
                <p className="text-xs text-secondary/50 capitalize">{role ?? user?.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{initial}</span>
              </div>
              <svg className="w-4 h-4 text-secondary/40 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-secondary truncate">{displayName}</p>
                  <p className="text-xs text-secondary/50 capitalize">{role ?? user?.role}</p>
                </div>
                {role === "department_head" && (
                  <button
                    onClick={() => router.push("/department-head/profile")}
                    className="w-full text-left px-4 py-2.5 text-sm text-secondary hover:bg-slate-50 transition-colors"
                  >
                    My Profile
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click-outside overlay */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowUserMenu(false); setShowNotifications(false); }}
        />
      )}
    </header>
  );
}
