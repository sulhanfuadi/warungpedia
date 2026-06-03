import { expect, test, describe } from 'vitest';
import { approveSeller } from '../../lib/services/verificationService';

describe('verificationService', () => {
  test('Fungsi approval verifikasi mengubah status akun seller menjadi aktif', async () => {
    const result = await approveSeller('123');
    expect(result).toBe(true);
  });
});
