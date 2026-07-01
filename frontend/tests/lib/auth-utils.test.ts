import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredUser,
  getStoredToken,
  getUserRole,
  getUserDisplayName,
  getUserInitial,
  roleHomePath,
} from '@/lib/auth-utils';

describe('auth-utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getStoredUser retrieves user from localStorage or returns null', () => {
    expect(getStoredUser()).toBeNull();

    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Admin User', role: 'admin' }));
    expect(getStoredUser()).toEqual({ id: 1, name: 'Admin User', role: 'admin' });
  });

  it('getStoredToken retrieves token from localStorage', () => {
    expect(getStoredToken()).toBeNull();
    localStorage.setItem('token', 'abc');
    expect(getStoredToken()).toBe('abc');
  });

  it('getUserRole extracts role properly', () => {
    expect(getUserRole()).toBeNull();
    localStorage.setItem('user', JSON.stringify({ role: 'department_head' }));
    expect(getUserRole()).toBe('department_head');
  });

  it('getUserDisplayName formats user name correctly', () => {
    expect(getUserDisplayName(null)).toBe('User');
    expect(getUserDisplayName({ name: 'Direct Name' })).toBe('Direct Name');
    expect(getUserDisplayName({ first_name: 'John', last_name: 'Doe' })).toBe('John Doe');
    expect(getUserDisplayName({ email: 'john@example.com' })).toBe('john');
  });

  it('getUserInitial returns first letter capitalized', () => {
    expect(getUserInitial({ name: 'alice' })).toBe('A');
    expect(getUserInitial(null)).toBe('U');
  });

  it('roleHomePath returns correct dashboard URL', () => {
    expect(roleHomePath('admin')).toBe('/admin/dashboard');
    expect(roleHomePath('department_head')).toBe('/department-head/dashboard');
    expect(roleHomePath(null)).toBe('/login');
  });
});
