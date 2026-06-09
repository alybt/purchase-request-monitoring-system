"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(
    null,
  );
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }
  }, []);

  if (!isMounted) return null;

  const getInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <header 
      className={`border-b sticky top-0 z-50 shadow-sm transition-colors duration-300 ${
        user ? "bg-white border-slate-200" : "bg-[#1a251f] border-[#2b3c33]"
      }`}
    >
      <div
        className={`w-full py-3 ${
          user ? "px-4 lg:px-10" : "px-4 sm:px-6 lg:px-25"
        }`}
      >
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            {user && (
              <button className="text-slate-500 hover:text-slate-900 focus:outline-none lg:hidden">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}

            <Link
              href={user ? "/dashboard" : "/"}
              className="flex-shrink-0 flex items-center gap-3"
            >
              {/* Logo block remains the primary green in both themes for brand consistency */}
              <div className="w-8 h-8 rounded bg-[#3b825e] flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">PR</span>
              </div>
              
              {/* Text color changes based on auth state */}
              <span className={`font-bold text-xl tracking-tight ${user ? "text-slate-900" : "text-white"}`}>
                System<span className="text-[#e0a843]">.</span>
              </span>
            </Link>
          </div>

          {/* User profile section (Only renders in light mode when logged in) */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right mr-2">
                <p className="text-sm font-bold text-slate-900">
                  {user.name || "Administrator"}
                </p>
                <p className="text-xs text-slate-500 font-medium">{user.email}</p>
              </div>

              {/* Light theme avatar using soft green and primary text */}
              <div className="h-10 w-10 rounded-full bg-[#f0f9f4] flex items-center justify-center border border-[#5db68d]/30 hover:border-[#5db68d] cursor-pointer transition-all">
                <span className="text-sm font-bold text-[#3b825e]">
                  {getInitial()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}