const API_URL = "http://127.0.0.1:8000/api";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface Category {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface DepartmentBudget {
  id: number;
  fiscal_year: number;
  allocated: number;
  reserved: number;
  spent: number;
  available: number;
}

export interface CategoryBudget {
  id: number;
  category_id: number;
  category: string;
  allocated: number;
  reserved: number;
  spent: number;
  available: number;
  percentage: number;
}

export interface DepartmentBudgetResponse {
  department_budget: DepartmentBudget | null;
  category_budgets: CategoryBudget[];
}

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_URL}/categories`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to fetch categories");
  }

  const data = await response.json();
  return data.categories || [];
}

export async function getMyDepartmentBudget(): Promise<DepartmentBudgetResponse> {
  const response = await fetch(`${API_URL}/budget/my-department`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to fetch department budget");
  }

  return response.json();
}

export async function getCategoryBudget(categoryId: number): Promise<CategoryBudget | null> {
  const response = await fetch(`${API_URL}/budget/category/${categoryId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to fetch category budget");
  }

  const data = await response.json();
  return data.category_budget ?? null;
}
