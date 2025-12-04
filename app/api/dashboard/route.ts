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

    console.log("📊 Fetching dashboard for seller:", sellerId);

    const data = await getSellerDashboardStats(sellerId);

    if (!data) {
      console.error("❌ No data returned from controller");
      return NextResponse.json(
        { error: "Data dashboard tidak ditemukan" },
        { status: 404 }
      );
    }

    console.log("✅ Dashboard data fetched successfully:", {
      products: data.stockDistribution.length,
      ratings: data.ratingDistribution.length,
      provinces: data.provinceDistribution.length,
    });

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
