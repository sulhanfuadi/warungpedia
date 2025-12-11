import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await context.params;
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select(
        "*, product_variants(*), sellers!products_seller_id_fkey (store_name, pic_city, pic_province)",
      )
      .eq("id", productId)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan", details: error?.message },
        { status: 404 },
      );
    }

    const { data: ratingAgg, error: ratingError } = await supabaseAdmin
      .from("product_feedbacks")
      .select("rating")
      .eq("product_id", productId);

    let rating_avg: number | null = null;
    let rating_count = 0;
    if (!ratingError && ratingAgg) {
      rating_count = ratingAgg.length;
      if (rating_count > 0) {
        const sum = ratingAgg.reduce((acc, r) => acc + (r.rating || 0), 0);
        rating_avg = Math.round((sum / rating_count) * 10) / 10;
      }
    }

    return NextResponse.json({ ...product, rating_avg, rating_count });
  } catch (err) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server", details: String(err) },
      { status: 500 },
    );
  }
}
