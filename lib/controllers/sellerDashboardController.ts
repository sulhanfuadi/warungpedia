import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { ProductFeedbackStats } from "@/lib/models/productFeedback";

type RatingRow = { rating: number | null; total: number };
type ProvinceRow = { province: string | null; total: number };

export async function getSellerDashboardStats(
  sellerId: string,
): Promise<ProductFeedbackStats> {
  const stockPromise = supabaseAdmin
    .from("products")
    .select("name, stock")
    .eq("seller_id", sellerId);

  const ratingPromise = supabaseAdmin.rpc("seller_rating_distribution", { seller_uuid: sellerId });
  const provincePromise = supabaseAdmin.rpc("seller_feedback_province_distribution", {
    seller_uuid: sellerId,
  });

  const [stockRes, ratingRes, provinceRes] = await Promise.all([
    stockPromise,
    ratingPromise,
    provincePromise,
  ]);

  if (stockRes.error) {
    throw new Error(stockRes.error.message);
  }

  if (ratingRes.error) {
    throw new Error(ratingRes.error.message);
  }

  if (provinceRes.error) {
    throw new Error(provinceRes.error.message);
  }

  const ratingData = (ratingRes.data as RatingRow[] | null) ?? [];
  const provinceData = (provinceRes.data as ProvinceRow[] | null) ?? [];

  return {
    stockDistribution:
      stockRes.data?.map((row) => ({ label: row.name ?? "Tanpa Nama", stock: row.stock ?? 0 })) ?? [],
    ratingDistribution: ratingData.map(({ rating, total }) => ({
      rating: rating ?? 0,
      total,
    })),
    provinceDistribution: provinceData.map(({ province, total }) => ({
      province: province ?? "Tidak Diketahui",
      total,
    })),
  };
}
