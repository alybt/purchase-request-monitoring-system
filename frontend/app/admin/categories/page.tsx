"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";

export interface MockCategory {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
}

export interface MockVendor {
  id: string;
  vendorName: string;
  contactPerson: string;
  email: string;
  phone: string;
}

const mockCategories: MockCategory[] = [
  { id: "c1", name: "IT Equipment", description: "Computers, monitors, servers, and software licenses", status: "active" },
  { id: "c2", name: "Office Supplies", description: "Pens, paper, staples, and daily consumables", status: "active" },
  { id: "c3", name: "Facilities & Maintenance", description: "Cleaning supplies, repairs, and building maintenance", status: "active" },
  { id: "c4", name: "Marketing Materials", description: "Brochures, banners, and promotional items", status: "inactive" },
];

const mockVendors: MockVendor[] = [
  { id: "v1", vendorName: "TechPro Solutions", contactPerson: "Alan Smith", email: "alan@techpro.com", phone: "+63 917 123 4567" },
  { id: "v2", vendorName: "National Bookstore Corp", contactPerson: "Maria Santos", email: "corporate@national.com.ph", phone: "+63 2 8123 4567" },
  { id: "v3", vendorName: "OfficeMax Wholesale", contactPerson: "John Doe", email: "j.doe@officemax.com", phone: "+63 920 987 6543" },
];

type Tab = "categories" | "vendors";

// ===== Category Modal =====
function CategoryModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<MockCategory, "id">) => void;
  initialData?: MockCategory;
}) {
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    status: initialData?.status ?? ("active" as MockCategory["status"]),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-secondary">{initialData ? "Edit Category" : "Add Category"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-secondary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1.5">Category Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as MockCategory["status"] })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50">Cancel</button>
            <button onClick={() => onSave(form)} className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Vendor Modal =====
function VendorModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<MockVendor, "id">) => void;
  initialData?: MockVendor;
}) {
  const [form, setForm] = useState({
    vendorName: initialData?.vendorName ?? "",
    contactPerson: initialData?.contactPerson ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-secondary">{initialData ? "Edit Vendor" : "Add Vendor"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-secondary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {(["vendorName", "contactPerson", "email", "phone"] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-secondary mb-1.5 capitalize">{field.replace(/([A-Z])/g, " $1")}</label>
              <input type={field === "email" ? "email" : "text"} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50">Cancel</button>
            <button onClick={() => onSave(form)} className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("categories");
  const [categories, setCategories] = useState<MockCategory[]>(mockCategories);
  const [vendors, setVendors] = useState<MockVendor[]>(mockVendors);

  const [showCatModal, setShowCatModal] = useState(false);
  const [editCat, setEditCat] = useState<MockCategory | null>(null);
  const [deleteCat, setDeleteCat] = useState<MockCategory | null>(null);

  const [showVendModal, setShowVendModal] = useState(false);
  const [editVend, setEditVend] = useState<MockVendor | null>(null);
  const [deleteVend, setDeleteVend] = useState<MockVendor | null>(null);

  const saveCat = (data: Omit<MockCategory, "id">) => {
    if (editCat) {
      setCategories((prev) => prev.map((c) => (c.id === editCat.id ? { ...c, ...data } : c)));
      setEditCat(null);
    } else {
      setCategories((prev) => [...prev, { ...data, id: `c${Date.now()}` }]);
      setShowCatModal(false);
    }
  };

  const saveVend = (data: Omit<MockVendor, "id">) => {
    if (editVend) {
      setVendors((prev) => prev.map((v) => (v.id === editVend.id ? { ...v, ...data } : v)));
      setEditVend(null);
    } else {
      setVendors((prev) => [...prev, { ...data, id: `v${Date.now()}` }]);
      setShowVendModal(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Categories & Vendors"
        subtitle="Manage item categories and approved vendors"
        breadcrumbs={[{ label: "Admin" }, { label: "Categories & Vendors" }]}
        actions={
          <button
            onClick={() => activeTab === "categories" ? setShowCatModal(true) : setShowVendModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {activeTab === "categories" ? "Add Category" : "Add Vendor"}
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-6 pt-4">
        {(["categories", "vendors"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 text-sm font-semibold capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-secondary/50 hover:text-secondary"
            }`}
          >
            {tab} ({tab === "categories" ? categories.length : vendors.length})
          </button>
        ))}
      </div>

      {/* Categories Table */}
      {activeTab === "categories" && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 shadow-sm overflow-hidden">
          {categories.length === 0 ? (
            <EmptyState title="No categories" description="Add a category to get started." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Description</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-semibold text-secondary">{cat.name}</td>
                    <td className="px-6 py-3 text-secondary/70">{cat.description}</td>
                    <td className="px-6 py-3"><StatusBadge status={cat.status} /></td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3 text-xs">
                        <button onClick={() => setEditCat(cat)} className="text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                        <span className="text-slate-200">|</span>
                        <button onClick={() => setDeleteCat(cat)} className="text-red-500 hover:text-red-600 font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Vendors Table */}
      {activeTab === "vendors" && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200 shadow-sm overflow-hidden">
          {vendors.length === 0 ? (
            <EmptyState title="No vendors" description="Add a vendor to get started." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-secondary/50 uppercase font-semibold tracking-wider">
                  <th className="px-6 py-3 text-left">Vendor Name</th>
                  <th className="px-6 py-3 text-left">Contact Person</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Phone</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-semibold text-secondary">{v.vendorName}</td>
                    <td className="px-6 py-3 text-secondary/70">{v.contactPerson}</td>
                    <td className="px-6 py-3 text-secondary/70">{v.email}</td>
                    <td className="px-6 py-3 text-secondary/70">{v.phone}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3 text-xs">
                        <button onClick={() => setEditVend(v)} className="text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                        <span className="text-slate-200">|</span>
                        <button onClick={() => setDeleteVend(v)} className="text-red-500 hover:text-red-600 font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      <CategoryModal isOpen={showCatModal} onClose={() => setShowCatModal(false)} onSave={saveCat} />
      {editCat && <CategoryModal isOpen={!!editCat} onClose={() => setEditCat(null)} onSave={saveCat} initialData={editCat} />}
      <VendorModal isOpen={showVendModal} onClose={() => setShowVendModal(false)} onSave={saveVend} />
      {editVend && <VendorModal isOpen={!!editVend} onClose={() => setEditVend(null)} onSave={saveVend} initialData={editVend} />}

      {/* Delete confirms */}
      {deleteCat && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-secondary mb-2">Delete Category?</h3>
            <p className="text-sm text-secondary/60 mb-4">Delete <strong>{deleteCat.name}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCat(null)} className="flex-1 border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setCategories((p) => p.filter((c) => c.id !== deleteCat.id)); setDeleteCat(null); }} className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
      {deleteVend && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-bold text-secondary mb-2">Delete Vendor?</h3>
            <p className="text-sm text-secondary/60 mb-4">Delete <strong>{deleteVend.vendorName}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteVend(null)} className="flex-1 border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setVendors((p) => p.filter((v) => v.id !== deleteVend.id)); setDeleteVend(null); }} className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
