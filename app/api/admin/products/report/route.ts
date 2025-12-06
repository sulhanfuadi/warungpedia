import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface ProductWithRating {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔵 [Products Report] Request started");

    // Fetch all products
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select(
        `id, name, category, price, stock, created_at`
      )
      .order("created_at", { ascending: false });

    if (productsError) {
      console.error("❌ [Products Report] Error fetching products:", productsError);
      return NextResponse.json(
        { error: "Gagal mengambil data produk", details: productsError.message },
        { status: 500 }
      );
    }

    console.log(`🔵 [Products Report] Products fetched: ${products?.length || 0} records`);

    if (!products || products.length === 0) {
      console.warn("⚠️ [Products Report] No products found");
      return NextResponse.json({
        success: true,
        data: [],
        totalRecords: 0,
        generatedAt: new Date().toISOString(),
      });
    }

    // Fetch ratings for each product from product_feedbacks
    const productIds = products.map((p: any) => p.id);
    const { data: feedbacks, error: feedbacksError } = await supabaseAdmin
      .from("product_feedbacks")
      .select("product_id, rating")
      .in("product_id", productIds);

    // If table doesn't exist, gracefully handle with empty feedbacks
    let processedFeedbacks = feedbacks || [];
    if (feedbacksError) {
      console.warn("⚠️ [Products Report] Feedbacks table not available:", feedbacksError.message);
      // Continue with empty feedbacks instead of failing
      processedFeedbacks = [];
    } else {
      console.log(`🔵 [Products Report] Feedbacks fetched: ${feedbacks?.length || 0} records`);
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

    // Map products with ratings and sort by rating descending
    const productsWithRating: ProductWithRating[] = products.map((p: any) => {
      const ratingData = ratingMap.get(p.id);
      const avgRating = ratingData && ratingData.count > 0 ? ratingData.sum / ratingData.count : 0;
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        rating: Math.round(avgRating * 100) / 100, // 2 decimal places
        stock: p.stock || 0,
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

    console.log(`✅ [Products Report] Returning ${productsWithRating.length} products with ratings`);

    return NextResponse.json({
      success: true,
      data: productsWithRating,
      totalRecords: productsWithRating.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [Products Report] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [Products Report] Error details:", errorMessage);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
