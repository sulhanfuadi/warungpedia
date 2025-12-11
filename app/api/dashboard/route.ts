import { NextRequest, NextResponse } from "next/server";
import { getSellerDashboardStats } from "@/lib/controllers/sellerDashboardController";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CategoryRow = { category: string | null };
type SellerRow = { id: string; pic_province: string | null; status?: string | null };

function aggregateCategories(rows: CategoryRow[]) {
  const map = new Map<string, { category: string; total: number }>();
  rows.forEach((row) => {
    const label = row.category?.trim() || "Tidak diketahui";
    const key = label.toUpperCase();
    const current = map.get(key);
    if (current) {
      current.total += 1;
    } else {
      map.set(key, { category: label, total: 1 });
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => b.total - a.total || a.category.localeCompare(b.category, "id"),
  );
}

function aggregateProvinces(rows: SellerRow[]) {
  const map = new Map<string, { province: string; total: number }>();
  rows.forEach((row) => {
    const label = row.pic_province?.trim() || "Tidak diketahui";
    const key = label.toUpperCase();
    const current = map.get(key);
    if (current) {
      current.total += 1;
    } else {
      map.set(key, { province: label, total: 1 });
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => b.total - a.total || a.province.localeCompare(b.province, "id"),
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get("sellerId");

    if (sellerId) {
      console.log("dY\"S Fetching dashboard for seller:", sellerId);
      const data = await getSellerDashboardStats(sellerId);
      if (!data) {
        return NextResponse.json(
          { error: "Data dashboard tidak ditemukan" },
          { status: 404 },
        );
      }
      return NextResponse.json(data);
    }

    const [{ data: sellers, error: sellersError }, { data: products, error: productsError }] =
      await Promise.all([
        supabaseAdmin.from("sellers").select("id, pic_province, status"),
        supabaseAdmin.from("products").select("category"),
      ]);

    if (sellersError) {
      throw new Error(`Gagal mengambil data penjual: ${sellersError.message}`);
    }
    if (productsError) {
      throw new Error(`Gagal mengambil data produk: ${productsError.message}`);
    }

    // Hitung status seller
    const statusCounts = { ACTIVE: 0, INACTIVE: 0, PENDING: 0, REJECTED: 0 };
    (sellers ?? []).forEach((s) => {
      const key = (s.status || "").toUpperCase();
      if (key === "ACTIVE") statusCounts.ACTIVE += 1;
      else if (key === "INACTIVE") statusCounts.INACTIVE += 1;
      else if (key === "REJECTED") statusCounts.REJECTED += 1;
      else statusCounts.PENDING += 1;
    });

    // Metrik feedback
    const { data: feedbacks, error: feedbackError } = await supabaseAdmin
      .from("product_feedbacks")
      .select("email, rating");

    if (feedbackError) {
      console.warn("ƒsÿ‹,? Feedback query error:", feedbackError.message);
    }

    const totalFeedbacks = feedbacks?.length ?? 0;
    const uniqueReviewers =
      feedbacks?.reduce((set, item) => (item.email ? set.add(item.email) : set), new Set<string>()).size ?? 0;

    const productCategories = aggregateCategories(products ?? []);
    const storesByProvince = aggregateProvinces(sellers ?? []);
    const users = sellers?.length ?? 0;

    return NextResponse.json({
      users,
      productCategories,
      storesByProvince,
      sellerStatusCounts: statusCounts,
      feedbackStats: { totalFeedbacks, uniqueReviewers },
    });
  } catch (error) {
    console.error("ƒ?O Dashboard API Error:", error);
    return NextResponse.json(
      {
        error: "Gagal memuat dashboard",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
