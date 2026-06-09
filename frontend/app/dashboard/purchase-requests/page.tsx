"use client";

import { useState, useMemo } from "react";
import PRTableWithActions from "@/features/purchase-requests/components/PRTableWithActions";
import PRFormModal from "@/features/purchase-requests/components/PRFormModal";
import ViewPRModal from "@/features/purchase-requests/components/ViewPRModal";
import DeletePRModal from "@/features/purchase-requests/components/DeletePRModal";

interface PRData {
  id: string;
  prNumber: string;
  department: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  requestedBy: string;
  dateRequested: string;
  dueDate: string;
  description?: string;
  notes?: string;
}

const mockData: PRData[] = [
  {
    id: "1",
    prNumber: "PR-2026-001",
    department: "IT",
    amount: 50000,
    status: "pending",
    requestedBy: "John Doe",
    dateRequested: "2026-06-01",
    dueDate: "2026-06-15",
    description: "Server hardware upgrade",
  },
  {
    id: "2",
    prNumber: "PR-2026-002",
    department: "HR",
    amount: 25000,
    status: "approved",
    requestedBy: "Jane Smith",
    dateRequested: "2026-05-28",
    dueDate: "2026-06-10",
    description: "Employee training program",
  },
  {
    id: "3",
    prNumber: "PR-2026-003",
    department: "Finance",
    amount: 75000,
    status: "pending",
    requestedBy: "Mike Johnson",
    dateRequested: "2026-06-02",
    dueDate: "2026-06-20",
    description: "Audit software subscription",
  },
  {
    id: "4",
    prNumber: "PR-2026-004",
    department: "Operations",
    amount: 35000,
    status: "completed",
    requestedBy: "Sarah Williams",
    dateRequested: "2026-05-15",
    dueDate: "2026-06-01",
    description: "Office furniture",
  },
  {
    id: "5",
    prNumber: "PR-2026-005",
    department: "Marketing",
    amount: 45000,
    status: "rejected",
    requestedBy: "Tom Brown",
    dateRequested: "2026-06-03",
    dueDate: "2026-06-18",
    description: "Advertising campaign",
  },
  {
    id: "6",
    prNumber: "PR-2026-006",
    department: "IT",
    amount: 60000,
    status: "approved",
    requestedBy: "John Doe",
    dateRequested: "2026-06-04",
    dueDate: "2026-06-22",
    description: "Network infrastructure upgrade",
  },
];

export default function PurchaseRequestsPage() {
  const [prs, setPRs] = useState<PRData[]>(mockData);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "completed">(
    "all",
  );

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPR, setEditingPR] = useState<PRData | null>(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPR, setViewingPR] = useState<PRData | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Filter and search logic
  const filteredPRs = useMemo(() => {
    let filtered = prs;

    // Filter by tab
    if (activeTab === "pending") {
      filtered = filtered.filter((pr) => pr.status === "pending");
    } else if (activeTab === "completed") {
      filtered = filtered.filter((pr) => pr.status === "completed");
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (pr) =>
          pr.prNumber.toLowerCase().includes(lowerSearchTerm) ||
          pr.department.toLowerCase().includes(lowerSearchTerm) ||
          pr.requestedBy.toLowerCase().includes(lowerSearchTerm),
      );
    }

    return filtered;
  }, [prs, activeTab, searchTerm]);

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
  const handleViewPR = (pr: PRData) => {
    setViewingPR(pr);
    setShowViewModal(true);
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
  const handleConfirmDelete = () => {
    setPRs(prs.filter((pr) => !selectedRows.includes(pr.id)));
    setSelectedRows([]);
    setShowDeleteModal(false);
    setIsDeleteMode(false);
  };

  // Handle Form Submit
  const handleFormSubmit = (data: any) => {
    if (isEditMode && editingPR) {
      setPRs(
        prs.map((pr) => (pr.id === editingPR.id ? { ...pr, ...data } : pr)),
      );
    } else {
      const newPR: PRData = {
        ...data,
        id: String(prs.length + 1),
        prNumber: `PR-2026-${String(prs.length + 1).padStart(3, "0")}`,
        dateRequested: new Date().toISOString().split("T")[0],
      };
      setPRs([...prs, newPR]);
    }
    setShowFormModal(false);
    setEditingPR(null);
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
          <button className="border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
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
            <button className="flex-1 sm:flex-none border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2">
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filter
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

        {/* Feature Component */}
        <PRTableWithActions
          data={filteredPRs}
          selectedRows={selectedRows}
          onSelectRows={setSelectedRows}
          onView={handleViewPR}
          onEdit={handleEditPR}
          onDelete={handleDeletePR}
          showCheckboxes={isDeleteMode}
        />
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
