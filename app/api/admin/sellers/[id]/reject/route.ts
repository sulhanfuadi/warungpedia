import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendRejectionEmail } from "@/lib/services/emailService";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = params.id;
    const body = await request.json();
    const { reason } = body;

    // 🔍 Debug logging
    console.log("=== DEBUG REJECT API ===");
    console.log("Seller ID:", sellerId);
    console.log("Reason:", reason);

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "Alasan penolakan harus diisi" },
        { status: 400 }
      );
    }

    // Get seller data
    const { data: seller, error: fetchError } = await supabaseAdmin
      .from("sellers")
      .select("*")
      .eq("id", sellerId)
      .single();

    // 🔍 Debug logging
    console.log("Fetch Error:", fetchError);
    console.log("Seller Data:", seller);

    if (fetchError || !seller) {
      console.error("❌ Seller not found - fetchError:", fetchError);
      return NextResponse.json(
        { error: "Penjual tidak ditemukan", details: fetchError },
        { status: 404 }
      );
    }

    // Update status to REJECTED and set verified_at
    const { error: updateError } = await supabaseAdmin
      .from("sellers")
      .update({
        status: "REJECTED",
        verified_at: new Date().toISOString(),
      })
      .eq("id", sellerId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Gagal mengupdate status penjual" },
        { status: 500 }
      );
    }

    // Send rejection email
    const emailResult = await sendRejectionEmail(
      seller.pic_email,
      seller.pic_name,
      seller.store_name,
      reason
    );

    if (!emailResult.success) {
      console.warn("⚠️ Email penolakan gagal dikirim:", emailResult.error);
      return NextResponse.json(
        {
          message:
            "Pendaftaran berhasil ditolak, namun email penolakan gagal dikirim",
          warning: "Email delivery failed",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message:
          "Pendaftaran berhasil ditolak dan email notifikasi telah dikirim",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server", details: error },
      { status: 500 }
    );
  }
}
