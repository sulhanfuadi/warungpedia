import { NextRequest, NextResponse } from "next/server";
import {
  fetchSellerStockReportData,
  SellerStockReportError,
} from "@/lib/reports/sellerStockReportData";

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.substring(7);
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔵 [Seller Stock Report] Request started");

    const token = getBearerToken(request);
    if (!token) {
      console.log("❌ [Seller Stock Report] No token found");
      return NextResponse.json(
        { error: "Unauthorized - Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      console.log("❌ [Seller Stock Report] No sellerId in query");
      return NextResponse.json(
        { error: "sellerId query parameter wajib diisi" },
        { status: 400 }
      );
    }

    const { products, storeName } = await fetchSellerStockReportData({ token, sellerId });

    console.log(
      `✅ [Seller Stock Report] Returning ${products.length} products with ratings`,
    );

    return NextResponse.json({
      success: true,
      data: products,
      totalRecords: products.length,
      storeName,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof SellerStockReportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("❌ [Seller Stock Report] Unexpected error:", error);
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
