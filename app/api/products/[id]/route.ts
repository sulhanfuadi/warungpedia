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

    return NextResponse.json(product);
  } catch (err) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server", details: String(err) },
      { status: 500 },
    );
  }
}
