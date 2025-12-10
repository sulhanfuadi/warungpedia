import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface Seller {
  id: string;
  store_name: string;
  pic_name: string;
  pic_email: string;
  pic_phone: string;
  pic_city: string;
  pic_province: string;
  status: "PENDING" | "ACTIVE" | "INACTIVE" | "REJECTED";
  created_at: string;
  verified_at: string | null;
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔵 [PDF Report] Request started");
    
    // Get filter status dari query params
    const searchParams = request.nextUrl.searchParams;
    const filterStatus = searchParams.get("status") || "ALL";
    const format = searchParams.get("format") || "json";

    console.log(`🔵 [PDF Report] Filter: ${filterStatus}, Format: ${format}`);

    // Fetch sellers dari database
    let query = supabaseAdmin.from<Seller>("sellers").select("*");

    // Apply status filter
    if (filterStatus !== "ALL" && filterStatus !== "PENDING") {
      query = query.eq("status", filterStatus);
    } else if (filterStatus === "PENDING") {
      query = query.eq("status", "PENDING");
    }

    console.log(`🔵 [PDF Report] Fetching sellers from database...`);
    
    const { data: sellers, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("❌ [PDF Report] Error fetching sellers:", error);
      return NextResponse.json(
        { error: "Gagal mengambil data penjual", details: error.message },
        { status: 500 }
      );
    }

    console.log(`🔵 [PDF Report] Sellers fetched: ${sellers?.length || 0} records`);

    if (!sellers || sellers.length === 0) {
      console.warn("⚠️ [PDF Report] No sellers found");
      return NextResponse.json(
        { error: "Tidak ada data penjual" },
        { status: 404 }
      );
    }

    // Always return JSON - client will handle PDF generation
    console.log(`✅ [PDF Report] Returning data as JSON`);
    return NextResponse.json({
      success: true,
      data: sellers.map((seller, index) => ({
        no: index + 1,
        store_name: seller.store_name,
        pic_name: seller.pic_name,
        pic_email: seller.pic_email,
        pic_city: seller.pic_city,
        pic_province: seller.pic_province,
        status: seller.status,
        created_at: seller.created_at,
      })),
      totalRecords: sellers.length,
      filterStatus,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [PDF Report] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "No stack trace";
    console.error("❌ [PDF Report] Error details:", { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { 
        error: "Terjadi kesalahan server",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
