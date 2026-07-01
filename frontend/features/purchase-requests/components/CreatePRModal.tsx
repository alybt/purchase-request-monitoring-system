"use client";

import { useState, useEffect, useRef } from "react";
import { getCategories, getCategoryBudget } from "@/services/budget.service";
import type { Category, CategoryBudget } from "@/services/budget.service";
import { uploadPRAttachments } from "@/services/purchase-requests.service";

interface LineItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  estimatedCost: number;
}

const defaultItem = (): LineItem => ({
  id: String(Date.now() + Math.random()),
  itemName: "",
  description: "",
  quantity: 1,
  estimatedCost: 0,
});

interface CreatePRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  prIdToEdit?: string | null;
}
export default function CreatePRModal({ isOpen, onClose, onCreated, prIdToEdit }: CreatePRModalProps) {
  const [category, setCategory] = useState("");
  const [purpose, setPurpose] = useState("");
  const [items, setItems] = useState<LineItem[]>([defaultItem()]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = isSavingDraft || isSubmitting;
  const [isPending, setIsPending] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<'Draft' | 'Pending' | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);

  // Live data from API
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryBudget, setCategoryBudget] = useState<CategoryBudget | null>(null);
  const [prStatus, setPrStatus] = useState<string | null>(null);
  const [rejectionRemarks, setRejectionRemarks] = useState<{ by: string, on: string, reason: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      getCategories().then(setCategories).catch(console.error);
      setCategory("");
      setPurpose("");
      setItems([defaultItem()]);
      setAttachments([]);
      setIsPending(false);
      setSubmittedStatus(null);
      setError("");
      setPrStatus(null);
      setRejectionRemarks(null);

      if (prIdToEdit) {
        // Fetch existing PR details
        fetch(`http://127.0.0.1:8000/api/purchase-requests/${prIdToEdit}`, {
          headers: {
            "Accept": "application/json",
            ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}),
          }
        }).then(res => res.json())
          .then(data => {
            const pr = data.purchase_request;
            if (pr) {
              setPrStatus(pr.status);
              if (pr.status === "Rejected" && pr.status_history) {
                const rejectedHist = [...pr.status_history].reverse().find((h: any) => h.to_status === "Rejected");
                if (rejectedHist) {
                  setRejectionRemarks({
                    by: rejectedHist.user?.name || "Administrator",
                    on: new Date(rejectedHist.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
                    reason: rejectedHist.remarks || "No reason provided."
                  });
                }
              }
              setPurpose(pr.purpose || "");
              setCategory(pr.category_id ? pr.category_id.toString() : "");
              if (pr.items && pr.items.length > 0) {
                setItems(pr.items.map((i: any) => ({
                  id: i.id.toString(),
                  itemName: i.item_name,
                  description: i.description || "",
                  quantity: i.quantity,
                  estimatedCost: i.unit_price,
                })));
              }
            }
          })
          .catch(err => console.error("Failed to load PR details", err));
      }
    }
  }, [isOpen, prIdToEdit]);

  useEffect(() => {
    if (!category) { setCategoryBudget(null); return; }
    getCategoryBudget(Number(category))
      .then(setCategoryBudget)
      .catch(() => setCategoryBudget(null));
  }, [category]);

  const itemsTotal = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.estimatedCost || 0), 0);

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: field === "quantity" || field === "estimatedCost" ? Number(value) : value } : item
      )
    );
  };

  const addItem = () => setItems((prev) => [...prev, defaultItem()]);

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleSubmit = async (e: React.FormEvent, status: 'Draft' | 'Pending' = 'Pending') => {
    e.preventDefault();
    setError("");

    if (status === 'Pending') {
      if (!purpose.trim() || !category || items.some((i) => !i.itemName.trim())) {
        setError("Please fill out all required fields.");
        return;
      }
      if (categoryBudget && itemsTotal > categoryBudget.available) {
        setError(`This Purchase Request exceeds the remaining category budget by ₱${(itemsTotal - categoryBudget.available).toLocaleString()}.`);
        return;
      }
    }

    if (status === 'Draft') setIsSavingDraft(true);
    else setIsSubmitting(true);

    try {
      const API_URL = "http://127.0.0.1:8000/api";
      const token = localStorage.getItem("token");

      const url = prIdToEdit 
        ? `${API_URL}/purchase-requests/${prIdToEdit}` 
        : `${API_URL}/purchase-requests`;
      
      const method = prIdToEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          purpose: purpose || "",
          category_id: category ? Number(category) : null,
          status: status,
          line_items: items.filter(i => i.itemName.trim()).map((item) => ({
            item_name: item.itemName,
            description: item.description,
            quantity: item.quantity || 0,
            unit_price: item.estimatedCost || 0,
            vendor: "", // Supplier can be added
          })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to create purchase request");
      }

      const pr = await response.json();
      const prId = pr.purchase_request?.id || pr.id;

      if (attachments.length > 0 && prId) {
        await uploadPRAttachments(prId, attachments);
      }

      setSubmittedStatus(status);
      setIsPending(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create purchase request");
    } finally {
      setIsSavingDraft(false);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (isPending) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-secondary mb-2">
            {submittedStatus === 'Draft' ? 'Draft saved successfully.' : 'Request Pending Approval!'}
          </h2>
          <p className="text-secondary text-sm mb-6">
            {submittedStatus === 'Draft' 
              ? 'Purchase request saved as draft successfully. This request has not been submitted yet and is only visible to you until you submit it for approval.'
              : 'Your purchase request has been submitted and is pending approval. You will be notified once a decision is made.'}
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 border border-slate-100">
            <p className="text-xs text-secondary font-semibold uppercase mb-1">Total Request Amount</p>
            <p className="text-2xl font-extrabold text-primary">₱{itemsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-secondary mt-1">{items.length} item{items.length > 1 ? "s" : ""} · {categories.find(c => c.id === Number(category))?.name}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setIsPending(false); setPurpose(""); setCategory(""); setItems([defaultItem()]); setAttachments([]); }}
              className="flex-1 border border-slate-200 text-secondary bg-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              New Request
            </button>
            <button
              onClick={() => {
                onCreated();
                onClose();
              }}
              className="flex-1 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              View My Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  const categoryRemaining = categoryBudget?.available ?? 0;
  const remainingAfterRequest = categoryRemaining - itemsTotal;
  const budgetExceeded = categoryBudget ? itemsTotal > categoryRemaining : false;
  
  let utilizationPercentage = 0;
  if (categoryBudget && categoryBudget.allocated > 0) {
    utilizationPercentage = (itemsTotal / categoryBudget.allocated) * 100;
  }
  
  const utilizationColor = utilizationPercentage < 70 ? "bg-emerald-500" : utilizationPercentage < 90 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-white shrink-0 flex items-center justify-between">
          <h1 className="text-xl font-black text-secondary tracking-tight">
            {prIdToEdit ? (prStatus === "Rejected" ? "Edit & Resubmit Purchase Request" : "Edit Purchase Request") : "Create Purchase Request"}
          </h1>
          <button onClick={onClose} className="p-2 text-secondary hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {prStatus === "Rejected" && rejectionRemarks && (
          <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-start gap-4">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-800 mb-1">Rejected Remarks</h3>
              <div className="text-xs text-red-600/80 mb-2 flex gap-4">
                <span><span className="font-semibold">Rejected By:</span> {rejectionRemarks.by}</span>
                <span><span className="font-semibold">Rejected On:</span> {rejectionRemarks.on}</span>
              </div>
              <div className="text-sm text-red-700 bg-red-100/50 p-3 rounded-xl border border-red-200/50 font-medium">
                <span className="font-bold block mb-1">Reason:</span>
                {rejectionRemarks.reason}
              </div>
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 flex flex-col">
          <form id="create-pr-form" onSubmit={(e) => handleSubmit(e, 'Pending')} className="space-y-6 flex flex-col">
            
            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex gap-2">
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}

            {/* Section 1: Purchase Request Information */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-secondary mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
                Purchase Request Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-secondary">Department</label>
                  <input 
                    type="text" 
                    value={user?.department?.name || "Information Technology"} 
                    disabled 
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 cursor-not-allowed text-black placeholder:text-gray-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-secondary">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white text-black placeholder:text-gray-600"
                  >
                    <option value="" disabled>Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-sm font-semibold text-secondary">Purpose / Justification</label>
                  <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows={2}
                    placeholder="Describe the reason and objective of this purchase request..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none bg-white text-black placeholder:text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Budget Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 shrink-0">
              <h2 className="text-base font-bold text-secondary mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
                Budget Summary
              </h2>
              
              {categoryBudget ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <p className="text-xs text-secondary font-medium uppercase tracking-wider mb-1">Department</p>
                      <p className="text-sm font-semibold text-secondary">{user?.department?.name || "Information Technology"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary font-medium uppercase tracking-wider mb-1">Category</p>
                      <p className="text-sm font-semibold text-secondary">{categories.find(c => c.id === Number(category))?.name || "Hardware"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary font-medium uppercase tracking-wider mb-1">Fiscal Year</p>
                      <p className="text-sm font-semibold text-secondary">FY {new Date().getFullYear()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <p className="text-xs text-secondary font-medium mb-1">Category Budget</p>
                      <p className="text-base font-bold text-secondary">₱{categoryBudget.allocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary font-medium mb-1">Allocated Amount</p>
                      <p className="text-base font-bold text-secondary">₱{categoryBudget.allocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary font-medium mb-1">Current Remaining</p>
                      <p className="text-base font-bold text-emerald-600">₱{categoryRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-secondary font-medium mb-1">Current Request Total</p>
                      <p className="text-xl font-extrabold text-primary">₱{itemsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary font-medium mb-1">Remaining After Request</p>
                      <p className={`text-xl font-extrabold ${budgetExceeded ? 'text-red-600' : 'text-emerald-600'}`}>
                        ₱{remainingAfterRequest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-secondary uppercase tracking-wider">Budget Utilization</span>
                      <span className={utilizationPercentage > 90 ? "text-red-600" : "text-secondary"}>{utilizationPercentage.toFixed(2)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${utilizationColor} transition-all duration-300`} 
                        style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {budgetExceeded && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                      <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <div>
                        <p className="text-sm font-bold text-red-800">Budget Exceeded</p>
                        <p className="text-xs text-red-700 mt-0.5">This Purchase Request exceeds the remaining category budget by <span className="font-bold">₱{(itemsTotal - categoryRemaining).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>.</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-secondary border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <svg className="w-8 h-8 mx-auto text-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" /></svg>
                  <p className="text-sm">Please select a category to view budget summary.</p>
                </div>
              )}
            </div>

            {/* Section 3: Items */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-secondary flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
                  Items
                </h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Item
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs text-secondary uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3 w-1/4">Item Name</th>
                      <th className="px-4 py-3 w-1/4">Description</th>
                      <th className="px-4 py-3 w-24">Quantity</th>
                      <th className="px-4 py-3 w-32">Unit Cost</th>
                      <th className="px-4 py-3 w-32 text-right">Line Total</th>
                      <th className="px-4 py-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <tr key={item.id} className="bg-white hover:bg-slate-50/50">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => updateItem(item.id, "itemName", e.target.value)}
                            placeholder="Item name"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-black placeholder:text-gray-600"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, "description", e.target.value)}
                            placeholder="Optional details"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-black placeholder:text-gray-600"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.quantity || ""}
                            onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                            min={1}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-black placeholder:text-gray-600"
                          />
                        </td>
                        <td className="p-2">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary">₱</span>
                            <input
                              type="number"
                              value={item.estimatedCost || ""}
                              onChange={(e) => updateItem(item.id, "estimatedCost", e.target.value)}
                              min={0}
                              className="w-full border border-slate-200 rounded-lg pl-6 pr-3 py-2 text-sm focus:outline-none focus:border-primary text-black placeholder:text-gray-600"
                            />
                          </div>
                        </td>
                        <td className="p-4 text-right font-bold text-secondary">
                          ₱{((item.quantity || 0) * (item.estimatedCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                            className="p-1.5 text-secondary hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right font-semibold text-secondary uppercase text-xs tracking-wider">
                        Items Total
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-primary text-base">
                        ₱{itemsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Section 4: Attachments */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-secondary mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">4</span>
                Attachments <span className="text-secondary font-normal text-sm">(Optional)</span>
              </h2>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragOver ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
                }`}
              >
                <svg className="w-10 h-10 mx-auto text-secondary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-semibold text-secondary">Drop files here or <span className="text-primary">browse</span></p>
                <p className="text-xs text-secondary mt-1">PDF, Word, Excel, Images up to 10MB</p>
                <input ref={fileInputRef} type="file" multiple className="hidden text-black placeholder:text-gray-600" onChange={handleFileSelect} />
              </div>

              {attachments.length > 0 && (
                <ul className="mt-3 space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachments.map((file, i) => (
                    <li key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm text-secondary flex-1 truncate font-medium">{file.name}</span>
                      <span className="text-xs text-secondary">{(file.size / 1024).toFixed(0)} KB</span>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                        className="text-secondary hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'Draft')}
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 min-w-[140px]"
          >
            {isSavingDraft ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Saving Draft...
              </>
            ) : (
              "Save as Draft"
            )}
          </button>
          <button
            type="submit"
            form="create-pr-form"
            disabled={submitting || budgetExceeded || !category || items.some(i => !i.itemName) || !purpose}
            className="px-8 py-2.5 text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 min-w-[160px]"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                {prStatus === "Rejected" ? "Resubmitting..." : "Submitting..."}
              </>
            ) : (
              prStatus === "Rejected" ? "Resubmit" : "Submit Request"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
