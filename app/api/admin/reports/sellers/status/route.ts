import { NextResponse } from "next/server";
import { generateSellerStatusReport } from "@/lib/pdfGenerators/adminSellerStatusReport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pdfBytes = await generateSellerStatusReport();
    const filename = `Laporan-Akun-Penjual-${new Date().toISOString().split("T")[0]}.pdf`;

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("❌ [SellerStatusReport] Failed generating PDF", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan tak terduga";

    return NextResponse.json(
      { error: "Gagal membuat laporan akun penjual", details: message },
      { status: 500 },
    );
  }
}
