"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import ApprovalTimeline from "@/components/ui/ApprovalTimeline";
import { getPurchaseRequestDetails, approvePurchaseRequest, rejectPurchaseRequest } from "@/services/purchase-requests.service";
import type { PRData } from "@/services/purchase-requests.service";

type ActionType = "approve" | "reject" | "return" | null;

export default function ApproverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pr, setPr] = useState<PRData | null>(null);
  const [loading, setLoading] = useState(true);

  const [action, setAction] = useState<ActionType>(null);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
          <Link href="/approver/pending" className="text-primary text-sm mt-2 inline-block hover:underline">
            ← Back to Pending Approvals
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${action === "approve" ? "bg-emerald-100" : action === "reject" ? "bg-red-100" : "bg-orange-100"}`}>
            <svg className={`w-8 h-8 ${action === "approve" ? "text-emerald-600" : action === "reject" ? "text-red-600" : "text-orange-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action === "approve" ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-secondary mb-2">
            {action === "approve" ? "Request Approved!" : action === "reject" ? "Request Rejected" : "Request Returned"}
          </h2>
          <p className="text-secondary/60 text-sm mb-6">
            {pr.prNumber} has been {action === "approve" ? "approved and forwarded" : action === "reject" ? "rejected" : "returned to the requestor"}.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/approver/pending" className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              Back to Queue
            </Link>
            <Link href="/approver/history" className="border border-slate-200 text-secondary px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
              View History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if ((action === "reject" || action === "return") && !reason.trim()) return;
    
    try {
      if (action === "approve") {
        await approvePurchaseRequest(pr.id, reason);
      } else if (action === "reject") {
        await rejectPurchaseRequest(pr.id, reason);
      }
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
  };

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
        title={`Review: ${pr.prNumber}`}
        subtitle={`Submitted by ${pr.requestedBy} · ${pr.department}`}
        breadcrumbs={[
          { label: "Approver" },
          { label: "Pending Approvals", href: "/approver/pending" },
          { label: pr.prNumber },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Information */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-secondary mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Request Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-secondary/50 uppercase mb-1">PR Number</p>
                <p className="font-bold text-primary">{pr.prNumber}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-secondary/50 uppercase mb-1">Status</p>
                <StatusBadge status={pr.status} />
              </div>
              <div>
                <p className="text-xs font-semibold text-secondary/50 uppercase mb-1">Employee</p>
                <p className="text-secondary font-medium">{pr.requestedBy}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-secondary/50 uppercase mb-1">Department</p>
                <p className="text-secondary font-medium">{pr.department}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-secondary/50 uppercase mb-1">Purpose</p>
                <p className="text-secondary">{pr.description}</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-secondary mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Requested Items
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-secondary/50 uppercase font-semibold">
                  <th className="pb-2 text-left">Item</th>
                  <th className="pb-2 text-left">Description</th>
                  <th className="pb-2 text-center">Qty</th>
                  <th className="pb-2 text-right">Est. Cost</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pr.lineItems?.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 font-medium text-secondary">{item.item_name}</td>
                    <td className="py-2.5 text-secondary/60 text-xs">{item.description}</td>
                    <td className="py-2.5 text-center text-secondary">{item.quantity}</td>
                    <td className="py-2.5 text-right text-secondary">₱{Number(item.unit_price).toLocaleString()}</td>
                    <td className="py-2.5 text-right font-semibold text-secondary">₱{(Number(item.quantity) * Number(item.unit_price)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td colSpan={4} className="pt-3 text-right font-bold text-secondary">Total Amount:</td>
                  <td className="pt-3 text-right font-extrabold text-primary">₱{pr.amount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Sidebar: Budget + Action */}
        <div className="space-y-6">
          {/* Budget Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-secondary mb-4">Budget Information</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary/60">Total Request</span>
                <span className="text-sm font-bold text-secondary">₱{pr.amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary/60">Department</span>
                <span className="text-sm text-secondary">{pr.department}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary/60">Due Date</span>
                <span className="text-sm text-secondary">{pr.dueDate}</span>
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-secondary mb-4">Action Panel</h3>
            <div className="space-y-2">
              <button
                onClick={() => setAction("approve")}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${action === "approve" ? "bg-emerald-600 text-white" : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
              >
                ✓ Approve
              </button>
              <button
                onClick={() => setAction("reject")}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${action === "reject" ? "bg-red-600 text-white" : "border border-red-200 text-red-600 hover:bg-red-50"}`}
              >
                ✗ Reject
              </button>
              <button
                onClick={() => setAction("return")}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${action === "return" ? "bg-orange-500 text-white" : "border border-orange-200 text-orange-600 hover:bg-orange-50"}`}
              >
                ↩ Return to Sender
              </button>
            </div>

            {(action === "reject" || action === "return" || action === "approve") && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  {action === "reject" ? "Rejection Reason" : action === "return" ? "Return Comment" : "Approval Comments (optional)"} {action !== "approve" && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder={action === "reject" ? "Explain why this request is rejected..." : action === "return" ? "Comment for the requestor..." : "Any comments for the requestor?"}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>
            )}

            {action && (
              <button
                onClick={handleSubmit}
                disabled={!!(action !== "approve" && !reason.trim())}
                className="w-full mt-4 bg-primary text-white py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Decision
              </button>
            )}
          </div>

          {/* Timeline */}
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
