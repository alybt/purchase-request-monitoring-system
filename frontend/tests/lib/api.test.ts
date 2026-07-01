import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { login } from '@/lib/api';

describe('api.ts', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('login sends request and returns parsed json', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ token: 'xyz' }),
    });

    const result = await login('admin@example.com', 'password123');
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
    });
    expect(result).toEqual({ token: 'xyz' });
  });
});
