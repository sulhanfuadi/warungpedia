import { expect, test, describe } from 'vitest';
import { validateProductFeedback } from '../../lib/utils/productFeedbackValidator';

describe('productFeedbackValidator', () => {
  test('Memvalidasi productFeedbackValidator menerima input valid', () => {
    const res = validateProductFeedback({
        rating: 5,
        reviewerName: 'John',
        reviewerPhone: '081234567890',
        reviewerEmail: 'test@example.com',
        reviewerProvince: 'Jawa Tengah',
        comment: 'Bagus'
    } as any);
    expect(res.isValid).toBe(true);
  });

  test('Memvalidasi productFeedbackValidator menolak input rating di luar batas 1-5', () => {
    const res = validateProductFeedback({
        rating: 6,
        reviewerName: 'John',
        reviewerPhone: '081234567890',
        reviewerEmail: 'test@example.com',
        reviewerProvince: 'Jawa Tengah',
        comment: 'Bagus'
    } as any);
    expect(res.isValid).toBe(false);
  });
});
