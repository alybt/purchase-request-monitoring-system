export const API_URL = "http://127.0.0.1:8000/api";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface AppNotification {
  id: number;
  user_id: number;
  purchase_request_id: number;
  pr_number: string;
  department: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export async function getNotifications(): Promise<{ notifications: AppNotification[], unread_count: number }> {
  const headers = getHeaders();
  if (!headers.Authorization) {
    return { notifications: [], unread_count: 0 };
  }

  const response = await fetch(`${API_URL}/notifications`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401) {
       return { notifications: [], unread_count: 0 };
    }
    throw new Error("Failed to fetch notifications");
  }

  return response.json();
}

export async function markNotificationAsRead(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: "PATCH",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to mark notification as read");
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
    method: "POST",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to mark all notifications as read");
  }
}
