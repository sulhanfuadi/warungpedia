import { expect, test, describe } from 'vitest';
import { INDONESIA_PROVINCES } from '../../lib/constants/indonesiaProvinces';

describe('indonesiaProvinces', () => {
  test('Mengembalikan array provinsi yang mencakup Jawa Tengah', () => {
    expect(INDONESIA_PROVINCES).toContain('Jawa Tengah');
  });
});
