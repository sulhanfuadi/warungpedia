import { NextResponse } from "next/server";
import { generateSellerProvinceReport } from "@/lib/pdfGenerators/adminSellerProvinceReport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pdfBytes = await generateSellerProvinceReport();
    const filename = `Laporan-Toko-Provinsi-${new Date().toISOString().split("T")[0]}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("❌ [SellerProvinceReport] Failed generating PDF", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan tak terduga";

    return NextResponse.json(
      { error: "Gagal membuat laporan toko per provinsi", details: message },
      { status: 500 },
    );
  }
}
