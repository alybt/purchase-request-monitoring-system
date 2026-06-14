const API_URL = "http://127.0.0.1:8000/api";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface UserResponse {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  role: "admin" | "approver" | "employee";
  status: "active" | "suspended" | "dismissed";
  department: string;
  created_at: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  department: string;
  role: "admin" | "approver" | "requester";
  status: "active" | "inactive";
  joinDate: string;
}

export function mapBackendUserToFrontend(user: UserResponse): UserData {
  return {
    id: String(user.id),
    name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
    email: user.email,
    department: user.department || "",
    role: user.role === "employee" ? "requester" : user.role,
    status: user.status === "suspended" ? "inactive" : "active",
    joinDate: user.created_at ? user.created_at.split("T")[0] : "",
  };
}

export function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  let first_name = parts[0] || "";
  let last_name = "";
  if (parts.length > 1) {
    last_name = parts.pop() || "";
    first_name = parts.join(" ");
  }
  return { first_name, last_name };
}

export async function getUsers(search = "", role = "", status = "", department = ""): Promise<UserData[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (role) {
    const backendRole = role === "requester" ? "employee" : role;
    params.append("role", backendRole);
  }
  if (status) {
    const backendStatus = status === "inactive" ? "suspended" : status;
    params.append("status", backendStatus);
  }
  if (department) params.append("department", department);

  const response = await fetch(`${API_URL}/users?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to fetch users");
  }

  const data = await response.json();
  return (data.users || []).map(mapBackendUserToFrontend);
}

export async function createUser(data: { name: string; email: string; department: string; role: string; status: string }): Promise<UserData> {
  const { first_name, last_name } = splitFullName(data.name);
  const backendRole = data.role === "requester" ? "employee" : data.role;
  const backendStatus = data.status === "inactive" ? "suspended" : data.status;

  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      first_name,
      last_name,
      email: data.email,
      department: data.department,
      role: backendRole,
      status: backendStatus,
      password: "password123", // Default password for new users
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to create user");
  }

  const resData = await response.json();
  return mapBackendUserToFrontend(resData.user);
}

export async function updateUser(id: string, data: { name: string; email: string; department: string; role: string; status: string }): Promise<UserData> {
  const { first_name, last_name } = splitFullName(data.name);
  const backendRole = data.role === "requester" ? "employee" : data.role;
  const backendStatus = data.status === "inactive" ? "suspended" : data.status;

  const response = await fetch(`${API_URL}/users/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({
      first_name,
      last_name,
      email: data.email,
      department: data.department,
      role: backendRole,
      status: backendStatus,
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to update user");
  }

  const resData = await response.json();
  return mapBackendUserToFrontend(resData.user);
}

export async function deleteUser(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to delete user");
  }
}

export async function bulkDeleteUsers(ids: string[]): Promise<void> {
  const response = await fetch(`${API_URL}/users/bulk-delete`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      ids: ids.map(Number),
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to delete users");
  }
}
