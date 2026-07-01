"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import SearchFilters from "@/components/ui/SearchFilters";
import FiscalYearSelector from "@/components/ui/FiscalYearSelector";
import EmptyState from "@/components/ui/EmptyState";
import PRTableWithActions from "@/features/purchase-requests/components/PRTableWithActions";
import ViewPRModal from "@/features/purchase-requests/components/ViewPRModal";
import PRFormModal from "@/features/purchase-requests/components/PRFormModal";
import DeletePRModal from "@/features/purchase-requests/components/DeletePRModal";
import MarkOrderedModal from "@/features/purchase-requests/components/MarkOrderedModal";
import StatusConfirmationModal from "@/features/purchase-requests/components/StatusConfirmationModal";
import {
  getPurchaseRequests,
  updatePurchaseRequest,
  updatePurchaseRequestStatus,
  bulkDeletePurchaseRequests,
  getPurchaseRequestsSummary,
  uploadPRAttachments,
} from "@/services/purchase-requests.service";
import type { PRData } from "@/services/purchase-requests.service";

const TOP_LEVEL_TABS = ["Purchase Requests", "Procurement Tracking"];
const STATUS_TABS_BY_PHASE: Record<string, string[]> = {
  "Purchase Requests": ["Pending", "Approved", "Rejected"],
  "Procurement Tracking": [
    "Approved",
    "Ordered",
    "Received",
    "Released",
    "Completed",
  ],
};

