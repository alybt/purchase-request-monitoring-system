const API_URL = "http://127.0.0.1:8000/api";

function getHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface LineItem {
  id?: number;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  vendor?: string;
}

export interface Attachment {
  id: number;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_by?: number;
  uploader?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at?: string;
  download_url?: string;
  preview_url?: string;
}

export interface StatusHistoryItem {
  id?: number;
  purchase_request_id?: number;
  from_status?: string | null;
  to_status: string;
  changed_by?: number;
  changer?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  remarks?: string | null;
  created_at?: string;
}

export interface PRData {
  id: string;
  prNumber: string;
  department: string;
  category?: string;
  categoryId?: number;
  amount: number;
  status:
    | "Draft"
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Ordered"
    | "Received"
    | "Released"
    | "Completed"
    | "pending"
    | string;
  requestedBy: string;
  dateRequested: string;
  dueDate: string;
  description?: string;
  remarks?: string;
  notes?: string;
  lineItems?: LineItem[];
  statusHistory?: StatusHistoryItem[];
  attachments?: Attachment[];

  // Procurement Tracking
  supplierName?: string | null;
  purchaseOrderNumber?: string | null;
  expectedDeliveryDate?: string | null;
  procurementRemarks?: string | null;
  orderedAt?: string | null;
  orderedBy?: number | null;
  orderer?: { id: number; first_name: string; last_name: string } | null;
}

export function mapBackendPRToFrontend(pr: any): PRData {
  const status = pr.status || "Draft";

  const requesterName = pr.requester
    ? `${pr.requester.first_name || ""} ${pr.requester.last_name || ""}`.trim()
    : pr.user
      ? `${pr.user.first_name || ""} ${pr.user.last_name || ""}`.trim()
      : "Unknown";

  const departmentName =
    pr.department?.name || pr.requester?.department?.name || "General";

  const dateRequested = pr.created_at ? pr.created_at.split("T")[0] : "";
  const dueDate = pr.created_at
    ? new Date(new Date(pr.created_at).getTime() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]
    : "";

  return {
    id: String(pr.id),
    prNumber: pr.pr_number,
    department: departmentName,
    category:
      typeof pr.category === "string"
        ? pr.category
        : pr.category?.name ||
          pr.category_name ||
          pr.categoryName ||
          pr.category?.category_name ||
          pr.category?.categoryName ||
          "",
    categoryId:
      pr.category_id ||
      pr.category?.id ||
      pr.category?.category_id ||
      pr.category?.categoryId ||
      pr.category?.category_id,
    amount: parseFloat(pr.total_estimated_cost) || 0,
    status,
    requestedBy: requesterName,
    dateRequested,
    dueDate,
    description: pr.purpose || pr.purpose_of_requests || "",
    remarks: pr.remarks || pr.notes || "",
    notes: pr.remarks || pr.notes || "",
    lineItems: pr.items || pr.line_items || pr.purchase_request_items || [],
    statusHistory: pr.status_history || pr.statusHistory || [],
    attachments: (pr.attachments || []).map((att: any) => ({
      ...att,
      preview_url: att.file_path
        ? `http://127.0.0.1:8000/storage/${att.file_path}`
        : undefined,
    })),

    // Procurement Fields
    supplierName: pr.supplier_name || null,
    purchaseOrderNumber: pr.purchase_order_number || null,
    expectedDeliveryDate: pr.expected_delivery_date
      ? pr.expected_delivery_date.split("T")[0]
      : null,
    procurementRemarks: pr.procurement_remarks || null,
    orderedAt: pr.ordered_at || null,
    orderedBy: pr.ordered_by || null,
    orderer: pr.orderer || null,
  };
}

export async function getPurchaseRequests(
  search = "",
  department = "",
  status = "",
  fiscalYear: number | "" = "",
  month: number | null = null,
): Promise<PRData[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (department) params.append("department", department);
  if (status) params.append("status", status);
  if (fiscalYear) params.append("fiscalYear", String(fiscalYear));
  if (month !== null) params.append("month", String(month));

  const response = await fetch(
    `${API_URL}/purchase-requests?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to fetch purchase requests");
  }

  const data = await response.json();
  return (data.purchase_requests || []).map(mapBackendPRToFrontend);
}

export async function getPurchaseRequestsSummary(
  fiscalYear: number | "" = "",
  month: number | null = null,
): Promise<
  Record<string, number>
> {
  const params = new URLSearchParams();
  if (fiscalYear) params.append("fiscalYear", String(fiscalYear));
  if (month !== null) params.append("month", String(month));

  const response = await fetch(`${API_URL}/purchase-requests/summary?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(
      errData.message || "Failed to fetch purchase requests summary",
    );
  }

  const data = await response.json();
  return data.counts || {};
}

