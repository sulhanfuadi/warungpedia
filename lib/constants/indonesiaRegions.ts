/**
 * Hook dan utilitas untuk mengambil data wilayah Indonesia
 * Menggunakan API publik dari https://www.emsifa.com/api-wilayah-indonesia/
 */

const BASE_URL = "https://www.emsifa.com/api-wilayah-indonesia/api";

export interface Region {
  id: string;
  name: string;
}

export async function getProvinces(): Promise<Region[]> {
  try {
    const response = await fetch(`${BASE_URL}/provinces.json`);
    if (!response.ok) throw new Error("Failed to fetch provinces");
    return await response.json();
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return [];
  }
}

export async function getRegencies(provinceId: string): Promise<Region[]> {
  try {
    const response = await fetch(`${BASE_URL}/regencies/${provinceId}.json`);
    if (!response.ok) throw new Error("Failed to fetch regencies");
    return await response.json();
  } catch (error) {
    console.error("Error fetching regencies:", error);
    return [];
  }
}

export async function getDistricts(regencyId: string): Promise<Region[]> {
  try {
    const response = await fetch(`${BASE_URL}/districts/${regencyId}.json`);
    if (!response.ok) throw new Error("Failed to fetch districts");
    return await response.json();
  } catch (error) {
    console.error("Error fetching districts:", error);
    return [];
  }
}

export async function getVillages(districtId: string): Promise<Region[]> {
  try {
    const response = await fetch(`${BASE_URL}/villages/${districtId}.json`);
    if (!response.ok) throw new Error("Failed to fetch villages");
    return await response.json();
  } catch (error) {
    console.error("Error fetching villages:", error);
    return [];
  }
}
