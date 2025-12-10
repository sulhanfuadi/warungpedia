import { NextRequest, NextResponse } from "next/server";
import { getSellerDashboardStats } from "@/lib/controllers/sellerDashboardController";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CategoryRow = { category: string | null };
type SellerRow = { id: string; pic_province: string | null };

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
      console.log("📊 Fetching dashboard for seller:", sellerId);
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
        supabaseAdmin.from("sellers").select("id, pic_province"),
        supabaseAdmin.from("products").select("category"),
      ]);

    if (sellersError) {
      throw new Error(`Gagal mengambil data penjual: ${sellersError.message}`);
    }
    if (productsError) {
      throw new Error(`Gagal mengambil data produk: ${productsError.message}`);
    }

    const productCategories = aggregateCategories(products ?? []);
    const storesByProvince = aggregateProvinces(sellers ?? []);
    const users = sellers?.length ?? 0;

    return NextResponse.json({ users, productCategories, storesByProvince });
  } catch (error) {
    console.error("❌ Dashboard API Error:", error);
    return NextResponse.json(
      {
        error: "Gagal memuat dashboard",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
