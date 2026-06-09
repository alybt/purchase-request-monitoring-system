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
    <header className="bg-[#1a251f] border-b border-[#2b3c33] sticky top-0 z-50 shadow-sm">
      <div
        className={`w-full py-3 ${
          user ? "px-4 lg:px-10" : "px-4 sm:px-6 lg:px-25"
        }`}
      >
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            {user && (
              <button className="text-gray-400 hover:text-white focus:outline-none lg:hidden">
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
              <div className="w-8 h-8 rounded bg-[#3b825e] flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">PR</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                System<span className="text-[#e0a843]">.</span>
              </span>
            </Link>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right mr-2">
                <p className="text-sm font-medium text-white">
                  {user.name || "Administrator"}
                </p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>

              <div className="h-9 w-9 rounded-full bg-[#0f1512] flex items-center justify-center border border-[#2b3c33] hover:border-[#5db68d] cursor-pointer transition-all">
                <span className="text-sm font-bold text-[#5db68d]">
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
