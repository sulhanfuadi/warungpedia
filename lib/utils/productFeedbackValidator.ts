import { INDONESIA_PROVINCES } from "@/lib/constants/indonesiaProvinces";
import type { NewProductFeedbackInput } from "@/lib/models/productFeedback";

export type ProductFeedbackValidationResult = {
  isValid: boolean;
  errors: Partial<Record<keyof Omit<NewProductFeedbackInput, "productId">, string>>;
};

const phoneRegex = /^[0-9+]{9,16}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateProductFeedback(
  payload: NewProductFeedbackInput,
): ProductFeedbackValidationResult {
  const errors: ProductFeedbackValidationResult["errors"] = {};

  if (!payload.name || payload.name.trim().length < 3) {
    errors.name = "Nama wajib diisi (min 3 karakter)";
  }

  if (!payload.phone || !phoneRegex.test(payload.phone)) {
    errors.phone = "Nomor HP hanya boleh angka/+ (9-16 digit)";
  }

  if (!payload.email || !emailRegex.test(payload.email)) {
    errors.email = "Format email tidak valid";
  }

  if (!payload.province || !INDONESIA_PROVINCES.includes(payload.province)) {
    errors.province = "Provinsi wajib dipilih dari daftar";
  }

  if (!payload.comment || payload.comment.trim().length < 10) {
    errors.comment = "Komentar minimal 10 karakter";
  }

  if (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5) {
    errors.rating = "Rating harus 1-5";
  }

  if (!payload.productId) {
    errors.comment = errors.comment ?? "Produk tidak dikenal";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
