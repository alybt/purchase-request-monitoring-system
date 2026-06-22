// Auth utility helpers — client-side only (localStorage-based)

export type AppRole = "admin" | "department_head";

export interface StoredUser {
  id?: string | number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: AppRole;
  department?: string;
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getUserRole(): AppRole | null {
  const user = getStoredUser();
  return user?.role ?? null;
}

export function getUserDisplayName(user: StoredUser | null): string {
  if (!user) return "User";
  if (user.name) return user.name;
  const parts = [user.first_name, user.last_name].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return user.email?.split("@")[0] ?? "User";
}

export function getUserInitial(user: StoredUser | null): string {
  const name = getUserDisplayName(user);
  return name.charAt(0).toUpperCase();
}

/** Returns the home route for a given role */
export function roleHomePath(role: AppRole | null): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "department_head":
      return "/department-head/dashboard";
    default:
      return "/login";
  }
}
