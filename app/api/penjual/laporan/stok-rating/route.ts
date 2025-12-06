import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface ProductStockWithRating {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  created_at: string;
}

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.substring(7);
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔵 [Seller Stock Report] Request started");

    // Auth check
    const token = getBearerToken(request);
    if (!token) {
      console.log("❌ [Seller Stock Report] No token found");
      return NextResponse.json(
        { error: "Unauthorized - Token tidak ditemukan" },
        { status: 401 }
      );
    }

    // Verify token
    const { data: authUser, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser?.user) {
      console.error("❌ [Seller Stock Report] Auth Error:", authError);
      return NextResponse.json(
        { error: "Unauthorized - Token tidak valid" },
        { status: 401 }
      );
    }

    console.log("✅ [Seller Stock Report] Token verified for user:", authUser.user.id);

    // Get sellerId from query params
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      console.log("❌ [Seller Stock Report] No sellerId in query");
      return NextResponse.json(
        { error: "sellerId query parameter wajib diisi" },
        { status: 400 }
      );
    }

    // Verify seller ownership
    const { data: seller, error: sellerError } = await supabaseAdmin
      .from("sellers")
      .select("id, user_id, store_name")
      .eq("id", sellerId)
      .single();

    if (sellerError || !seller) {
      console.error("❌ [Seller Stock Report] Seller not found:", sellerError);
      return NextResponse.json(
        { error: "Seller tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if user owns this seller profile
    if (seller.user_id !== authUser.user.id) {
      console.log("❌ [Seller Stock Report] User does not own this seller profile");
      return NextResponse.json(
        { error: "Anda tidak memiliki akses ke profil penjual ini" },
        { status: 403 }
      );
    }

    console.log("✅ [Seller Stock Report] Seller verified:", seller.store_name);

    // Fetch all products for this seller
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, category, price, stock, created_at")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (productsError) {
      console.error("❌ [Seller Stock Report] Error fetching products:", productsError);
      return NextResponse.json(
        { error: "Gagal mengambil data produk", details: productsError.message },
        { status: 500 }
      );
    }

    console.log(
      `🔵 [Seller Stock Report] Products fetched: ${products?.length || 0} records`
    );

    if (!products || products.length === 0) {
      console.warn("⚠️ [Seller Stock Report] No products found");
      return NextResponse.json({
        success: true,
        data: [],
        totalRecords: 0,
        storeName: seller.store_name,
        generatedAt: new Date().toISOString(),
      });
    }

    // Fetch ratings for each product
    const productIds = products.map((p: any) => p.id);
    const { data: feedbacks, error: feedbacksError } = await supabaseAdmin
      .from("product_feedbacks")
      .select("product_id, rating")
      .in("product_id", productIds);

    let processedFeedbacks = feedbacks || [];
    if (feedbacksError) {
      console.warn(
        "⚠️ [Seller Stock Report] Feedbacks table not available:",
        feedbacksError.message
      );
      processedFeedbacks = [];
    } else {
      console.log(
        `🔵 [Seller Stock Report] Feedbacks fetched: ${feedbacks?.length || 0} records`
      );
    }

    // Calculate average rating per product
    const ratingMap = new Map<string, { sum: number; count: number }>();
    (processedFeedbacks || []).forEach((fb: any) => {
      if (!ratingMap.has(fb.product_id)) {
        ratingMap.set(fb.product_id, { sum: 0, count: 0 });
      }
      const current = ratingMap.get(fb.product_id)!;
      current.sum += fb.rating || 0;
      current.count += 1;
    });

    // Map products with ratings
    const productsWithRating: ProductStockWithRating[] = products.map((p: any) => {
      const ratingData = ratingMap.get(p.id);
      const avgRating =
        ratingData && ratingData.count > 0 ? ratingData.sum / ratingData.count : 0;
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock || 0,
        rating: Math.round(avgRating * 100) / 100,
        created_at: p.created_at,
      };
    });

    // Sort by rating descending, then by stock descending
    productsWithRating.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.stock - a.stock;
    });

    console.log(
      `✅ [Seller Stock Report] Returning ${productsWithRating.length} products with ratings`
    );

    return NextResponse.json({
      success: true,
      data: productsWithRating,
      totalRecords: productsWithRating.length,
      storeName: seller.store_name,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [Seller Stock Report] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [Seller Stock Report] Error details:", errorMessage);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