export default function AdminPRManagementPage() {
  const [prs, setPrs] = useState<PRData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [activePhase, setActivePhase] = useState("Purchase Requests");
  const [activeStatusByPhase, setActiveStatusByPhase] = useState<
    Record<string, string>
  >({
    "Purchase Requests": "Pending",
    "Procurement Tracking": "Approved",
  });
  const activeTab = activeStatusByPhase[activePhase];
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [filterYear, setFilterYear] = useState<number | "">("");
  const [filterMonth, setFilterMonth] = useState<number | null>(null);

  // Modal states
  const [viewPR, setViewPR] = useState<PRData | null>(null);
  const [editPR, setEditPR] = useState<PRData | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [markOrderedPR, setMarkOrderedPR] = useState<PRData | null>(null);

  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    prId: string | null;
    actionName: string;
    targetStatus: string;
  }>({ isOpen: false, prId: null, actionName: "", targetStatus: "" });
  const [actionRemarks, setActionRemarks] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    fetchData();
  }, [search, departmentFilter, activePhase, activeTab, filterYear, filterMonth]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const prIdParam = urlParams.get("prId");
      if (prIdParam && prs.length > 0) {
        const targetPr = prs.find((p) => p.id.toString() === prIdParam);
        if (targetPr) {
          setViewPR(targetPr);

          // Remove the parameter from URL to prevent reopening on reload
          const newUrl = window.location.pathname;
          window.history.replaceState({}, "", newUrl);
        }
      }
    }
  }, [prs]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [data, counts] = await Promise.all([
        getPurchaseRequests(search, departmentFilter, activeTab, filterYear, filterMonth),
        getPurchaseRequestsSummary(filterYear, filterMonth),
      ]);
      setPrs(data);
      setTabCounts(counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (data: any) => {
    if (!editPR) return;
    try {
      let updatedPR = await updatePurchaseRequest(editPR.id, data);
      if (data.files && data.files.length > 0) {
        updatedPR = await uploadPRAttachments(editPR.id, data.files);
      }

      // If status changed, remove from current view and update counts
      if (updatedPR.status !== editPR.status) {
        setPrs((prev) => prev.filter((p) => p.id !== editPR.id));
        setTabCounts((prev) => ({
          ...prev,
          [editPR.status]: Math.max(0, (prev[editPR.status] || 0) - 1),
          [updatedPR.status]: (prev[updatedPR.status] || 0) + 1,
        }));
      } else {
        setPrs((prev) => prev.map((p) => (p.id === editPR.id ? updatedPR : p)));
      }

      setEditPR(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await bulkDeletePurchaseRequests(selectedRows);
      setPrs((prev) => prev.filter((p) => !selectedRows.includes(p.id)));

      setTabCounts((prev) => ({
        ...prev,
        [activeTab]: Math.max(0, (prev[activeTab] || 0) - selectedRows.length),
      }));

      setSelectedRows([]);
      setShowDelete(false);
      setIsDeleteMode(false);
    } catch (err) {
      console.error(err);
    }
  };

  const executeStatusTransition = async (remarksArg?: string) => {
    if (!actionModal.prId || !actionModal.targetStatus) return;
    const finalRemarks = remarksArg !== undefined ? remarksArg : actionRemarks;

    // We let StatusConfirmationModal handle its own isSubmitting state, but we keep this just in case
    setIsProcessingAction(true);
    try {
      const prToUpdate = prs.find((p) => p.id === actionModal.prId);
      if (!prToUpdate) return;

      await updatePurchaseRequestStatus(
        actionModal.prId,
        actionModal.targetStatus,
        finalRemarks.trim(),
      );

      // Update local state without fetching entirely
      setPrs((prev) => prev.filter((p) => p.id !== actionModal.prId));
      setTabCounts((prev) => ({
        ...prev,
        [activeTab]: Math.max(0, (prev[activeTab] || 0) - 1),
        [actionModal.targetStatus]: (prev[actionModal.targetStatus] || 0) + 1,
      }));

      closeActionModal();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsProcessingAction(false);
    }
  };

  const openActionModal = (
    prId: string,
    actionName: string,
    targetStatus: string,
  ) => {
    setActionModal({ isOpen: true, prId, actionName, targetStatus });
    setActionRemarks("");
  };

  const closeActionModal = () => {
    setActionModal({
      isOpen: false,
      prId: null,
      actionName: "",
      targetStatus: "",
    });
    setActionRemarks("");
  };

  const handleMarkOrderedSubmit = async (data: any) => {
    if (!markOrderedPR) return;
    try {
      await updatePurchaseRequest(markOrderedPR.id, {
        description: markOrderedPR.description || "",
        amount: markOrderedPR.amount,
        ...data,
      });

      // Update local state
      setPrs((prev) => prev.filter((p) => p.id !== markOrderedPR.id));
      setTabCounts((prev) => ({
        ...prev,
        [activeTab]: Math.max(0, (prev[activeTab] || 0) - 1),
        Ordered: (prev.Ordered || 0) + 1,
      }));
      setMarkOrderedPR(null);
    } catch (err) {
      console.error(err);
      throw err; // So the modal knows it failed
    }
  };

  const renderWorkflowActions = (pr: PRData) => {
    const ViewBtn = () => (
      <button
        onClick={() => setViewPR(pr)}
        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
        title="View PR details"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </button>
    );
    const EditBtn = () => (
      <button
        onClick={() => setEditPR(pr)}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Edit PR"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>
    );
    const DeleteBtn = () => (
      <button
        onClick={() => {
          setSelectedRows([pr.id]);
          setShowDelete(true);
        }}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Delete PR"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    );

    const purchaseRequestActions: Record<string, React.ReactNode> = {
      Pending: (
        <>
          <button
            onClick={() => openActionModal(pr.id, "Approve", "Approved")}
            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Approve"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
          <button
            onClick={() => openActionModal(pr.id, "Reject", "Rejected")}
            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Reject"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <ViewBtn />
        </>
      ),
      Approved: (
        <>
          <ViewBtn />
        </>
      ),
      Rejected: (
        <>
          <ViewBtn />
        </>
      ),
    };

    const procurementActions: Record<string, React.ReactNode> = {
      Approved: (
        <>
          <button
            onClick={() => setMarkOrderedPR(pr)}
            className="p-1.5 text-indigo-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Mark Ordered"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <ViewBtn />
        </>
      ),
      Ordered: (
        <>
          <button
            onClick={() =>
              openActionModal(pr.id, "Mark as Received", "Received")
            }
            className="p-1.5 text-purple-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Mark Received"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <ViewBtn />
        </>
      ),
      Received: (
        <>
          <button
            onClick={() =>
              openActionModal(pr.id, "Mark as Released", "Released")
            }
            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Mark Released"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
          </button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <ViewBtn />
        </>
      ),
      Released: (
        <>
          <ViewBtn />
        </>
      ),
      Completed: (
        <>
          <ViewBtn />
        </>
      ),
    };

    const actionsByPhase =
      activePhase === "Purchase Requests"
        ? purchaseRequestActions
        : procurementActions;
    const activeActions = actionsByPhase[pr.status] || (
      <>
        <ViewBtn />
      </>
    );

    return (
      <div className="flex items-center justify-end gap-1">{activeActions}</div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <PageHeader
        title="Global PR Management"
        subtitle="Manage the complete lifecycle of purchase requests from approval to completion."
        breadcrumbs={[{ label: "Admin" }, { label: "PR Management" }]}
        actions={
          <div className="flex items-center gap-2">
            {!isDeleteMode ? (
              <button
                onClick={() => setIsDeleteMode(true)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 border border-slate-200 text-secondary bg-white hover:bg-slate-50"
              >
                <svg
                  className="w-4 h-4 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsDeleteMode(false);
                    setSelectedRows([]);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm bg-white border border-slate-200 text-secondary hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  disabled={selectedRows.length === 0}
                  className="bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete ({selectedRows.length})
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Top-level tabs */}
      <div className="bg-white rounded-4xl border border-slate-200 shadow-sm overflow-x-auto custom-scrollbar px-2 py-2">
        <div className="flex gap-2 min-w-full">
          {TOP_LEVEL_TABS.map((phase) => {
            const isActive = activePhase === phase;
            return (
              <button
                key={phase}
                onClick={() => {
                  if (activePhase !== phase) {
                    setActivePhase(phase);
                    setSelectedRows([]);
                    setIsDeleteMode(false);
                  }
                }}
                className={`min-w-50 h-14 px-6 rounded-2xl text-base font-semibold transition-all duration-200 flex items-center justify-center whitespace-nowrap ${
                  isActive
                    ? "text-primary border-b-4 border-primary bg-white shadow-sm"
                    : "text-slate-500 bg-slate-50 hover:text-primary hover:bg-slate-100"
                }`}
              >
                {phase}
              </button>
            );
          })}
        </div>
      </div>

      {/* Phase status filters */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-x-auto custom-scrollbar px-4 py-4">
        <div className="flex flex-wrap items-center gap-3 min-w-full">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Status
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_TABS_BY_PHASE[activePhase].map((status) => {
              const count = tabCounts[status] || 0;
              const isActive = activeTab === status;
              return (
                <button
                  key={status}
                  onClick={() => {
                    if (activeTab !== status) {
                      setActiveStatusByPhase((prev) => ({
                        ...prev,
                        [activePhase]: status,
                      }));
                      setSelectedRows([]);
                      setIsDeleteMode(false);
                    }
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{status}</span>
                  <span
                    className={`inline-flex h-5 min-w-5.5 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex-1 min-w-[280px]">
          <SearchFilters
            searchValue={search}
            onSearchChange={setSearch}
            placeholder="Search by PR number, requestor, or purpose..."
            filters={[]}
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="px-6 py-3 bg-white shadow-xl rounded-xl border border-slate-100 text-primary font-semibold flex items-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Refreshing...
            </div>
          </div>
        )}

        {prs.length === 0 && !loading ? (
          <EmptyState
            title={`No ${activeTab} purchase requests`}
            description="Try adjusting your search filters or switch to another tab."
          />
        ) : (
          <PRTableWithActions
            data={prs}
            selectedRows={selectedRows}
            onSelectRows={setSelectedRows}
            showCheckboxes={isDeleteMode}
            renderActions={isDeleteMode ? undefined : renderWorkflowActions}
          />
        )}
      </div>

      {/* View PR Modal */}
      {viewPR && (
        <ViewPRModal
          isOpen={!!viewPR}
          pr={viewPR}
          showProcurementInfo={activePhase === "Procurement Tracking"}
          onClose={() => setViewPR(null)}
        />
      )}

      {/* Edit PR Modal */}
      {editPR && (
        <PRFormModal
          isOpen={!!editPR}
          isEditMode={true}
          initialData={{
            ...editPR,
            description: editPR.description || "",
          }}
          onClose={() => setEditPR(null)}
          onSubmit={handleEdit}
        />
      )}

      {/* Delete PR Modal */}
      {showDelete && (
        <DeletePRModal
          isOpen={showDelete}
          selectedCount={selectedRows.length}
          onClose={() => setShowDelete(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Action Confirmation Modal */}
      {actionModal.isOpen && (
        <StatusConfirmationModal
          isOpen={actionModal.isOpen}
          action={actionModal.targetStatus as any}
          onClose={closeActionModal}
          onConfirm={async (remarks) => {
            setActionRemarks(remarks);
            await executeStatusTransition(remarks);
          }}
        />
      )}
      {/* Mark as Ordered Modal */}
      {markOrderedPR && (
        <MarkOrderedModal
          isOpen={!!markOrderedPR}
          pr={markOrderedPR}
          onClose={() => setMarkOrderedPR(null)}
          onSubmit={handleMarkOrderedSubmit}
        />
      )}
    </div>
  );
}
