"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { CategoryFormModal, CategoryViewModal } from "@/features/categories/components/CategoryModals";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

const API_URL = "http://127.0.0.1:8000/api";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface Category {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [viewCategory, setViewCategory] = useState<Category | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  // Deletion state
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const fetchCategories = () => {
    setLoading(true);
    fetch(`${API_URL}/categories`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (form: { name: string; code: string; description: string }) => {
    const res = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create category");
    setShowAdd(false);
    fetchCategories();
  };

  const handleUpdateCategory = async (form: { name: string; code: string; description: string }) => {
    if (!editCategory) return;
    const res = await fetch(`${API_URL}/categories/${editCategory.id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update category");
    setEditCategory(null);
    fetchCategories();
  };

  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedRows([]);
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === categories.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(categories.map((c) => c.id));
    }
  };

  const toggleRow = (id: number) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteError("");
    try {
      if (selectedRows.length > 1) {
        const res = await fetch(`${API_URL}/categories/bulk-delete`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ ids: selectedRows }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to bulk delete");
      } else {
        const idToDelete = categoryToDelete ? categoryToDelete.id : selectedRows[0];
        const res = await fetch(`${API_URL}/categories/${idToDelete}`, {
          method: "DELETE",
          headers: getHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to delete category");
      }
      setSelectedRows([]);
      setShowDeleteModal(false);
      setIsDeleteMode(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete selected categor(ies).");
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Categories"
        subtitle="Predefined categories for purchase request classification"
        breadcrumbs={[{ label: "Admin" }, { label: "Categories" }]}
        actions={
          <div className="flex items-center gap-2">
            {!isDeleteMode && (
              <button
                id="add-category-btn"
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Category
              </button>
            )}
          </div>
        }
      />

      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm relative">
          <span className="font-semibold">Error: </span>
          {deleteError}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-secondary">Available Categories</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-secondary/50">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-secondary/50">No categories found in the database.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                  {isDeleteMode && (
                    <th className="px-6 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === categories.length && categories.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded cursor-pointer border-slate-300 text-primary focus:ring-primary/20"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left">Code</th>
                  <th className="px-6 py-3 text-left">Category Name</th>
                  <th className="px-6 py-3 text-left">Description</th>
                  <th className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!isDeleteMode ? (
                        <button
                          onClick={handleToggleDeleteMode}
                          className="px-2.5 py-1.5 text-red-600 font-semibold hover:bg-red-50 rounded-lg transition-colors text-xs"
                          title="Enable Bulk Delete"
                        >
                          Delete
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={handleToggleDeleteMode}
                            className="px-2.5 py-1.5 text-secondary hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-2.5 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors"
                          >
                            Delete ({selectedRows.length})
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => (
                  <tr key={category.id} className={`hover:bg-slate-50 transition-colors ${isDeleteMode && selectedRows.includes(category.id) ? "bg-blue-50/50" : ""}`}>
                    {isDeleteMode && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(category.id)}
                          onChange={() => toggleRow(category.id)}
                          className="rounded cursor-pointer border-slate-300 text-primary focus:ring-primary/20"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 font-mono font-semibold text-primary">{category.code}</td>
                    <td className="px-6 py-4 font-semibold text-secondary">{category.name}</td>
                    <td className="px-6 py-4 text-secondary/70">{category.description || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewCategory(category)}
                          className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                          title="View category"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditCategory(category)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit category"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setCategoryToDelete(category);
                            setSelectedRows([category.id]);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete category"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-blue-800 mb-2">About Categories</h3>
        <p className="text-sm text-blue-700">
          Categories are predefined and used to classify purchase requests. Department Heads allocate their budget across these categories in the Category Budget Planning section.
        </p>
      </div>

      {/* Modals */}
      <CategoryFormModal
        isOpen={showAdd}
        isEditMode={false}
        onClose={() => setShowAdd(false)}
        onSubmit={handleCreateCategory}
      />
      
      <CategoryViewModal
        isOpen={!!viewCategory}
        category={viewCategory}
        onClose={() => setViewCategory(null)}
        onEdit={() => {
          const c = viewCategory;
          setViewCategory(null);
          setEditCategory(c);
        }}
      />
      
      <CategoryFormModal
        isOpen={!!editCategory}
        isEditMode={true}
        initialData={editCategory}
        onClose={() => setEditCategory(null)}
        onSubmit={handleUpdateCategory}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        selectedCount={selectedRows.length}
        entityName="Category"
        onClose={() => {
          setShowDeleteModal(false);
          if (!isDeleteMode) {
            setCategoryToDelete(null);
            setSelectedRows([]);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
