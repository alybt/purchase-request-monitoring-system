import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mapBackendUserToFrontend,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  bulkDeleteUsers,
  UserResponse,
} from '@/services/users.service';

describe('users.service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('mapBackendUserToFrontend transforms user response cleanly', () => {
    const backendUser: UserResponse = {
      id: 5,
      first_name: 'John',
      middle_name: 'Q',
      last_name: 'Smith',
      email: 'john@example.com',
      role: 'department_head',
      status: 'active',
      department: { name: 'IT' },
      created_at: '2026-01-01T08:00:00.000000Z'
    };

    const mapped = mapBackendUserToFrontend(backendUser);
    expect(mapped.id).toBe('5');
    expect(mapped.name).toBe('John Q Smith');
    expect(mapped.department).toBe('IT');
    expect(mapped.role).toBe('department_head');
    expect(mapped.status).toBe('active');
  });

  it('getUsers fetches user list with search params', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          { id: 1, first_name: 'Alice', last_name: 'W', email: 'a@a.com', role: 'admin', status: 'active' }
        ]
      })
    });

    const users = await getUsers('Alice', 'admin', 'active', 'Eng');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('search=Alice'), expect.any(Object));
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Alice W');
  });

  it('createUser sends POST request and maps response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 2, first_name: 'Bob', last_name: 'B', email: 'b@b.com', role: 'admin', status: 'active' }
      })
    });

    const user = await createUser({
      first_name: 'Bob',
      last_name: 'B',
      email: 'b@b.com',
      department: 'HR',
      role: 'admin',
      status: 'active',
      password: 'pass',
      password_confirmation: 'pass'
    });

    expect(user.name).toBe('Bob B');
  });

  it('updateUser, deleteUser, and bulkDeleteUsers perform API requests', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 2, first_name: 'Bob', last_name: 'B', email: 'b@b.com', role: 'admin', status: 'suspended' }
      })
    });

    const updated = await updateUser('2', {
      first_name: 'Bob',
      last_name: 'B',
      email: 'b@b.com',
      department: 'HR',
      role: 'admin',
      status: 'inactive'
    });
    expect(updated.status).toBe('inactive');

    (global.fetch as any).mockResolvedValueOnce({ ok: true });
    await deleteUser('2');
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/users/2', expect.objectContaining({ method: 'DELETE' }));

    (global.fetch as any).mockResolvedValueOnce({ ok: true });
    await bulkDeleteUsers(['1', '2']);
    expect(global.fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/users/bulk-delete', expect.objectContaining({ method: 'POST' }));
  });
});
