"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import ApprovalTimeline from "@/components/ui/ApprovalTimeline";
import { getPurchaseRequestDetails } from "@/services/purchase-requests.service";
import type { PRData } from "@/services/purchase-requests.service";

export default function EmployeePRDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [pr, setPr] = useState<PRData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPR();
    }
  }, [id]);

  const fetchPR = async () => {
    setLoading(true);
    try {
      const data = await getPurchaseRequestDetails(id);
      setPr(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-secondary/50">Loading purchase request details...</div>;
  }

  if (!pr) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-semibold">Purchase request not found.</p>
          <Link href="/employee/purchase-requests" className="text-primary text-sm mt-2 inline-block hover:underline">
            ← Back to My Requests
          </Link>
        </div>
      </div>
    );
  }

  // Convert backend approvals into the format expected by ApprovalTimeline if possible
  const approvalTimeline = pr.approvals?.map((app: any) => ({
    id: app.id,
    date: app.action_date ? app.action_date.split("T")[0] : "",
    action: app.status.toLowerCase(),
    actor: app.approver ? `${app.approver.first_name} ${app.approver.last_name}` : "Unknown",
    role: "Approver",
    remarks: app.comments || "",
  })) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={pr.prNumber}
        subtitle={`Submitted ${pr.dateRequested}`}
        breadcrumbs={[
          { label: "Employee" },
          { label: "My Requests", href: "/employee/purchase-requests" },
          { label: pr.prNumber },
        ]}
        actions={<StatusBadge status={pr.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-secondary mb-4">Request Information</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs font-semibold text-secondary/50 uppercase mb-1">PR Number</dt>
                <dd className="font-bold text-primary">{pr.prNumber}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-secondary/50 uppercase mb-1">Status</dt>
                <dd><StatusBadge status={pr.status} /></dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-secondary/50 uppercase mb-1">Department</dt>
                <dd className="text-secondary">{pr.department}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-secondary/50 uppercase mb-1">Due Date</dt>
                <dd className="text-secondary">{pr.dueDate}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-semibold text-secondary/50 uppercase mb-1">Purpose</dt>
                <dd className="text-secondary">{pr.description}</dd>
              </div>
              {pr.notes && (
                <div className="col-span-2">
                  <dt className="text-xs font-semibold text-secondary/50 uppercase mb-1">Notes</dt>
                  <dd className="text-secondary/70 italic">{pr.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-secondary mb-4">Requested Items</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-secondary/50 uppercase font-semibold">
                  <th className="pb-2 text-left">Item</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Unit Cost</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pr.lineItems?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5">
                      <p className="font-medium text-secondary">{item.item_name}</p>
                      <p className="text-xs text-secondary/50">{item.description}</p>
                    </td>
                    <td className="py-2.5 text-center text-secondary">{item.quantity}</td>
                    <td className="py-2.5 text-right text-secondary">₱{Number(item.unit_price).toLocaleString()}</td>
                    <td className="py-2.5 text-right font-semibold text-secondary">₱{(Number(item.quantity) * Number(item.unit_price)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td colSpan={3} className="pt-3 text-right font-bold text-secondary">Total:</td>
                  <td className="pt-3 text-right font-extrabold text-primary">₱{pr.amount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Sidebar: Status + Timeline */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-secondary mb-3">Current Status</h3>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${pr.status === "approved" ? "bg-emerald-500" : pr.status === "rejected" ? "bg-red-500" : pr.status === "completed" ? "bg-blue-500" : "bg-amber-500"}`} />
              <div>
                <p className="text-sm font-bold text-secondary capitalize">{pr.status}</p>
                <p className="text-xs text-secondary/50">
                  {pr.status === "pending"
                    ? `Awaiting approval`
                    : pr.status === "approved"
                    ? "Your request has been approved"
                    : pr.status === "rejected"
                    ? "Your request was declined"
                    : "Request completed"}
                </p>
              </div>
            </div>

            {pr.status === "rejected" && approvalTimeline.some((e: any) => e.action === "reject") && (
              <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason</p>
                <p className="text-xs text-red-500/80 italic">
                  {approvalTimeline.find((e: any) => e.action === "reject")?.remarks}
                </p>
              </div>
            )}
          </div>

          {approvalTimeline.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-base font-bold text-secondary mb-4">Approval Timeline</h3>
              <ApprovalTimeline events={approvalTimeline} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
