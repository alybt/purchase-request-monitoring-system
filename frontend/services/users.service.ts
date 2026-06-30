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

export interface UserResponse {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  role: "admin" | "department_head";
  status: "active" | "suspended" | "dismissed";
  department?: any;
  department_id?: number | null;
  created_at: string;
}

export interface UserData {
  id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  name: string;
  email: string;
  department: string;
  role: "admin" | "department_head";
  status: "active" | "inactive";
  joinDate: string;
}

export function mapBackendUserToFrontend(user: UserResponse): UserData {
  const fullName = [user.first_name, user.middle_name, user.last_name]
    .filter(Boolean)
    .join(" ");

  return {
    id: String(user.id),
    first_name: user.first_name,
    middle_name: user.middle_name || null,
    last_name: user.last_name,
    name: fullName,
    email: user.email,
    department: user.department?.name || (typeof user.department === "string" ? user.department : ""),
    role: user.role,
    status: user.status === "suspended" ? "inactive" : "active",
    joinDate: user.created_at ? user.created_at.split("T")[0] : "",
  };
}

export async function getUsers(
  search = "",
  role = "",
  status = "",
  department = "",
): Promise<UserData[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (role) params.append("role", role);
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

export async function createUser(data: {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  department: string;
  role: string;
  status: string;
  password: string;
  password_confirmation: string;
}): Promise<UserData> {
  const backendStatus = data.status === "inactive" ? "suspended" : data.status;

  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      first_name: data.first_name,
      middle_name: data.middle_name || null,
      last_name: data.last_name,
      email: data.email,
      department: data.department,
      role: data.role,
      status: backendStatus,
      password: data.password,
      password_confirmation: data.password_confirmation,
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    const err: any = new Error(errData.message || "Failed to create user");
    err.errors = errData.errors || {};
    throw err;
  }

  const resData = await response.json();
  return mapBackendUserToFrontend(resData.user);
}


export async function updateUser(
  id: string,
  data: {
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    email: string;
    department: string;
    role: string;
    status: string;
  },
): Promise<UserData> {
  const backendStatus = data.status === "inactive" ? "suspended" : data.status;

  const response = await fetch(`${API_URL}/users/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({
      first_name: data.first_name,
      middle_name: data.middle_name || null,
      last_name: data.last_name,
      email: data.email,
      department: data.department,
      role: data.role,
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
