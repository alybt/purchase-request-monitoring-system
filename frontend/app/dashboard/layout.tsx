"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

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
      } catch (err) {
        console.error("Failed to sync user session:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
      }
    }
    syncUser();
  }, [router]);

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
