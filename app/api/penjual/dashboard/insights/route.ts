import { NextRequest, NextResponse } from "next/server";
import { getSellerDashboardStats } from "@/lib/controllers/sellerDashboardController";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json(
        { error: "Parameter sellerId wajib ada" },
        { status: 400 },
      );
    }

    const data = await getSellerDashboardStats(sellerId);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memuat dashboard", details: String(error) },
      { status: 500 },
    );
  }
}