export async function getPurchaseRequestDetails(id: string): Promise<PRData> {
  const response = await fetch(`${API_URL}/purchase-requests/${id}`, {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(
      errData.message || "Failed to fetch purchase request details",
    );
  }

  const data = await response.json();
  return mapBackendPRToFrontend(data.purchase_request);
}

export async function createPurchaseRequest(data: {
  description: string;
  amount: number;
  category_id?: number;
  lineItems?: LineItem[];
  status?: string;
}): Promise<PRData> {
  const response = await fetch(`${API_URL}/purchase-requests`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      purpose_of_requests: data.description,
      purpose: data.description,
      category_id: data.category_id || null,
      status: data.status,
      line_items:
        data.lineItems && data.lineItems.length > 0
          ? data.lineItems
          : [
              {
                item_name:
                  data.description.substring(0, 50) || "General Purchase Item",
                description: data.description,
                quantity: 1,
                unit_price: data.amount,
                vendor: "General Vendor",
              },
            ],
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to create purchase request");
  }

  const resData = await response.json();
  return mapBackendPRToFrontend(resData.purchase_request);
}

export async function updatePurchaseRequest(
  id: string,
  data: {
    description: string;
    amount: number;
    status?: string;
    category_id?: number;
    lineItems?: LineItem[];
  },
): Promise<PRData> {
  const response = await fetch(`${API_URL}/purchase-requests/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({
      purpose: data.description,
      status: data.status,
      category_id: data.category_id || null,
      line_items:
        data.lineItems && data.lineItems.length > 0
          ? data.lineItems
          : [
              {
                item_name:
                  data.description.substring(0, 50) || "General Purchase Item",
                description: data.description,
                quantity: 1,
                unit_price: data.amount,
                vendor: "General Vendor",
              },
            ],
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to update purchase request");
  }

  const resData = await response.json();
  return mapBackendPRToFrontend(resData.purchase_request);
}

export async function updatePurchaseRequestStatus(
  id: string,
  status: string,
  remarks?: string,
): Promise<PRData> {
  const response = await fetch(`${API_URL}/purchase-requests/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({
      status,
      remarks,
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(
      errData.message || "Failed to update purchase request status",
    );
  }

  const resData = await response.json();
  return mapBackendPRToFrontend(resData.purchase_request);
}

export async function deletePurchaseRequest(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/purchase-requests/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to delete purchase request");
  }
}

export async function bulkDeletePurchaseRequests(ids: string[]): Promise<void> {
  const response = await fetch(`${API_URL}/purchase-requests/bulk-delete`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      ids: ids.map(Number),
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to delete purchase requests");
  }
}

export async function approvePurchaseRequest(
  id: string,
  comments?: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/purchase-requests/${id}/approve`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ comments: comments || "" }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to approve purchase request");
  }
}

export async function rejectPurchaseRequest(
  id: string,
  comments?: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/purchase-requests/${id}/reject`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ comments: comments || "" }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to reject purchase request");
  }
}

export async function uploadPRAttachments(
  id: string,
  files: File[],
): Promise<PRData> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files[]", file);
  });

  const response = await fetch(
    `${API_URL}/purchase-requests/${id}/attachments`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to upload attachments");
  }

  const resData = await response.json();
  return mapBackendPRToFrontend(resData.purchase_request);
}

export async function deletePRAttachment(
  prId: string,
  attachmentId: number,
): Promise<PRData> {
  const response = await fetch(
    `${API_URL}/purchase-requests/${prId}/attachments/${attachmentId}`,
    {
      method: "DELETE",
      headers: getHeaders(),
    },
  );

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to delete attachment");
  }

  const resData = await response.json();
  return mapBackendPRToFrontend(resData.purchase_request);
}

export async function downloadPRAttachment(
  prId: string,
  attachmentId: number,
  fileName: string,
): Promise<void> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const response = await fetch(
    `${API_URL}/purchase-requests/${prId}/attachments/${attachmentId}/download`,
    {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to download attachment");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
