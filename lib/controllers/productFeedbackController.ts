import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type {
  NewProductFeedbackInput,
  ProductFeedback,
} from "@/lib/models/productFeedback";

export class DuplicateFeedbackError extends Error {
  status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.status = status;
  }
}

export async function listProductFeedbacks(
  productId: string,
): Promise<ProductFeedback[]> {
  const { data, error } = await supabaseAdmin
    .from("product_feedbacks")
    .select("id, product_id, customer_name, phone, email, province, comment, rating, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createProductFeedback(
  payload: NewProductFeedbackInput,
): Promise<ProductFeedback> {
  // Ensure email is unique per product to prevent duplicate submissions
  const { data: existing } = await supabaseAdmin
    .from("product_feedbacks")
    .select("id")
    .eq("product_id", payload.productId)
    .eq("email", payload.email)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    throw new DuplicateFeedbackError(
      "Email ini sudah pernah digunakan untuk memberi komentar/rating pada produk ini. Gunakan email lain.",
    );
  }

  const { data, error } = await supabaseAdmin
    .from("product_feedbacks")
    .insert({
      product_id: payload.productId,
      customer_name: payload.name,
      phone: payload.phone,
      email: payload.email,
      province: payload.province,
      comment: payload.comment,
      rating: payload.rating,
    })
    .select("id, product_id, customer_name, phone, email, province, comment, rating, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Gagal menyimpan feedback");
  }

  return data;
}
