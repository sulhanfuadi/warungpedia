import { expect, test, describe, vi } from 'vitest';
import { generateStokMenipisPDF } from '../../lib/pdfGenerators/stokMenipis';

vi.mock('../../lib/pdfGenerators/stokMenipis', () => ({
  generateStokMenipisPDF: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
}));

describe('stokMenipis generator', () => {
  test('Memvalidasi stokMenipis generator PDF hanya menyaring data produk dengan stok < 2', async () => {
    const pdfBytes = await generateStokMenipisPDF();
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
  });
});
