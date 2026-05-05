import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sellerId } = await context.params;
    const body = await request.json();
    const { action } = body; // "suspend" atau "reactivate"

    // 🔍 Debug logging
    console.log("=== DEBUG TOGGLE STATUS API ===");
    console.log("Seller ID:", sellerId);
    console.log("Action:", action);

    if (!action || !["suspend", "reactivate"].includes(action)) {
      return NextResponse.json(
        { error: "Action harus 'suspend' atau 'reactivate'" },
        { status: 400 }
      );
    }

    // Get seller data
    const { data: seller, error: fetchError } = await supabaseAdmin
      .from("sellers")
      .select("*")
      .eq("id", sellerId)
      .single();

    if (fetchError || !seller) {
      console.error("❌ Seller not found - fetchError:", fetchError);
      return NextResponse.json(
        { error: "Penjual tidak ditemukan" },
        { status: 404 }
      );
    }

    // Validasi status sekarang
    if (action === "suspend" && seller.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Hanya penjual ACTIVE yang bisa di-suspend" },
        { status: 400 }
      );
    }

    if (action === "reactivate" && seller.status !== "INACTIVE") {
      return NextResponse.json(
        { error: "Hanya penjual INACTIVE yang bisa direaktivasi" },
        { status: 400 }
      );
    }

    // Update status
    const newStatus = action === "suspend" ? "INACTIVE" : "ACTIVE";
    const { error: updateError } = await supabaseAdmin
      .from("sellers")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sellerId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Gagal mengupdate status penjual" },
        { status: 500 }
      );
    }

    const message =
      action === "suspend"
        ? `Akun ${seller.store_name} berhasil di-suspend`
        : `Akun ${seller.store_name} berhasil direaktivasi`;

    console.log(`✅ ${message}`);

    return NextResponse.json({ message, newStatus }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
