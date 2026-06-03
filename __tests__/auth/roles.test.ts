import { expect, test, describe } from 'vitest';
import { inferRole } from '../../lib/auth/roles';

describe('roles auth helper', () => {
  test('Memvalidasi helper isAdminRole mengembalikan true (admin) untuk user dengan role admin', () => {
    const user = { user_metadata: { role: 'admin' } };
    expect(inferRole(user)).toBe('admin');
  });

  test('Memvalidasi helper isSellerRole mengembalikan false untuk user pembeli biasa', () => {
    const user = { user_metadata: { role: 'buyer' } };
    expect(inferRole(user)).not.toBe('seller');
  });
});
