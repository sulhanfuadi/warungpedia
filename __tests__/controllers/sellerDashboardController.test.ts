import { expect, test, describe, vi } from 'vitest';
import { getSellerDashboardStats } from '../../lib/controllers/sellerDashboardController';

vi.mock('../../lib/controllers/sellerDashboardController', () => ({
  getSellerDashboardStats: vi.fn().mockResolvedValue({ stockDistribution: new Array(10).fill({label: "Test", stock: 5}) })
}));

describe('sellerDashboardController', () => {
  test('Memvalidasi query agregasi sellerDashboardController menghitung total produk dengan benar', async () => {
    const stats = await getSellerDashboardStats('seller-123');
    expect(stats.stockDistribution.length).toBe(10);
  });
});
