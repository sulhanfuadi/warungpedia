import { NextResponse } from "next/server";
import { fetchProductRatingData } from "@/lib/reports/productRatingData";

export async function GET() {
  try {
    console.log("🔵 [Products Report] Request started");

    const productsWithRating = await fetchProductRatingData();

    console.log(`✅ [Products Report] Returning ${productsWithRating.length} produk dengan rating`);

    return NextResponse.json({
      success: true,
      data: productsWithRating,
      totalRecords: productsWithRating.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [Products Report] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}
