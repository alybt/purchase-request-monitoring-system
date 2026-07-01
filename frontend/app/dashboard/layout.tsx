"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    async function syncUser() {
      try {
        const { getCurrentUser } = await import("@/services/auth.service");
        const latestUser = await getCurrentUser();
        localStorage.setItem("user", JSON.stringify(latestUser));
        setIsAuthorized(true);
      } catch (err) {
        console.error("Failed to sync user session:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
      }
    }
    syncUser();
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
