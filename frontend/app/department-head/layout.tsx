"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import AppTopbar from "@/components/layout/AppTopbar";
import { departmentHeadMenuItems } from "@/lib/nav-config";

export default function DepartmentHeadLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

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

        if (user.role !== "department_head") {
          router.push("/login");
          return;
        }

        setIsAuthorized(true);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
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
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <AppSidebar menuItems={departmentHeadMenuItems} role="department_head" />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar role="department_head" />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
