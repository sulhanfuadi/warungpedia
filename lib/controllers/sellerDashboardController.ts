import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { ProductFeedbackStats } from "@/lib/models/productFeedback";

type RatingRow = { rating: number | null; total: number };
type ProvinceRow = { province: string | null; total: number };

type FallbackAggregate = {
  ratingDistribution: RatingRow[];
  provinceDistribution: ProvinceRow[];
};

async function getFallbackFeedbackAggregates(sellerId: string): Promise<FallbackAggregate> {
  try {
    const { data, error } = await supabaseAdmin
      .from("product_feedbacks")
      .select("rating, province, products!inner(seller_id)")
      .eq("products.seller_id", sellerId);

    if (error) {
      console.warn("[sellerDashboard] Fallback aggregate error:", error.message);
      return { ratingDistribution: [], provinceDistribution: [] };
    }

    const ratingMap = new Map<number, number>();
    const provinceMap = new Map<string, number>();

    for (const row of data || []) {
      const rating = typeof row.rating === "number" && Number.isFinite(row.rating) ? row.rating : 0;
      const province = row.province?.trim() || "Tidak diketahui";

      ratingMap.set(rating, (ratingMap.get(rating) || 0) + 1);
      provinceMap.set(province, (provinceMap.get(province) || 0) + 1);
    }

    const ratingDistribution: RatingRow[] = Array.from(ratingMap.entries())
      .map(([rating, total]) => ({ rating, total }))
      .sort((a, b) => a.rating - b.rating);

    const provinceDistribution: ProvinceRow[] = Array.from(provinceMap.entries())
      .map(([province, total]) => ({ province, total }))
      .sort((a, b) => b.total - a.total || a.province!.localeCompare(b.province!, "id"));

    return { ratingDistribution, provinceDistribution };
  } catch (err) {
    console.warn("[sellerDashboard] Fallback aggregate exception:", err);
    return { ratingDistribution: [], provinceDistribution: [] };
  }
}

export async function getSellerDashboardStats(
  sellerId: string,
): Promise<ProductFeedbackStats> {
  try {
    // Fetch stock data (also grab id to align with feedbacks)
    const stockRes = await supabaseAdmin
      .from("products")
      .select("id, name, stock")
      .eq("seller_id", sellerId);

    if (stockRes.error) {
      console.error("ƒ?O Stock query error:", stockRes.error);
      throw new Error(`Gagal memuat data produk: ${stockRes.error.message}`);
    }

    // Fetch rating distribution with fallback
    let ratingData: RatingRow[] = [];
    try {
      const ratingRes = await supabaseAdmin.rpc("seller_rating_distribution", {
        seller_uuid: sellerId,
      });

      if (ratingRes.error) {
        console.warn("ƒsÿ‹,? Rating RPC error:", ratingRes.error.message);
      } else {
        ratingData = (ratingRes.data as RatingRow[] | null) ?? [];
      }
    } catch (err) {
      console.warn("ƒsÿ‹,? Rating RPC not available:", err);
    }

    // Fetch province distribution with fallback
    let provinceData: ProvinceRow[] = [];
    try {
      const provinceRes = await supabaseAdmin.rpc(
        "seller_feedback_province_distribution",
        {
          seller_uuid: sellerId,
        },
      );

      if (provinceRes.error) {
        console.warn("ƒsÿ‹,? Province RPC error:", provinceRes.error.message);
      } else {
        provinceData = (provinceRes.data as ProvinceRow[] | null) ?? [];
      }
    } catch (err) {
      console.warn("ƒsÿ‹,? Province RPC not available:", err);
    }

    // Fallback if RPC unavailable/empty: compute directly from product_feedbacks
    if (ratingData.length === 0 || provinceData.length === 0) {
      const fallback = await getFallbackFeedbackAggregates(sellerId);
      if (ratingData.length === 0) ratingData = fallback.ratingDistribution;
      if (provinceData.length === 0) provinceData = fallback.provinceDistribution;
    }

    return {
      stockDistribution:
        stockRes.data?.map((row) => ({
          label: row.name ?? "Tanpa Nama",
          stock: row.stock ?? 0,
        })) ?? [],
      ratingDistribution: ratingData.map(({ rating, total }) => ({
        rating: rating ?? 0,
        total,
      })),
      provinceDistribution: provinceData.map(({ province, total }) => ({
        province: province ?? "Tidak Diketahui",
        total,
      })),
    };
  } catch (error) {
    console.error("ƒ?O getSellerDashboardStats error:", error);
    throw error;
  }
}
