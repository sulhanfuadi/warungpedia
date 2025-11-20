import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {

  // 1. Count users based on store_name (seller)
  const sellersCountRes = await supabaseAdmin
    .from("sellers")
    .select("store_name", { count: "exact", head: true });

  const userCount = sellersCountRes.count ?? 0;


  // 2. Product categories
  const productsRes = await supabaseAdmin.from("products").select("category");
  let productCategories: { category: string; total: number }[] = [];

  if (productsRes.data) {
    const map: Record<string, number> = {};
    productsRes.data.forEach((p) => {
      const cat = p.category ?? "Unknown";
      map[cat] = (map[cat] ?? 0) + 1;
    });

    productCategories = Object.entries(map).map(([category, total]) => ({
      category,
      total,
    }));
  }

  // 3. Stores by province
  const sellersRes = await supabaseAdmin.from("sellers").select("pic_province");

  const provMap: Record<string, number> = {};

  if (sellersRes.data) {
    sellersRes.data.forEach((s) => {
      const prov = s.pic_province ?? "Unknown";
      provMap[prov] = (provMap[prov] ?? 0) + 1;
    });
  }

  const storesByProvince = Object.entries(provMap).map(([province, total]) => ({
    province,
    total,
  }));


  // Final return
  return NextResponse.json({
    users: userCount,
    productCategories,
    storesByProvince,
  });
}

