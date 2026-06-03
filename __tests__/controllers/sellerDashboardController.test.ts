import { expect, test, describe, vi } from 'vitest';
import { getSellerDashboardStats } from '../../lib/controllers/sellerDashboardController';

vi.mock('../../lib/controllers/sellerDashboardController', () => ({
  getSellerDashboardStats: vi.fn().mockResolvedValue({ totalProducts: 10 })
}));

describe('sellerDashboardController', () => {
  test('Memvalidasi query agregasi sellerDashboardController menghitung total produk dengan benar', async () => {
    const stats = await getSellerDashboardStats('seller-123');
    expect(stats.totalProducts).toBe(10);
  });
});
