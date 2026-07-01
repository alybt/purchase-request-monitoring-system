import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { login, logout, getCurrentUser, changePassword } from '@/services/auth.service';

describe('auth.service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('login sends correct POST request and returns json', async () => {
    const mockResponse = { token: 'mock-token', user: { id: 1, email: 'test@example.com' } };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await login('test@example.com', 'secret');
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'secret' }),
    });
    expect(result).toEqual(mockResponse);
  });

  it('logout sends POST request with Bearer token', async () => {
    localStorage.setItem('token', 'abc-123');
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Logged out' }),
    });

    await logout();
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer abc-123',
      },
    });
  });

  it('logout throws error if response not ok', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Token expired' }),
    });

    await expect(logout()).rejects.toThrow('Token expired');
  });

  it('getCurrentUser returns user object', async () => {
    localStorage.setItem('token', 'my-token');
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: 10, role: 'admin' } }),
    });

    const user = await getCurrentUser();
    expect(user).toEqual({ id: 10, role: 'admin' });
  });

  it('changePassword successfully updates password', async () => {
    localStorage.setItem('token', 'auth-token');
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Password changed successfully' }),
    });

    const res = await changePassword('oldPass', 'newPass', 'newPass');
    expect(res).toEqual({ message: 'Password changed successfully' });
  });
});
