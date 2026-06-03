import { expect, test, describe } from 'vitest';
import { validateProductFeedback } from '../../lib/utils/productFeedbackValidator';

describe('productFeedbackValidator', () => {
  test('Memvalidasi productFeedbackValidator menerima input valid', () => {
    const res = validateProductFeedback({
        rating: 5,
        name: 'John Doe',
        phone: '081234567890',
        email: 'test@example.com',
        province: 'Jawa Tengah',
        comment: 'Sangat bagus dan memuaskan',
        productId: 'prod-1'
    } as any);
    expect(res.isValid).toBe(true);
  });

  test('Memvalidasi productFeedbackValidator menolak input rating di luar batas 1-5', () => {
    const res = validateProductFeedback({
        rating: 6,
        name: 'John Doe',
        phone: '081234567890',
        email: 'test@example.com',
        province: 'Jawa Tengah',
        comment: 'Sangat bagus dan memuaskan',
        productId: 'prod-1'
    } as any);
    expect(res.isValid).toBe(false);
  });
});
