const API_URL = "http://127.0.0.1:8000/api";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface DashboardMetrics {
  total_spent: number;
  total_spent_change_percentage: number;
  bottlenecks: number;
  active_users: number;
  monthly_data: Array<{ month: string; spent: number }>;
  department_breakdown: Array<{ department: string; pr_count: number; total_spent: number }>;
}

export interface RecentPR {
  id: number;
  pr_number: string;
  purpose_of_requests: string;
  status: string;
  total_estimated_cost: string;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    department: string;
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await fetch(`${API_URL}/dashboard/metrics`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to fetch dashboard metrics");
  }

  const data = await response.json();
  return data.metrics;
}

export async function getRecentPRs(): Promise<RecentPR[]> {
  const response = await fetch(`${API_URL}/dashboard/recent-prs`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to fetch recent purchase requests");
  }

  const data = await response.json();
  return data.recent_purchase_requests || [];
}

export async function getPendingApprovals(): Promise<RecentPR[]> {
  const response = await fetch(`${API_URL}/dashboard/pending-approvals`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to fetch pending approvals");
  }

  const data = await response.json();
  return data.pending_approvals || [];
}
