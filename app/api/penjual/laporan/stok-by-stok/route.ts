import { NextRequest, NextResponse } from "next/server";
import { generateStokByStokPDF } from "@/lib/pdfGenerators/stokByStok";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.substring(7);
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔵 [STOK-BY-STOK] Starting request...");

    // Auth check
    const token = getBearerToken(request);
    if (!token) {
      console.log("❌ [STOK-BY-STOK] No token found");
      return NextResponse.json(
        { error: "Unauthorized - Token tidak ditemukan" },
        { status: 401 }
      );
    }

    console.log("🔵 [STOK-BY-STOK] Token found, verifying...");

    // ✅ VERIFY TOKEN dengan Supabase Admin
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser?.user) {
      console.error("❌ [STOK-BY-STOK] Auth Error:", authError);
      return NextResponse.json(
        { error: "Unauthorized - Token tidak valid" },
        { status: 401 }
      );
    }

    console.log("✅ [STOK-BY-STOK] Token verified for user:", authUser.user.id);

    // Get sellerId from query params
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      console.log("❌ [STOK-BY-STOK] No sellerId in query");
      return NextResponse.json(
        { error: "sellerId query parameter wajib diisi" },
        { status: 400 }
      );
    }

    console.log("🔵 [STOK-BY-STOK] Seller ID:", sellerId);

    // ✅ VALIDASI: Pastikan sellerId yang diminta = user yang login
    if (authUser.user.id !== sellerId) {
      console.log("❌ [STOK-BY-STOK] User ID mismatch");
      return NextResponse.json(
        { error: "Forbidden - Anda hanya bisa download laporan sendiri" },
        { status: 403 }
      );
    }

    console.log("🔵 [STOK-BY-STOK] Generating PDF...");

    // Generate PDF
    const pdfBuffer = await generateStokByStokPDF(sellerId);

    console.log(
      "✅ [STOK-BY-STOK] PDF generated, size:",
      pdfBuffer.length,
      "bytes"
    );

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Laporan_Stok_${sellerId}_${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("❌ [STOK-BY-STOK] FATAL ERROR:");
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
        error: "Gagal menghasilkan laporan PDF",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
