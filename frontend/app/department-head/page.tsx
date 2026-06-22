"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DepartmentHeadRootPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/department-head/dashboard"); }, [router]);
  return null;
}
