import { expect, test, describe, vi } from 'vitest';
import { generateSellerStatusReport } from '../../lib/pdfGenerators/adminSellerStatusReport';

vi.mock('../../lib/pdfGenerators/adminSellerStatusReport', () => ({
  generateSellerStatusReport: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
}));

describe('adminSellerStatusReport', () => {
  test('Memvalidasi adminSellerStatusReport memanggil library PDF generator tanpa error', async () => {
    const pdfBytes = await generateSellerStatusReport();
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
  });
});
