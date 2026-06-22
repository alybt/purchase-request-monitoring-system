"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";

const API_URL = "http://127.0.0.1:8000/api";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  budget_allocation: number;
  available_budget: number;
  reserved_budget: number;
  spent_budget: number;
  fiscal_year: number;
}

const emptyForm = { name: "", code: "", description: "" };

export default function DepartmentManagementPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchDepts = () => {
    setLoading(true);
    fetch(`${API_URL}/departments`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((data) => setDepartments(data.departments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const openCreate = () => {
    setEditDept(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (dept: Department) => {
    setEditDept(dept);
    setForm({ name: dept.name, code: dept.code, description: dept.description || "" });
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      setError("Name and code are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = editDept ? `${API_URL}/departments/${editDept.id}` : `${API_URL}/departments`;
      const method = editDept ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save department");
      setShowForm(false);
      fetchDepts();
    } catch (e: any) {
      setError(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const totalAllocated = departments.reduce((s, d) => s + d.budget_allocation, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Department Management"
        subtitle="Manage departments and their budget allocations"
        breadcrumbs={[{ label: "Admin" }, { label: "Department Management" }]}
      />

      {/* Department Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-secondary">Departments</h3>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Department
          </button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-secondary/50">Loading departments...</div>
          ) : departments.length === 0 ? (
            <div className="p-8 text-center text-secondary/50">No departments found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                  <th className="px-6 py-3 text-left">Department</th>
                  <th className="px-6 py-3 text-left">Code</th>
                  <th className="px-6 py-3 text-left">Budget (FY {departments[0]?.fiscal_year})</th>
                  <th className="px-6 py-3 text-left">Available</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-semibold text-secondary">{dept.name}</td>
                    <td className="px-6 py-3 font-mono text-secondary/70">{dept.code}</td>
                    <td className="px-6 py-3 font-semibold text-secondary">
                      {dept.budget_allocation > 0 ? `₱${dept.budget_allocation.toLocaleString()}` : <span className="text-secondary/40">Not set</span>}
                    </td>
                    <td className="px-6 py-3 text-emerald-600 font-semibold">
                      {dept.budget_allocation > 0 ? `₱${dept.available_budget.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => openEdit(dept)}
                        className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {totalAllocated > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td className="px-6 py-3 font-bold text-secondary">Total</td>
                    <td />
                    <td className="px-6 py-3 font-bold text-secondary">₱{totalAllocated.toLocaleString()}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-secondary">{editDept ? "Edit Department" : "Create Department"}</h3>
          </div>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">Department Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g. Information Technology"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">Department Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase"
                  placeholder="e.g. IT"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-secondary mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-secondary hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {saving ? "Saving..." : editDept ? "Save Changes" : "Create Department"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
        <strong>Note:</strong> Budget allocations are set per fiscal year. Contact your system administrator to configure department budget amounts in the database.
      </div>
    </div>
  );
}
