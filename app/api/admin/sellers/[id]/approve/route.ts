import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sellerId = params.id;

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

    // Update status to ACTIVE and set verified_at
    const { error: updateError } = await supabaseAdmin
      .from("sellers")
      .update({
        status: "ACTIVE",
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

    // Send activation email via Supabase Auth
    const { error: emailError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(seller.pic_email, {
        redirectTo: `${
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        }/penjual/login`,
      });

    if (emailError) {
      console.warn("⚠️ Email aktivasi gagal dikirim:", emailError);
      // Still return success because the main operation (status update) succeeded
    } else {
      console.log(`✅ Email aktivasi dikirim ke ${seller.pic_email}`);
    }

    return NextResponse.json(
      {
        message:
          "Pendaftaran berhasil disetujui dan email aktivasi telah dikirim",
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
