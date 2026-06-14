"use client";

import { useState, useMemo, useEffect } from "react";
import PRTableWithActions from "@/features/purchase-requests/components/PRTableWithActions";
import PRFormModal from "@/features/purchase-requests/components/PRFormModal";
import ViewPRModal from "@/features/purchase-requests/components/ViewPRModal";
import DeletePRModal from "@/features/purchase-requests/components/DeletePRModal";
import {
  getPurchaseRequests,
  getPurchaseRequestDetails,
  createPurchaseRequest,
  updatePurchaseRequest,
  deletePurchaseRequest,
  bulkDeletePurchaseRequests,
  approvePurchaseRequest,
  rejectPurchaseRequest,
  PRData,
} from "@/services/purchase-requests.service";

export default function PurchaseRequestsPage() {
  const [prs, setPRs] = useState<PRData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "completed">("all");

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPR, setEditingPR] = useState<PRData | null>(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPR, setViewingPR] = useState<PRData | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchPRs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPurchaseRequests(searchTerm, "", "");
      setPRs(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch purchase requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPRs();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Filter and search logic
  const filteredPRs = useMemo(() => {
    let filtered = prs;

    // Filter by tab
    if (activeTab === "pending") {
      filtered = filtered.filter((pr) => pr.status === "pending");
    } else if (activeTab === "completed") {
      filtered = filtered.filter((pr) => pr.status === "completed");
    }

    return filtered;
  }, [prs, activeTab]);

  // Handle Add PR
  const handleAddPR = () => {
    setIsEditMode(false);
    setEditingPR(null);
    setShowFormModal(true);
  };

  // Handle Edit PR
  const handleEditPR = (pr: PRData) => {
    setIsEditMode(true);
    setEditingPR(pr);
    setShowFormModal(true);
  };

  // Handle View PR
  const handleViewPR = async (pr: PRData) => {
    try {
      const details = await getPurchaseRequestDetails(pr.id);
      setViewingPR(details);
      setShowViewModal(true);
    } catch (err: any) {
      setError(err.message || "Failed to fetch purchase request details.");
    }
  };

  // Handle Delete Single PR
  const handleDeletePR = (pr: PRData) => {
    setIsDeleteMode(true);
    setSelectedRows([pr.id]);
    setShowDeleteModal(true);
  };

  // Handle Delete Multiple PRs
  const handleDeleteMultiple = () => {
    if (selectedRows.length === 0) return;
    setShowDeleteModal(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    try {
      if (selectedRows.length > 1) {
        await bulkDeletePurchaseRequests(selectedRows);
        setPRs(prs.filter((pr) => !selectedRows.includes(pr.id)));
      } else if (selectedRows.length === 1) {
        await deletePurchaseRequest(selectedRows[0]);
        setPRs(prs.filter((pr) => pr.id !== selectedRows[0]));
      }
      setSelectedRows([]);
      setShowDeleteModal(false);
      setIsDeleteMode(false);
    } catch (err: any) {
      setError(err.message || "Failed to delete purchase request(s).");
      setShowDeleteModal(false);
    }
  };

  // Handle Form Submit
  const handleFormSubmit = async (data: any) => {
    try {
      if (isEditMode && editingPR) {
        const updated = await updatePurchaseRequest(editingPR.id, data);
        setPRs(prs.map((pr) => (pr.id === editingPR.id ? updated : pr)));
      } else {
        const created = await createPurchaseRequest(data);
        setPRs([created, ...prs]);
      }
      setShowFormModal(false);
      setEditingPR(null);
    } catch (err: any) {
      setError(err.message || "Operation failed.");
      setShowFormModal(false);
    }
  };

  const handleApprove = async (id: string, comments: string) => {
    try {
      await approvePurchaseRequest(id, comments);
      const updated = await getPurchaseRequestDetails(id);
      setPRs(prs.map((pr) => (pr.id === id ? updated : pr)));
      setViewingPR(updated);
    } catch (err: any) {
      alert(err.message || "Approval failed.");
    }
  };

  const handleReject = async (id: string, comments: string) => {
    try {
      await rejectPurchaseRequest(id, comments);
      const updated = await getPurchaseRequestDetails(id);
      setPRs(prs.map((pr) => (pr.id === id ? updated : pr)));
      setViewingPR(updated);
    } catch (err: any) {
      alert(err.message || "Rejection failed.");
    }
  };

  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedRows([]);
  };

  const getTabCount = (status: string) => {
    if (status === "all") return prs.length;
    if (status === "pending")
      return prs.filter((pr) => pr.status === "pending").length;
    if (status === "completed")
      return prs.filter((pr) => pr.status === "completed").length;
    return 0;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50 p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            Global PR Management
          </h1>
          <p className="text-secondary/70 text-sm mt-1">
            Monitor, review, and approve all purchase requests.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," 
                + "PR Number,Department,Amount,Status,Requested By,Date Requested,Due Date\n"
                + prs.map(e => `"${e.prNumber}","${e.department}",${e.amount},"${e.status}","${e.requestedBy}","${e.dateRequested}","${e.dueDate}"`).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "purchase_requests_export.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            Export List
          </button>
          <button
            onClick={handleAddPR}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create PR
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm relative">
          <span className="font-semibold">Error: </span>
          {error}
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-8 overflow-x-auto">
          {(["all", "pending", "completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "text-primary border-b-2 border-primary font-bold"
                  : "text-secondary/60 hover:text-secondary"
              }`}
            >
              {tab === "all"
                ? "All Requests"
                : tab === "pending"
                  ? "Pending Approval"
                  : "Completed"}
              <span
                className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab
                    ? "bg-primary/10 text-primary"
                    : "bg-slate-100 text-secondary/60"
                }`}
              >
                {getTabCount(tab)}
              </span>
            </button>
          ))}
        </div>

        {/* Search and Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="relative w-full max-w-md">
            <svg
              className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by PR number, department, or requester..."
              className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-secondary placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={fetchPRs}
              className="flex-1 sm:flex-none border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 10H18.21" />
              </svg>
              Refresh
            </button>

            <button
              onClick={handleToggleDeleteMode}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 ${
                isDeleteMode
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "border border-slate-200 text-secondary bg-white hover:bg-slate-50"
              }`}
            >
              <svg
                className="w-4 h-4"
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
              {isDeleteMode ? "Cancel" : "Delete"}
            </button>

            {isDeleteMode && selectedRows.length > 0 && (
              <button
                onClick={handleDeleteMultiple}
                className="flex-1 sm:flex-none bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 13a3 3 0 015 0v6a3 3 0 01-5 0v-6z" />
                  <path d="M14 13a3 3 0 015 0v6a3 3 0 01-5 0v-6z" />
                </svg>
                Delete {selectedRows.length} PR
                {selectedRows.length > 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-primary mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-slate-400 font-medium">Fetching requests from database...</span>
          </div>
        ) : (
          /* Feature Component */
          <PRTableWithActions
            data={filteredPRs}
            selectedRows={selectedRows}
            onSelectRows={setSelectedRows}
            onView={handleViewPR}
            onEdit={handleEditPR}
            onDelete={handleDeletePR}
            showCheckboxes={isDeleteMode}
          />
        )}
      </div>

      {/* Modals */}
      <PRFormModal
        isOpen={showFormModal}
        isEditMode={isEditMode}
        initialData={
          editingPR
            ? {
                id: editingPR.id,
                prNumber: editingPR.prNumber,
                department: editingPR.department,
                amount: editingPR.amount,
                description: editingPR.description || "",
                status: editingPR.status,
                dueDate: editingPR.dueDate,
                requestedBy: editingPR.requestedBy,
                notes: editingPR.notes || "",
              }
            : undefined
        }
        onClose={() => {
          setShowFormModal(false);
          setEditingPR(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <ViewPRModal
        isOpen={showViewModal}
        pr={viewingPR}
        onClose={() => setShowViewModal(false)}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <DeletePRModal
        isOpen={showDeleteModal}
        selectedCount={selectedRows.length}
        onClose={() => {
          setShowDeleteModal(false);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
