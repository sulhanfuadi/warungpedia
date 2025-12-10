import { NextRequest, NextResponse } from "next/server";
import {
  fetchSellerStockReportData,
  SellerStockReportError,
} from "@/lib/reports/sellerStockReportData";
import { generateSellerStockRatingReport } from "@/lib/pdfGenerators/sellerStockRatingReport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.substring(7);
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - Token tidak ditemukan" },
        { status: 401 },
      );
    }

    const sellerId = new URL(request.url).searchParams.get("sellerId");
    if (!sellerId) {
      return NextResponse.json(
        { error: "sellerId query parameter wajib diisi" },
        { status: 400 },
      );
    }

    const { products, storeName } = await fetchSellerStockReportData({ token, sellerId });
    const pdfBytes = await generateSellerStockRatingReport({ storeName, products });
    const filename = `Laporan-Stok-${storeName.replace(/\s+/g, "-")}-${new Date()
      .toISOString()
      .split("T")[0]}.pdf`;

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof SellerStockReportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("❌ [SellerStockPDF] Unexpected error", error);
    const details = error instanceof Error ? error.message : "Terjadi kesalahan tak terduga";
    return NextResponse.json(
      { error: "Gagal membuat laporan stok", details },
      { status: 500 },
    );
  }
}
