import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const product = url.searchParams.get("product") || "";
    const store = url.searchParams.get("store") || "";
    const category = url.searchParams.get("category") || "";
    const location = url.searchParams.get("location") || "";

    const sellerSelect =
      store || location
        ? "sellers!inner(store_name, pic_city, pic_province)"
        : "sellers!products_seller_id_fkey (store_name, pic_city, pic_province)";

    let query = supabaseAdmin
      .from("products")
      .select(
        `id, name, category, price, main_photo_path, specifications, product_variants (id, option_group, name), ${sellerSelect}`,
      )
      .limit(24)
      .order("created_at", { ascending: false });

    if (product) query = query.ilike("name", `%${product}%`);
    if (category) query = query.ilike("category", `%${category}%`);
    if (store) {
      query = query.or(`store_name.ilike.%${store}%`, {
        foreignTable: "sellers",
      });
    }
    if (location) {
      query = query.or(
        `pic_city.ilike.%${location}%,pic_province.ilike.%${location}%`,
        { foreignTable: "sellers" },
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Gagal mengambil produk", details: error.message },
        { status: 500 },
      );
    }

    const products = (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      main_photo_path: p.main_photo_path,
      specifications: p.specifications,
      product_variants: p.product_variants || [],
      seller: Array.isArray(p.sellers) ? p.sellers[0] : p.sellers || {},
    }));

    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server", details: String(err) },
      { status: 500 },
    );
  }
}
