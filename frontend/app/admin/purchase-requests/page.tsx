import { redirect } from "next/navigation";

export default function PurchaseRequestsRedirect() {
  redirect("/admin/pr-management");
}
