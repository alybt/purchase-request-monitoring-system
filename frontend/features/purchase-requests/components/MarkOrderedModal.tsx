import { useState, useEffect } from "react";
import type { PRData } from "@/services/purchase-requests.service";

interface MarkOrderedModalProps {
  isOpen: boolean;
  pr: PRData | null;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function MarkOrderedModal({ isOpen, pr, onClose, onSubmit }: MarkOrderedModalProps) {
  const [supplierName, setSupplierName] = useState("");
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [procurementRemarks, setProcurementRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSupplierName("");
      setPurchaseOrderNumber("");
      setExpectedDeliveryDate("");
      setProcurementRemarks("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !pr) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        status: "Ordered",
        supplier_name: supplierName || null,
        purchase_order_number: purchaseOrderNumber || null,
        expected_delivery_date: expectedDeliveryDate || null,
        procurement_remarks: procurementRemarks || null,
      });
      onClose();
    } catch (err) {
      console.error("Failed to mark as ordered", err);
      // In a real app, you might show a toast error here
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toLocaleDateString("en-CA"); // Gets YYYY-MM-DD local time

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal */}
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative transform transition-all scale-100 opacity-100 border-t-4 border-t-blue-500 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-8 pb-4 flex flex-col items-center text-center shrink-0">
          {/* Icon */}
          <div className="p-4 rounded-full bg-blue-100 text-blue-600 mb-5 shadow-sm">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>

          {/* Header */}
          <h3 id="modal-title" className="text-xl font-extrabold text-secondary mb-2">
            Mark as Ordered
          </h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Confirm that procurement has started for this Purchase Request.
          </p>
        </div>

        <div className="px-8 pb-6 overflow-y-auto flex-1">
          <form id="mark-ordered-form" onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1">
                Supplier Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Enter supplier name"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-secondary placeholder-slate-400 transition-colors"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-1">
                Purchase Order / Reference Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={purchaseOrderNumber}
                onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                placeholder="PO Number or Reference No."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-secondary placeholder-slate-400 transition-colors"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-1">
                Expected Delivery Date <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                min={today}
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-secondary transition-colors"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-1">
                Procurement Remarks <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={procurementRemarks}
                onChange={(e) => setProcurementRemarks(e.target.value)}
                placeholder="Additional procurement notes (optional)"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-secondary placeholder-slate-400 resize-none transition-colors"
                disabled={isSubmitting}
              />
            </div>
          </form>
        </div>

        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex gap-3 flex-col sm:flex-row sm:justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 transition-colors w-full sm:w-auto disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="mark-ordered-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </>
            ) : (
              "Confirm Order"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
