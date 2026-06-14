const API_URL = "http://127.0.0.1:8000/api";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
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

export interface PRData {
  id: string;
  prNumber: string;
  department: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  requestedBy: string;
  dateRequested: string;
  dueDate: string;
  description?: string;
  notes?: string;
  lineItems?: LineItem[];
  approvals?: any[];
}

export function mapBackendPRToFrontend(pr: any): PRData {
  let status: "pending" | "approved" | "rejected" | "completed" = "pending";
  const hasRejection = pr.approvals?.some((app: any) => app.status === "Reject");

  if (hasRejection) {
    status = "rejected";
  } else if (pr.status === "Approve") {
    status = "approved";
  } else if (pr.status === "Released" || pr.status === "Received") {
    status = "completed";
  } else {
    status = "pending";
  }

  const requesterName = pr.user
    ? `${pr.user.first_name || ""} ${pr.user.last_name || ""}`.trim()
    : "Unknown";

  const dateRequested = pr.created_at ? pr.created_at.split("T")[0] : "";
  const dueDate = pr.created_at
    ? new Date(new Date(pr.created_at).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    : "";

  return {
    id: String(pr.id),
    prNumber: pr.pr_number,
    department: pr.user?.department || "General",
    amount: parseFloat(pr.total_estimated_cost) || 0,
    status,
    requestedBy: requesterName,
    dateRequested,
    dueDate,
    description: pr.purpose_of_requests || "",
    notes: pr.notes || "",
    lineItems: pr.line_items || [],
    approvals: pr.approvals || [],
  };
}

export async function getPurchaseRequests(search = "", department = "", status = ""): Promise<PRData[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (department) params.append("department", department);
  if (status) {
    // Map frontend status to backend status
    let backendStatus = "";
    if (status === "pending") backendStatus = "Request";
    else if (status === "approved") backendStatus = "Approve";
    else if (status === "completed") backendStatus = "Received";
    if (backendStatus) params.append("status", backendStatus);
  }

  const response = await fetch(`${API_URL}/purchase-requests?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to fetch purchase requests");
  }

  const data = await response.json();
  return (data.purchase_requests || []).map(mapBackendPRToFrontend);
}

export async function getPurchaseRequestDetails(id: string): Promise<PRData> {
  const response = await fetch(`${API_URL}/purchase-requests/${id}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to fetch purchase request details");
  }

  const data = await response.json();
  return mapBackendPRToFrontend(data.purchase_request);
}

export async function createPurchaseRequest(data: { description: string; amount: number }): Promise<PRData> {
  const response = await fetch(`${API_URL}/purchase-requests`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      purpose_of_requests: data.description,
      line_items: [
        {
          item_name: data.description.substring(0, 50) || "General Purchase Item",
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

export async function updatePurchaseRequest(id: string, data: { description: string; amount: number; status?: string }): Promise<PRData> {
  let backendStatus = "Request";
  if (data.status === "approved") backendStatus = "Approve";
  else if (data.status === "completed") backendStatus = "Received";

  const response = await fetch(`${API_URL}/purchase-requests/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({
      purpose_of_requests: data.description,
      status: backendStatus,
      line_items: [
        {
          item_name: data.description.substring(0, 50) || "General Purchase Item",
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

export async function approvePurchaseRequest(id: string, comments = ""): Promise<void> {
  const response = await fetch(`${API_URL}/purchase-requests/${id}/approve`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ comments }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to approve purchase request");
  }
}

export async function rejectPurchaseRequest(id: string, comments = ""): Promise<void> {
  const response = await fetch(`${API_URL}/purchase-requests/${id}/reject`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ comments }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to reject purchase request");
  }
}
