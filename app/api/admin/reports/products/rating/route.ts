import { NextResponse } from "next/server";
import { generateAdminProductRatingReport } from "@/lib/pdfGenerators/adminProductRatingReport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  console.log("🔵 [AdminProductReport] Request started");
  try {
    const pdfBytes = await generateAdminProductRatingReport();
    const filename = `Laporan-Produk-Rating-${new Date().toISOString().split("T")[0]}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("❌ [AdminProductReport] Gagal membuat PDF", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan tak terduga";

    return NextResponse.json(
      { error: "Gagal membuat laporan produk", details: message },
      { status: 500 },
    );
  }
}
