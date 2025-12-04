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
    // Auth check
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - Token tidak ditemukan" },
        { status: 401 }
      );
    }

    // ✅ VERIFY TOKEN dengan Supabase Admin
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser?.user) {
      console.error("❌ Auth Error:", authError);
      return NextResponse.json(
        { error: "Unauthorized - Token tidak valid" },
        { status: 401 }
      );
    }

    // Get sellerId from query params
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json(
        { error: "sellerId query parameter wajib diisi" },
        { status: 400 }
      );
    }

    // ✅ VALIDASI: Pastikan sellerId yang diminta = user yang login
    if (authUser.user.id !== sellerId) {
      return NextResponse.json(
        { error: "Forbidden - Anda hanya bisa download laporan sendiri" },
        { status: 403 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateStokByStokPDF(sellerId);

    // Return PDF response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Laporan_Stok_${sellerId}_${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("❌ Error generating stok report:", error);
    return NextResponse.json(
      { error: "Gagal menghasilkan laporan PDF" },
      { status: 500 }
    );
  }
}
