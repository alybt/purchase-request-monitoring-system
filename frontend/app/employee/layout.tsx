"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import AppTopbar from "@/components/layout/AppTopbar";
import { employeeMenuItems } from "@/lib/nav-config";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    async function syncUser() {
      try {
        const { getCurrentUser } = await import("@/services/auth.service");
        const user = await getCurrentUser();
        localStorage.setItem("user", JSON.stringify(user));
        if (!["employee", "admin"].includes(user.role)) {
          router.push("/login");
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      }
    }
    syncUser();
  }, [router]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <AppSidebar menuItems={employeeMenuItems} role="employee" />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar role="employee" />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
