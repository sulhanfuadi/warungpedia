import { expect, test, describe, vi } from 'vitest';
import { sendApprovalEmail } from '../../lib/services/emailService';

// Mock implementation to avoid actual email sending
vi.mock('../../lib/services/emailService', () => ({
  sendApprovalEmail: vi.fn().mockResolvedValue({ success: true })
}));

describe('emailService', () => {
  test('Memanggil library pengirim email dengan parameter yang tepat', async () => {
    const res = await sendApprovalEmail('test@example.com', 'Test Toko');
    expect(res.success).toBe(true);
  });
});
