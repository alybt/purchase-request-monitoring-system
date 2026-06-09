"use client";

import { useState } from "react";

interface PRFormData {
  id?: string;
  prNumber?: string;
  department: string;
  amount: number;
  description: string;
  status: "pending" | "approved" | "rejected" | "completed";
  dueDate: string;
  requestedBy: string;
  notes?: string;
}

interface PRFormModalProps {
  isOpen: boolean;
  isEditMode: boolean;
  initialData?: PRFormData;
  onClose: () => void;
  onSubmit: (data: PRFormData) => void;
}

const departments = ["IT", "HR", "Finance", "Operations", "Marketing", "Sales"];

export default function PRFormModal({
  isOpen,
  isEditMode,
  initialData,
  onClose,
  onSubmit,
}: PRFormModalProps) {
  const [formData, setFormData] = useState<PRFormData>(
    initialData || {
      department: "IT",
      amount: 0,
      description: "",
      status: "pending",
      dueDate: "",
      requestedBy: "",
      notes: "",
    },
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.amount || formData.amount <= 0)
      newErrors.amount = "Amount must be greater than 0";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.dueDate) newErrors.dueDate = "Due date is required";
    if (!formData.requestedBy.trim())
      newErrors.requestedBy = "Requested by is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-secondary">
            {isEditMode
              ? "Edit Purchase Request"
              : "Create New Purchase Request"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-secondary transition-colors"
          >
            <svg
              className="w-6 h-6"
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
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* PR Number (Read-only in edit mode) */}
          {isEditMode && formData.prNumber && (
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                PR Number
              </label>
              <input
                type="text"
                value={formData.prNumber}
                disabled
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-secondary/70 cursor-not-allowed"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-secondary"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="text-red-500 text-xs mt-1">{errors.department}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                Amount (₱)
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount || ""}
                onChange={handleChange}
                placeholder="0"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors.amount
                    ? "border-red-500 focus:ring-red-500/50"
                    : "border-slate-200 focus:ring-primary/50"
                }`}
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter purchase request description"
              rows={3}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none ${
                errors.description
                  ? "border-red-500 focus:ring-red-500/50"
                  : "border-slate-200 focus:ring-primary/50"
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Requested By */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                Requested By
              </label>
              <input
                type="text"
                name="requestedBy"
                value={formData.requestedBy}
                onChange={handleChange}
                placeholder="Enter name"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors.requestedBy
                    ? "border-red-500 focus:ring-red-500/50"
                    : "border-slate-200 focus:ring-primary/50"
                }`}
              />
              {errors.requestedBy && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.requestedBy}
                </p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors.dueDate
                    ? "border-red-500 focus:ring-red-500/50"
                    : "border-slate-200 focus:ring-primary/50"
                }`}
              />
              {errors.dueDate && (
                <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-secondary"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              placeholder="Add any additional notes"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              {isEditMode ? "Update PR" : "Create PR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
