"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export interface SidebarMenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  menuItems: SidebarMenuItem[];
  role: "admin" | "department_head";
}

const roleTitles = {
  admin: "Admin Panel",
  department_head: "Department Head",
};

const roleColors = {
  admin: { dot: "bg-purple-400", label: "text-purple-300" },
  department_head: { dot: "bg-emerald-400", label: "text-emerald-300" },
};

export default function AppSidebar({ menuItems, role }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const pathname = usePathname();
  const router = useRouter();
  const colors = roleColors[role];

  const handleLogout = async () => {
    try {
      const { logout } = await import("@/services/auth.service");
      await logout();
    } catch {
      // swallow
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-[#1a251f] h-screen border-r border-[#2b3c33] transition-all duration-300 ease-in-out flex flex-col z-40 relative shrink-0 ${
        isHovered ? "w-64" : "w-20"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#2b3c33] shrink-0 overflow-hidden">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-md shrink-0">
          <span className="text-white font-bold text-sm">PR</span>
        </div>
        <div className={`transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
          <p className="text-white font-bold text-sm whitespace-nowrap">
            System<span className="text-gold">.</span>
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            <span className={`text-xs font-medium ${colors.label} whitespace-nowrap`}>
              {mounted && role === "department_head" && localStorage.getItem("user")
                ? `${JSON.parse(localStorage.getItem("user") || "{}").department?.name || "Information Technology"} Head` 
                : roleTitles[role]}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col flex-1 py-4 px-3 space-y-1 overflow-hidden">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (pathname?.startsWith(item.href + "/") && item.href !== `/${role}/dashboard`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap group relative ${
                isActive
                  ? "bg-[#0f1512] text-[#5db68d] border-l-2 border-[#5db68d]"
                  : "text-gray-400 hover:bg-[#0f1512] hover:text-[#e2e8f0]"
              }`}
            >
              <span className="w-6 h-6 flex-shrink-0">{item.icon}</span>
              <span
                className={`font-medium text-sm transition-opacity duration-200 ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                {item.name}
              </span>
              {item.badge && item.badge > 0 && (
                <span
                  className={`ml-auto shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full bg-gold text-[#1a251f] transition-opacity duration-200 ${
                    isHovered ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-[#2b3c33] pt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/10 hover:text-red-300 transition-colors whitespace-nowrap focus:outline-none"
        >
          <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className={`font-medium text-sm transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}
