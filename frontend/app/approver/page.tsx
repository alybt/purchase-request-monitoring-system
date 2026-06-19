"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ApproverRootPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/approver/dashboard"); }, [router]);
  return null;
}
