import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING, ACTIVE, INACTIVE, REJECTED, atau ALL

    let query = supabaseAdmin.from("sellers").select("*");

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    const { data: sellers, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Gagal mengambil data penjual" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sellers }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
