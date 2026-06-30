"use client";

import { useState, useEffect } from "react";

interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  budget_allocation?: number;
  available_budget?: number;
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

interface DepartmentFormModalProps {
  isOpen: boolean;
  isEditMode: boolean;
  initialData?: Department | null;
  onClose: () => void;
  onSubmit: (data: { name: string; code: string; description: string }) => Promise<void>;
}

export function DepartmentFormModal({
  isOpen,
  isEditMode,
  initialData,
  onClose,
  onSubmit,
}: DepartmentFormModalProps) {
  const emptyForm = { name: "", code: "", description: "" };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setForm(
      initialData
        ? { name: initialData.name, code: initialData.code, description: initialData.description || "" }
        : emptyForm
    );
    setErrors({});
    setServerError("");
  }, [isOpen, initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Department name is required.";
    if (!form.code.trim()) newErrors.code = "Department code is required.";
    else if (form.code.length > 20) newErrors.code = "Code must be 20 characters or fewer.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError("");
    try {
      await onSubmit({ ...form, code: form.code.toUpperCase() });
    } catch (err: any) {
      setServerError(err.message || "Failed to save department.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputBase =
    "w-full border rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 transition-all";
  const inputNormal = `${inputBase} border-slate-200 focus:ring-primary/50`;
  const inputError = `${inputBase} border-red-500 focus:ring-red-500/50 bg-red-50`;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 shrink-0">
          <h2 className="text-lg font-bold text-secondary">
            {isEditMode ? "Edit Department" : "Add Department"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-secondary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {serverError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{serverError}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); if (errors.name) setErrors((p) => { const n = { ...p }; delete n.name; return n; }); }}
                  className={errors.name ? inputError : inputNormal}
                  placeholder="e.g. Information Technology"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Department Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => { setForm((f) => ({ ...f, code: e.target.value })); if (errors.code) setErrors((p) => { const n = { ...p }; delete n.code; return n; }); }}
                  className={`${errors.code ? inputError : inputNormal} uppercase`}
                  placeholder="e.g. IT"
                />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={inputNormal}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 shrink-0 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : isEditMode ? "Save Changes" : "Create Department"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────

interface DepartmentViewModalProps {
  isOpen: boolean;
  department: Department | null;
  onClose: () => void;
  onEdit: () => void;
}

export function DepartmentViewModal({ isOpen, department, onClose, onEdit }: DepartmentViewModalProps) {
  if (!isOpen || !department) return null;

  const fields = [
    { label: "Department Name", value: department.name },
    { label: "Department Code", value: department.code },
    { label: "Description", value: department.description || "—" },
    {
      label: "Budget Allocation",
      value: department.budget_allocation
        ? `₱${department.budget_allocation.toLocaleString()}`
        : "Not set",
    },
    {
      label: "Available Budget",
      value: department.budget_allocation
        ? `₱${(department.available_budget ?? 0).toLocaleString()}`
        : "—",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 shrink-0">
          <h2 className="text-lg font-bold text-secondary">View Department</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-secondary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-bold uppercase tracking-wider text-secondary/50 mb-1">{label}</p>
              <p className="text-sm font-semibold text-secondary bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Edit Department
          </button>
        </div>
      </div>
    </div>
  );
}
