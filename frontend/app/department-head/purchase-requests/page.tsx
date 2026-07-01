"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { getPurchaseRequests, bulkDeletePurchaseRequests, updatePurchaseRequestStatus } from "@/services/purchase-requests.service";
import type { PRData } from "@/services/purchase-requests.service";

import CreatePRModal from "@/features/purchase-requests/components/CreatePRModal";
import ViewPRModal from "@/features/purchase-requests/components/ViewPRModal";
import StatusConfirmationModal from "@/features/purchase-requests/components/StatusConfirmationModal";
import FiscalYearSelector from "@/components/ui/FiscalYearSelector";

const STATUS_TABS = ["All", "Draft", "Pending", "Approved", "Rejected", "In Progress", "Released", "Completed"];

export default function DepartmentHeadPRListPage() {
  const [prs, setPrs] = useState<PRData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPrId, setEditingPrId] = useState<string | null>(null);
  const [viewingPrId, setViewingPrId] = useState<string | null>(null);
  const [selectedPrs, setSelectedPrs] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [confirmingReceiptId, setConfirmingReceiptId] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | "">("");
  const [filterMonth, setFilterMonth] = useState<number | null>(null);

  useEffect(() => {
    fetchPRs();
  }, [search, filterYear, filterMonth]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const prIdParam = urlParams.get('prId');
      if (prIdParam) {
        setViewingPrId(prIdParam);
        
        // Remove the parameter from URL to prevent reopening on reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [prs]);

  useEffect(() => {
    // Calculate tab counts
    const counts: Record<string, number> = {
      "All": prs.length,
      "Draft": 0, "Pending": 0, "Approved": 0, "Rejected": 0, "In Progress": 0, "Released": 0, "Completed": 0
    };
    prs.forEach(pr => {
      if (["Ordered", "Received"].includes(pr.status)) {
        counts["In Progress"]++;
      } else if (counts[pr.status] !== undefined) {
        counts[pr.status]++;
      }
    });
    setTabCounts(counts);
    // Reset selection when items change or tab changes
    setSelectedPrs([]);
  }, [prs, activeTab]);

  const fetchPRs = async () => {
    setLoading(true);
    try {
      // Fetch all to get counts, or we could let the backend do it. We fetch all for now.
      const data = await getPurchaseRequests(search, "", "", filterYear, filterMonth);
      setPrs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrs = prs.filter(pr => {
    if (activeTab === "All") return true;
    if (activeTab === "In Progress") {
      return ["Ordered", "Received"].includes(pr.status);
    }
    return pr.status === activeTab;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPrs(filteredPrs.map((pr) => pr.id.toString()));
    } else {
      setSelectedPrs([]);
    }
  };

  const handleSelectPr = (id: string) => {
    setSelectedPrs((prev) =>
      prev.includes(id) ? prev.filter((prId) => prId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedPrs.length} selected request(s)?`)) return;
    
    setIsDeleting(true);
    try {
      await bulkDeletePurchaseRequests(selectedPrs);
      setSelectedPrs([]);
      setIsDeleteMode(false);
      fetchPRs();
    } catch (error) {
      console.error("Failed to delete requests", error);
      alert("Failed to delete selected requests. They might not be in a deletable state.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmReceipt = async (remarks: string) => {
    if (!confirmingReceiptId) return;
    try {
      await updatePurchaseRequestStatus(confirmingReceiptId, "Completed", remarks);
      setConfirmingReceiptId(null);
      fetchPRs();
    } catch (error) {
      console.error("Failed to confirm receipt", error);
      alert("Failed to confirm receipt.");
      throw error;
    }
  };

  const renderActions = (pr: PRData) => {
    const viewBtn = (
      <button onClick={() => setViewingPrId(pr.id.toString())} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex items-center gap-1.5 font-semibold text-xs" title="View">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      </button>
    );

    switch (pr.status) {
      case "Draft":
        return (
          <div className="flex items-center justify-end gap-2">
            {viewBtn}
            <button onClick={() => { setEditingPrId(pr.id.toString()); setShowCreateModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-semibold text-xs inline-flex items-center gap-1.5" title="Edit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button onClick={async () => {
              if (confirm('Are you sure you want to submit this draft for approval?')) {
                try {
                  await updatePurchaseRequestStatus(pr.id.toString(), "Pending", "Submitted for approval");
                  fetchPRs();
                } catch (e) { alert("Failed to submit request."); }
              }
            }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-semibold text-xs inline-flex items-center gap-1.5" title="Submit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </button>
            {!isDeleteMode && (
              <button onClick={async () => {
                if (confirm('Are you sure you want to delete this draft?')) {
                  try {
                    await bulkDeletePurchaseRequests([pr.id.toString()]);
                    fetchPRs();
                  } catch (e) { alert("Failed to delete request."); }
                }
              }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold text-xs inline-flex items-center gap-1.5" title="Delete">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          </div>
        );
      case "Pending":
        return (
          <div className="flex items-center justify-end gap-2">
            {viewBtn}
            <button onClick={async () => {
              if (confirm('Are you sure you want to cancel this request and return it to Draft status?')) {
                try {
                  await updatePurchaseRequestStatus(pr.id.toString(), "Draft", "Cancelled by requester");
                  fetchPRs();
                } catch (e) { alert("Failed to cancel request."); }
              }
            }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold text-xs inline-flex items-center gap-1.5" title="Cancel">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        );
      case "Rejected":
        return (
          <div className="flex items-center justify-end gap-2">
            {viewBtn}
            <button onClick={() => { setEditingPrId(pr.id.toString()); setShowCreateModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-semibold text-xs inline-flex items-center gap-1.5" title="Edit & Resubmit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
          </div>
        );
      case "Released":
        return (
          <div className="flex items-center justify-end gap-2">
            {viewBtn}
            <button onClick={() => { setConfirmingReceiptId(pr.id.toString()); }} className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors font-semibold text-xs inline-flex items-center gap-1.5" title="Confirm Receipt">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
          </div>
        );
      default:
        // Approved, In Progress, Completed
        return (
          <div className="flex items-center justify-end gap-2">
            {viewBtn}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="My Purchase Requests"
        subtitle={`${prs.length} total requests`}
        breadcrumbs={[{ label: "Department Head" }, { label: "My Purchase Requests" }]}
        actions={
          <div className="flex items-center gap-3">
            {isDeleteMode ? (
              <>
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting || selectedPrs.length === 0}
                  className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all border border-red-200 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  )}
                  Delete ({selectedPrs.length})
                </button>
                <button
                  onClick={() => { setIsDeleteMode(false); setSelectedPrs([]); }}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsDeleteMode(true)}
                  className="flex items-center gap-2 bg-white text-red-600 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
                <button
                  onClick={() => { setEditingPrId(null); setShowCreateModal(true); }}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Request
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="flex items-center overflow-x-auto border-b border-slate-200 px-2 pt-2 scrollbar-hide">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab;
            const count = tabCounts[tab] || 0;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-secondary/60 hover:text-secondary hover:border-slate-300"
                }`}
              >
                {tab}
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-end justify-between">
          <div className="relative w-full max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PR number, purpose..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm bg-white"
            />
          </div>
          <FiscalYearSelector
            value={filterYear}
            onChange={setFilterYear}
            monthValue={filterMonth}
            onMonthChange={setFilterMonth}
            allowAllYears={true}
            label="Fiscal Period"
          />
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center bg-white">
            <svg className="animate-spin h-8 w-8 text-primary mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-slate-500 font-medium">Loading requests...</span>
          </div>
        ) : filteredPrs.length === 0 ? (
          <EmptyState
            title={`No ${activeTab} requests`}
            description="There are no purchase requests in this stage."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                  {isDeleteMode && (
                    <th className="px-6 py-4 text-left w-12">
                      <input
                        type="checkbox"
                        checked={filteredPrs.length > 0 && selectedPrs.length === filteredPrs.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 text-left">PR Number</th>
                  <th className="px-6 py-4 text-left">Purpose</th>
                  <th className="px-6 py-4 text-left">Category</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Stage</th>
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPrs.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-50/50 transition-colors">
                    {isDeleteMode && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPrs.includes(pr.id.toString())}
                          onChange={() => handleSelectPr(pr.id.toString())}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 font-bold text-primary whitespace-nowrap">{pr.prNumber}</td>
                    <td className="px-6 py-4 text-secondary/80 max-w-[200px] truncate" title={pr.description}>{pr.description}</td>
                    <td className="px-6 py-4 text-secondary/70 whitespace-nowrap">{pr.category || "N/A"}</td>
                    <td className="px-6 py-4 font-bold text-secondary text-right whitespace-nowrap">₱{pr.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <StatusBadge status={pr.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">{pr.dateRequested}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {renderActions(pr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreatePRModal
        isOpen={showCreateModal}
        prIdToEdit={editingPrId}
        onClose={() => { setShowCreateModal(false); setEditingPrId(null); }}
        onCreated={() => {
          setShowCreateModal(false);
          setEditingPrId(null);
          fetchPRs();
        }}
      />

      {viewingPrId && (
        <ViewPRModal
          isOpen={!!viewingPrId}
          onClose={() => setViewingPrId(null)}
          pr={prs.find(p => p.id.toString() === viewingPrId) || null}
        />
      )}

      {/* Confirm Receipt Modal */}
      {confirmingReceiptId && (
        <StatusConfirmationModal
          isOpen={!!confirmingReceiptId}
          action="Completed"
          onClose={() => setConfirmingReceiptId(null)}
          onConfirm={handleConfirmReceipt}
        />
      )}
    </div>
  );
}
