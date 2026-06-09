"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Flag to prevent hydration mismatches between server and client
    setIsMounted(true);
    
    // Check local storage for the logged-in user
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }
  }, []);

  // Wait until mounted on the client to render
  if (!isMounted) return null; 

  const getInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U"; // Default initial
  };

  return (
    <header className="bg-gray-900 border-b-4 border-yellow-500 sticky top-0 z-50 shadow-md">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Side: Mobile Menu (Auth-only) & Logo */}
          <div className="flex items-center gap-4">
            {user && (
              <button className="text-gray-400 hover:text-white focus:outline-none lg:hidden">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            <Link href={user ? "/dashboard" : "/"} className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-sm">
                <span className="text-gray-900 font-bold text-sm">PR</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                System<span className="text-yellow-500">.</span>
              </span>
            </Link>
          </div>

          {/* Right Side: Auth-Based Profile (Only renders if user exists) */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right mr-2">
                <p className="text-sm font-medium text-white">{user.name || "Administrator"}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              
              <div className="h-9 w-9 rounded-full bg-gray-800 flex items-center justify-center border border-gray-600 hover:border-yellow-500 cursor-pointer transition-all">
                <span className="text-sm font-bold text-white">{getInitial()}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}