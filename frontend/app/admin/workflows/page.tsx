"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

export interface WorkflowRule {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number | null;
  requiredApprover: string;
  approverRole: string; // the minimum role level needed
  status: "active" | "inactive";
}

const mockWorkflowRules: WorkflowRule[] = [
  {
    id: "wr1",
    name: "Standard Equipment",
    minAmount: 0,
    maxAmount: 10000,
    requiredApprover: "Department Head",
    approverRole: "manager",
    status: "active",
  },
  {
    id: "wr2",
    name: "Mid-Range Capital",
    minAmount: 10001,
    maxAmount: 50000,
    requiredApprover: "Finance Director",
    approverRole: "director",
    status: "active",
  },
  {
    id: "wr3",
    name: "High Value Assets",
    minAmount: 50001,
    maxAmount: null,
    requiredApprover: "VP of Operations",
    approverRole: "vp",
    status: "inactive",
  },
];

interface RuleFormData {
  id?: string;
  name: string;
  minAmount: number;
  maxAmount: number | null;
  requiredApprover: string;
  approverRole: string;
  status: "active" | "inactive";
}

const defaultForm: RuleFormData = {
  name: "",
  minAmount: 0,
  maxAmount: null,
  requiredApprover: "",
  approverRole: "approver",
  status: "active",
};

function RuleModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RuleFormData) => void;
  initialData?: WorkflowRule;
}) {
  const [form, setForm] = useState<RuleFormData>(
    initialData
      ? {
          id: initialData.id,
          name: initialData.name,
          minAmount: initialData.minAmount,
          maxAmount: initialData.maxAmount,
          requiredApprover: initialData.requiredApprover,
          approverRole: initialData.approverRole,
          status: initialData.status,
        }
      : defaultForm
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-secondary">
            {initialData ? "Edit Workflow Rule" : "Create Workflow Rule"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-secondary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1.5">Rule Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Mid-Range Purchases"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">Min Amount (₱)</label>
              <input
                type="number"
                value={form.minAmount}
                onChange={(e) => setForm({ ...form, minAmount: parseFloat(e.target.value) || 0 })}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">Max Amount (₱) <span className="font-normal text-secondary/50">(blank = no limit)</span></label>
              <input
                type="number"
                value={form.maxAmount ?? ""}
                onChange={(e) => setForm({ ...form, maxAmount: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="No limit"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1.5">Required Approver Title</label>
            <input
              type="text"
              value={form.requiredApprover}
              onChange={(e) => setForm({ ...form, requiredApprover: e.target.value })}
              required
              placeholder="e.g. Team Lead, Department Head, Director"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
              {initialData ? "Update Rule" : "Create Rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminWorkflowsPage() {
  const [rules, setRules] = useState<WorkflowRule[]>(mockWorkflowRules);
  const [showCreate, setShowCreate] = useState(false);
  const [editRule, setEditRule] = useState<WorkflowRule | null>(null);
  const [deleteRule, setDeleteRule] = useState<WorkflowRule | null>(null);

  const handleSave = (data: RuleFormData) => {
    if (data.id) {
      setRules((prev) => prev.map((r) => (r.id === data.id ? { ...data, id: r.id } as WorkflowRule : r)));
      setEditRule(null);
    } else {
      setRules((prev) => [...prev, { ...data, id: `wr${Date.now()}` } as WorkflowRule]);
      setShowCreate(false);
    }
  };

  const handleDelete = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    setDeleteRule(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Approval Workflow Configuration"
        subtitle="Define amount-based approval routing rules"
        breadcrumbs={[{ label: "Admin" }, { label: "Workflows" }]}
        actions={
          <button
            id="create-rule-btn"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Rule
          </button>
        }
      />

      {/* Rule overview callout */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-primary">Routing Logic</p>
          <p className="text-sm text-secondary/70 mt-0.5">
            When a PR is submitted, the system automatically routes it to the required approver based on the total amount. Rules are evaluated top-to-bottom.
          </p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {rules.length === 0 ? (
          <EmptyState title="No workflow rules" description="Create a rule to define approval routing logic." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                  <th className="px-6 py-3 text-left">Rule Name</th>
                  <th className="px-6 py-3 text-left">Amount Range</th>
                  <th className="px-6 py-3 text-left">Required Approver</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-secondary">{rule.name}</td>
                    <td className="px-6 py-4 text-secondary/70 font-mono text-xs">
                      ₱{rule.minAmount.toLocaleString()} — {rule.maxAmount ? `₱${rule.maxAmount.toLocaleString()}` : "No limit"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-secondary font-medium">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {rule.requiredApprover}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rule.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setEditRule(rule)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                        >
                          Edit
                        </button>
                        <span className="text-slate-200">|</span>
                        <button
                          onClick={() => setDeleteRule(rule)}
                          className="text-red-500 hover:text-red-600 font-medium text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <RuleModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSave={handleSave} />
      {editRule && (
        <RuleModal isOpen={!!editRule} onClose={() => setEditRule(null)} onSave={handleSave} initialData={editRule} />
      )}

      {/* Delete Confirm */}
      {deleteRule && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-secondary mb-2">Delete Rule?</h3>
            <p className="text-sm text-secondary/60 mb-6">
              Are you sure you want to delete <strong>{deleteRule.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteRule(null)} className="flex-1 border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteRule.id)} className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
