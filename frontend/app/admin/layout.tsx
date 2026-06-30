"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import AppTopbar from "@/components/layout/AppTopbar";
import { adminMenuItems } from "@/lib/nav-config";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    async function syncUser() {
      try {
        const { getCurrentUser } = await import("@/services/auth.service");
        const user = await getCurrentUser();
        localStorage.setItem("user", JSON.stringify(user));

        // Block access to protected pages until password is changed
        if (user.must_change_password) {
          router.push("/change-password");
          return;
        }

        if (user.role !== "admin") {
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
      <AppSidebar menuItems={adminMenuItems} role="admin" />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar role="admin" />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
