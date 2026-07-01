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
    cache: "no-store",
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to fetch categories");
  }

  const data = await response.json();
  return data.categories || [];
}

export async function getMyDepartmentBudget(
  fiscalYear?: number | "",
  month?: number | null
): Promise<DepartmentBudgetResponse> {
  const params = new URLSearchParams();
  if (fiscalYear) params.append("fiscal_year", String(fiscalYear));
  if (month) params.append("month", String(month));
  const queryString = params.toString() ? `?${params.toString()}` : "";

  const response = await fetch(`${API_URL}/budget/my-department${queryString}`, {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to fetch department budget");
  }

  return response.json();
}

export async function getCategoryBudget(
  categoryId: number,
  fiscalYear?: number | "",
  month?: number | null
): Promise<CategoryBudget | null> {
  const params = new URLSearchParams();
  if (fiscalYear) params.append("fiscal_year", String(fiscalYear));
  if (month) params.append("month", String(month));
  const queryString = params.toString() ? `?${params.toString()}` : "";

  const response = await fetch(`${API_URL}/budget/category/${categoryId}${queryString}`, {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to fetch category budget");
  }

  const data = await response.json();
  return data.category_budget ?? null;
}

export async function bulkAllocateCategoryBudget(fiscalYear: number, allocations: { category_id: number; allocated_amount: number }[]): Promise<void> {
  const response = await fetch(`${API_URL}/budget/category/allocate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ fiscal_year: fiscalYear, allocations }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to allocate category budgets");
  }
}

export interface MonthlyBreakdownItem {
  month: number;
  allocated: number;
  reserved: number;
  spent: number;
  available: number;
}

export interface DeptSummaryWithBreakdown {
  department_id: number;
  department: string;
  code: string;
  allocated: number;
  reserved: number;
  spent: number;
  available: number;
  percentage: number;
  monthly_breakdown?: MonthlyBreakdownItem[];
}

export interface BudgetSummaryResponse {
  fiscal_year: number;
  month: number | null;
  total_allocated: number;
  total_reserved: number;
  total_spent: number;
  total_available: number;
  department_summaries: DeptSummaryWithBreakdown[];
}

export async function getBudgetSummary(fiscalYear?: number, month?: number | null): Promise<BudgetSummaryResponse> {
  const params = new URLSearchParams();
  if (fiscalYear) params.append("fiscal_year", String(fiscalYear));
  if (month) params.append("month", String(month));

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${API_URL}/departments/budget-summary${queryString}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || "Failed to fetch budget summary");
  }

  return response.json();
}

export async function updateDepartmentBudget(
  departmentId: number,
  data: { allocated_amount: number; fiscal_year?: number; month?: number }
): Promise<any> {
  const response = await fetch(`${API_URL}/departments/${departmentId}/budget`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(responseData.message || "Failed to update budget");
  }

  return responseData;
}

// ─── Company Budget ───────────────────────────────────────────────────────────

export interface CompanyBudget {
  id: number;
  fiscal_year: number;
  total_budget: number;
  carry_forward: number;
  allocated_amount: number;
  available_amount: number;
}

export async function getAllCompanyBudgets(): Promise<CompanyBudget[]> {
  const response = await fetch(`${API_URL}/company-budget`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to fetch company budgets");
  }
  const data = await response.json();
  return data.budgets || [];
}

export async function getAvailableFiscalYears(): Promise<number[]> {
  const response = await fetch(`${API_URL}/fiscal-years`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    return [new Date().getFullYear()];
  }
  const data = await response.json().catch(() => ({}));
  return data.years || [new Date().getFullYear()];
}

export async function getCompanyBudget(fiscalYear: number): Promise<CompanyBudget | null> {
  const response = await fetch(`${API_URL}/company-budget/${fiscalYear}`, {
    headers: getHeaders(),
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to fetch company budget");
  }
  const data = await response.json();
  return data.budget ?? null;
}

export async function upsertCompanyBudget(
  fiscalYear: number,
  totalBudget: number,
  carryForward: number = 0
): Promise<CompanyBudget> {
  const response = await fetch(`${API_URL}/company-budget`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ fiscal_year: fiscalYear, total_budget: totalBudget, carry_forward: carryForward }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err: any = new Error(data.message || "Failed to save company budget");
    err.errors = data.errors || {};
    throw err;
  }
  return data.budget;
}

