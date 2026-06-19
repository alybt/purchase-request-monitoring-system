"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import { createPurchaseRequest } from "@/services/purchase-requests.service";

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

const departments = ["IT", "HR", "Finance", "Operations", "Marketing", "Sales", "Executive"];

export default function CreatePRPage() {
  const router = useRouter();
  const [purpose, setPurpose] = useState("");
  const [department, setDepartment] = useState("IT");
  const [items, setItems] = useState<LineItem[]>([defaultItem()]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.estimatedCost, 0);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim() || items.some((i) => !i.itemName.trim())) return;
    setSubmitting(true);
    
    try {
      await createPurchaseRequest({
        description: purpose,
        amount: totalAmount,
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Failed to create purchase request");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-12">
          <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-secondary mb-2">Request Submitted!</h2>
          <p className="text-secondary/60 text-sm mb-6">
            Your purchase request has been submitted and is pending approval. You will be notified once a decision is made.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-left mb-6">
            <p className="text-xs text-secondary/50 font-semibold uppercase mb-1">Estimated Total</p>
            <p className="text-2xl font-extrabold text-primary">₱{totalAmount.toLocaleString()}</p>
            <p className="text-xs text-secondary/50 mt-1">{items.length} item{items.length > 1 ? "s" : ""} · {department}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setSubmitted(false); setPurpose(""); setItems([defaultItem()]); setAttachments([]); }}
              className="flex-1 border border-slate-200 text-secondary bg-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              New Request
            </button>
            <button
              onClick={() => router.push("/employee/purchase-requests")}
              className="flex-1 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              View My Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Create Purchase Request"
        subtitle="Submit a new procurement request for approval"
        breadcrumbs={[
          { label: "Employee" },
          { label: "My Requests", href: "/employee/purchase-requests" },
          { label: "Create" },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-bold text-secondary mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
            Request Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-secondary mb-1.5">Purpose of Request <span className="text-red-500">*</span></label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
                rows={3}
                placeholder="Describe the reason and objective of this purchase request..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">Department <span className="text-red-500">*</span></label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 w-full">
                <p className="text-xs font-semibold text-primary/70 uppercase mb-1">Estimated Total</p>
                <p className="text-2xl font-extrabold text-primary">₱{totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-secondary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">2</span>
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
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="col-span-12 sm:col-span-3">
                  <input
                    type="text"
                    value={item.itemName}
                    onChange={(e) => updateItem(item.id, "itemName", e.target.value)}
                    required
                    placeholder="Item name *"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                  />
                </div>
                <div className="col-span-12 sm:col-span-4">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    placeholder="Description"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                  />
                </div>
                <div className="col-span-5 sm:col-span-2">
                  <input
                    type="number"
                    value={item.quantity || ""}
                    onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                    min={1}
                    placeholder="Qty"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                  />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <input
                    type="number"
                    value={item.estimatedCost || ""}
                    onChange={(e) => updateItem(item.id, "estimatedCost", e.target.value)}
                    min={0}
                    placeholder="Cost (₱)"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                {item.quantity > 0 && item.estimatedCost > 0 && (
                  <div className="col-span-12 text-right text-xs text-primary font-semibold">
                    Subtotal: ₱{(item.quantity * item.estimatedCost).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Attachments */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-bold text-secondary mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">3</span>
            Attachments <span className="text-secondary/40 font-normal text-sm">(Optional)</span>
          </h2>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              isDragOver ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
            }`}
          >
            <svg className="w-10 h-10 mx-auto text-secondary/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-semibold text-secondary/60">Drop files here or <span className="text-primary">browse</span></p>
            <p className="text-xs text-secondary/40 mt-1">PDF, Word, Excel, Images up to 10MB</p>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
          </div>

          {attachments.length > 0 && (
            <ul className="mt-3 space-y-2">
              {attachments.map((file, i) => (
                <li key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="text-sm text-secondary flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-secondary/40">{(file.size / 1024).toFixed(0)} KB</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                    className="text-slate-300 hover:text-red-500 transition-colors"
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

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-slate-200 text-secondary bg-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed min-w-36"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit Request"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
