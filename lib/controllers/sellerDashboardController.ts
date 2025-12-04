import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { ProductFeedbackStats } from "@/lib/models/productFeedback";

type RatingRow = { rating: number | null; total: number };
type ProvinceRow = { province: string | null; total: number };

export async function getSellerDashboardStats(
  sellerId: string
): Promise<ProductFeedbackStats> {
  try {
    // Fetch stock data
    const stockRes = await supabaseAdmin
      .from("products")
      .select("name, stock")
      .eq("seller_id", sellerId);

    if (stockRes.error) {
      console.error("❌ Stock query error:", stockRes.error);
      throw new Error(`Gagal memuat data produk: ${stockRes.error.message}`);
    }

    // Fetch rating distribution with fallback
    let ratingData: RatingRow[] = [];
    try {
      const ratingRes = await supabaseAdmin.rpc("seller_rating_distribution", {
        seller_uuid: sellerId,
      });

      if (ratingRes.error) {
        console.warn("⚠️ Rating RPC error:", ratingRes.error.message);
      } else {
        ratingData = (ratingRes.data as RatingRow[] | null) ?? [];
      }
    } catch (err) {
      console.warn("⚠️ Rating RPC not available:", err);
    }

    // Fetch province distribution with fallback
    let provinceData: ProvinceRow[] = [];
    try {
      const provinceRes = await supabaseAdmin.rpc(
        "seller_feedback_province_distribution",
        {
          seller_uuid: sellerId,
        }
      );

      if (provinceRes.error) {
        console.warn("⚠️ Province RPC error:", provinceRes.error.message);
      } else {
        provinceData = (provinceRes.data as ProvinceRow[] | null) ?? [];
      }
    } catch (err) {
      console.warn("⚠️ Province RPC not available:", err);
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
    console.error("❌ getSellerDashboardStats error:", error);
    throw error;
  }
}
