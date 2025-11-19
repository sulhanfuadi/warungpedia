import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = params.id;
    const body = await request.json();
    const { reason } = body;

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

    if (fetchError || !seller) {
      return NextResponse.json(
        { error: "Penjual tidak ditemukan" },
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

    // TODO: Send rejection email
    console.log(`📧 Sending rejection email to ${seller.pic_email}`);
    console.log(`   Name: ${seller.pic_name}`);
    console.log(`   Store: ${seller.store_name}`);
    console.log(`   Reason: ${reason}`);

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
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
