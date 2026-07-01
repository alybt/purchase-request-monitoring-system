import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDashboardMetrics, getRecentPRs } from '@/services/dashboard.service';

describe('dashboard.service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('getDashboardMetrics fetches and returns metrics', async () => {
    const mockMetrics = { total_spent: 1000, bottlenecks: 2, active_users: 5, monthly_data: [], department_breakdown: [] };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ metrics: mockMetrics }),
    });

    const metrics = await getDashboardMetrics();
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/dashboard/metrics', expect.any(Object));
    expect(metrics).toEqual(mockMetrics);
  });

  it('getRecentPRs fetches and returns list of recent PRs', async () => {
    const mockPRs = [{ id: 1, pr_number: 'PR-001', status: 'Submitted' }];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recent_purchase_requests: mockPRs }),
    });

    const prs = await getRecentPRs();
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/dashboard/recent-prs', expect.any(Object));
    expect(prs).toEqual(mockPRs);
  });
});
