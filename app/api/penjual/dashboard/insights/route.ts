import { NextRequest, NextResponse } from "next/server";
import { getSellerDashboardStats } from "@/lib/controllers/sellerDashboardController";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json(
        { error: "Parameter sellerId wajib ada" },
        { status: 400 }
      );
    }

    // ✅ DEBUG LOGGING
    console.log("📊 Fetching dashboard for seller:", sellerId);

    const data = await getSellerDashboardStats(sellerId);

    // ✅ VALIDASI DATA
    if (!data) {
      console.error("❌ No data returned from controller");
      return NextResponse.json(
        { error: "Data dashboard tidak ditemukan" },
        { status: 404 }
      );
    }

    console.log("✅ Dashboard data fetched successfully");
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Dashboard API Error:", error);
    return NextResponse.json(
      {
        error: "Gagal memuat dashboard",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
