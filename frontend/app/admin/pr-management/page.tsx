"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import SearchFilters from "@/components/ui/SearchFilters";
import EmptyState from "@/components/ui/EmptyState";
// Reuse existing PR components
import PRTableWithActions from "@/features/purchase-requests/components/PRTableWithActions";
import ViewPRModal from "@/features/purchase-requests/components/ViewPRModal";
import PRFormModal from "@/features/purchase-requests/components/PRFormModal";
import DeletePRModal from "@/features/purchase-requests/components/DeletePRModal";
import { getPurchaseRequests, updatePurchaseRequest, bulkDeletePurchaseRequests, uploadPRAttachments } from "@/services/purchase-requests.service";
import type { PRData } from "@/services/purchase-requests.service";

export default function AdminPRManagementPage() {
  const [prs, setPrs] = useState<PRData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Modal states
  const [viewPR, setViewPR] = useState<PRData | null>(null);
  const [editPR, setEditPR] = useState<PRData | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetchPRs();
  }, [search, statusFilter]);

  const fetchPRs = async () => {
    setLoading(true);
    try {
      const data = await getPurchaseRequests(search, "", statusFilter);
      setPrs(data);
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
      setPrs((prev) =>
        prev.map((p) => (p.id === editPR.id ? updatedPR : p))
      );
      setEditPR(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await bulkDeletePurchaseRequests(selectedRows);
      setPrs((prev) => prev.filter((p) => !selectedRows.includes(p.id)));
      setSelectedRows([]);
      setShowDelete(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleForceStatus = async (id: string, status: string) => {
    try {
      const prToUpdate = prs.find((p) => p.id === id);
      if (!prToUpdate) return;
      const updatedPR = await updatePurchaseRequest(id, {
        description: prToUpdate.description || "",
        amount: prToUpdate.amount,
        status,
      });
      setPrs((prev) => prev.map((p) => (p.id === id ? updatedPR : p)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Global PR Management"
        subtitle={`${prs.length} total purchase requests`}
        breadcrumbs={[{ label: "Admin" }, { label: "PR Management" }]}
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchFilters
            searchValue={search}
            onSearchChange={setSearch}
            placeholder="Search by PR number, requestor, or department..."
            filters={[
              {
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: "Draft", value: "Draft" },
                  { label: "Submitted", value: "Submitted" },
                  { label: "Approved", value: "Approved" },
                  { label: "Rejected", value: "Rejected" },
                  { label: "Ordered", value: "Ordered" },
                  { label: "Received", value: "Received" },
                  { label: "Released", value: "Released" },
                  { label: "Completed", value: "Completed" },
                ],
              },
            ]}
          />
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  selectedRows.forEach((id) => handleForceStatus(id, e.target.value));
                  setSelectedRows([]);
                  e.target.value = "";
                }}
              >
                <option value="">Update Status…</option>
                <option value="Draft">Set Draft</option>
                <option value="Submitted">Set Submitted</option>
                <option value="Approved">Set Approved</option>
                <option value="Rejected">Set Rejected</option>
                <option value="Ordered">Set Ordered</option>
                <option value="Received">Set Received</option>
                <option value="Released">Set Released</option>
                <option value="Completed">Set Completed</option>
              </select>
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-600"
              >
                Delete ({selectedRows.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-secondary/50">Loading purchase requests...</div>
        ) : prs.length === 0 ? (
          <EmptyState title="No purchase requests found" description="Try adjusting your filters." />
        ) : (
          <PRTableWithActions
            data={prs}
            selectedRows={selectedRows}
            onSelectRows={setSelectedRows}
            onView={(pr) => setViewPR(pr)}
            onEdit={(pr) => setEditPR(pr)}
            onDelete={(pr) => { setSelectedRows([pr.id]); setShowDelete(true); }}
            showCheckboxes={true}
          />
        )}
      </div>

      {/* Modals */}
      {viewPR && (
        <ViewPRModal
          isOpen={!!viewPR}
          pr={viewPR}
          onClose={() => setViewPR(null)}
        />
      )}
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
      {showDelete && (
        <DeletePRModal
          isOpen={showDelete}
          selectedCount={selectedRows.length}
          onClose={() => { setShowDelete(false); }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
