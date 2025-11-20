import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendApprovalEmail } from "@/lib/services/emailService";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ AWAIT params dulu!
    const { id: sellerId } = await context.params;

    // 🔍 Debug logging
    console.log("=== DEBUG APPROVE API ===");
    console.log("Seller ID:", sellerId);

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

    // Generate magic link untuk aktivasi akun (via Supabase Auth)
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: seller.pic_email,
        options: {
          redirectTo: `${
            process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
          }/penjual/dashboard`,
        },
      });

    if (linkError) {
      console.error("❌ Failed to generate magic link:", linkError);
      return NextResponse.json(
        {
          message:
            "Pendaftaran berhasil disetujui, namun gagal generate link aktivasi",
          warning: "Link generation failed",
        },
        { status: 200 }
      );
    }

    const activationLink = linkData?.properties?.action_link || "";

    // Send approval email dengan link aktivasi
    const emailResult = await sendApprovalEmail(
      seller.pic_email,
      seller.pic_name,
      seller.store_name,
      activationLink
    );

    if (!emailResult.success) {
      console.warn("⚠️ Email aktivasi gagal dikirim:", emailResult.error);
      return NextResponse.json(
        {
          message:
            "Pendaftaran berhasil disetujui, namun email aktivasi gagal dikirim",
          warning: "Email delivery failed",
        },
        { status: 200 }
      );
    }

    console.log(`✅ Approval email sent to ${seller.pic_email}`);

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
      { error: "Terjadi kesalahan server", details: error },
      { status: 500 }
    );
  }
}
