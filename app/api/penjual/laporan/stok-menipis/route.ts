import { NextRequest, NextResponse } from "next/server";
import { generateStokMenipisPDF } from "@/lib/pdfGenerators/stokMenipis";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.substring(7);
}

export async function GET(request: NextRequest) {
  try {
    console.log("🟡 [STOK-MENIPIS] Starting request...");

    // Auth check
    const token = getBearerToken(request);
    if (!token) {
      console.log("❌ [STOK-MENIPIS] No token found");
      return NextResponse.json(
        { error: "Unauthorized - Token tidak ditemukan" },
        { status: 401 }
      );
    }

    console.log("🟡 [STOK-MENIPIS] Token found, verifying...");

    // Verify token
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser?.user) {
      console.error("❌ [STOK-MENIPIS] Auth Error:", authError);
      return NextResponse.json(
        { error: "Unauthorized - Token tidak valid" },
        { status: 401 }
      );
    }

    console.log("✅ [STOK-MENIPIS] Token verified for user:", authUser.user.id);

    // Get sellerId from query params
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      console.log("❌ [STOK-MENIPIS] No sellerId in query");
      return NextResponse.json(
        { error: "sellerId query parameter wajib diisi" },
        { status: 400 }
      );
    }

    console.log("🟡 [STOK-MENIPIS] Seller ID:", sellerId);

    // Validasi: sellerId harus sama dengan user yang login
    if (authUser.user.id !== sellerId) {
      console.log("❌ [STOK-MENIPIS] User ID mismatch");
      return NextResponse.json(
        { error: "Forbidden - Anda hanya bisa download laporan sendiri" },
        { status: 403 }
      );
    }

    console.log("🟡 [STOK-MENIPIS] Generating PDF...");

    // Generate PDF
    const pdfBuffer = await generateStokMenipisPDF(sellerId);

    console.log(
      "✅ [STOK-MENIPIS] PDF generated, size:",
      pdfBuffer.length,
      "bytes"
    );

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Laporan_Stok_Menipis_${sellerId}_${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("❌ [STOK-MENIPIS] FATAL ERROR:");
    console.error("Error object:", error);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );

    return NextResponse.json(
      {
        error: "Gagal menghasilkan laporan stok menipis",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
