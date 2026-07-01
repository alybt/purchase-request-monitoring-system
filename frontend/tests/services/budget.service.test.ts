import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCategories,
  getMyDepartmentBudget,
  getCategoryBudget,
  getBudgetSummary,
  updateDepartmentBudget,
  getAllCompanyBudgets,
  getCompanyBudget,
  upsertCompanyBudget,
} from '@/services/budget.service';

describe('budget.service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('getCategories fetches and returns list of categories', async () => {
    const mockCategories = [{ id: 1, name: 'IT Equipment', code: 'IT' }];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ categories: mockCategories }),
    });

    const categories = await getCategories();
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/categories', expect.any(Object));
    expect(categories).toEqual(mockCategories);
  });

  it('getMyDepartmentBudget fetches department budget response', async () => {
    const mockRes = { department_budget: { id: 1, allocated: 1000 }, category_budgets: [] };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRes,
    });

    const res = await getMyDepartmentBudget();
    expect(res).toEqual(mockRes);
  });

  it('getCategoryBudget fetches category budget or returns null', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ category_budget: { id: 5, allocated: 500 } }),
    });

    const cb = await getCategoryBudget(5);
    expect(cb).toEqual({ id: 5, allocated: 500 });
  });

  it('getBudgetSummary passes query parameters properly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total_allocated: 1000 }),
    });

    await getBudgetSummary(2026, 6);
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/departments/budget-summary?fiscal_year=2026&month=6', expect.any(Object));
  });

  it('updateDepartmentBudget sends PUT request', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Success' }),
    });

    const res = await updateDepartmentBudget(2, { allocated_amount: 50000, fiscal_year: 2026, month: 6 });
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/departments/2/budget', {
      method: 'PUT',
      headers: expect.any(Object),
      body: JSON.stringify({ allocated_amount: 50000, fiscal_year: 2026, month: 6 }),
    });
    expect(res).toEqual({ message: 'Success' });
  });

  it('company budget functions (getAllCompanyBudgets, getCompanyBudget, upsertCompanyBudget)', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ budgets: [{ fiscal_year: 2026, total_budget: 1000 }] }),
    });
    const all = await getAllCompanyBudgets();
    expect(all).toEqual([{ fiscal_year: 2026, total_budget: 1000 }]);

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ budget: { fiscal_year: 2026, total_budget: 1000 } }),
    });
    const single = await getCompanyBudget(2026);
    expect(single).toEqual({ fiscal_year: 2026, total_budget: 1000 });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ budget: { fiscal_year: 2027, total_budget: 2000 } }),
    });
    const upserted = await upsertCompanyBudget(2027, 2000, 0);
    expect(upserted).toEqual({ fiscal_year: 2027, total_budget: 2000 });
  });
});
