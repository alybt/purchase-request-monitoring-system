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

interface Category {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/categories`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Categories"
        subtitle="Predefined categories for purchase request classification"
        breadcrumbs={[{ label: "Admin" }, { label: "Categories" }]}
      />

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
                  <th className="px-6 py-3 text-left">#</th>
                  <th className="px-6 py-3 text-left">Code</th>
                  <th className="px-6 py-3 text-left">Category Name</th>
                  <th className="px-6 py-3 text-left">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category, i) => (
                  <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-secondary/40 text-xs">{i + 1}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-primary">{category.code}</td>
                    <td className="px-6 py-4 font-semibold text-secondary">{category.name}</td>
                    <td className="px-6 py-4 text-secondary/70">{category.description || "—"}</td>
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
    </div>
  );
}
