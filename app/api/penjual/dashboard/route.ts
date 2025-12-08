import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ProductRow = {
  id: string;
  name: string;
  category: string | null;
  stock: number | null;
  price: number | null;
  main_photo_path?: string | null;
};

type FeedbackRow = {
  id: string;
  product_id: string;
  customer_name: string;
  comment: string;
  rating: number;
  province: string | null;
  created_at: string;
};

const RATING_BUCKETS = [5, 4, 3, 2, 1];

function buildEmptyResponse(sellerId: string) {
  return {
    sellerId,
    summary: {
      totalProducts: 0,
      totalFeedbacks: 0,
      averageRating: 0,
      lastFeedbackAt: null as string | null,
    },
    ratingDistribution: RATING_BUCKETS.map((rating) => ({
      rating,
      total: 0,
      percentage: 0,
    })),
    provinceDistribution: [] as { province: string; total: number }[],
    productPerformance: [] as Array<{
      id: string;
      name: string;
      category: string | null;
      stock: number | null;
      price: number | null;
      totalFeedbacks: number;
      averageRating: number;
    }>,
    recentFeedbacks: [] as Array<FeedbackRow & { product_name: string }>,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get("sellerId");

  if (!sellerId) {
    return NextResponse.json(
      { error: "Parameter sellerId wajib diisi" },
      { status: 400 },
    );
  }

  try {
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, category, stock, price, main_photo_path")
      .eq("seller_id", sellerId);

    if (productsError) {
      throw new Error(productsError.message);
    }

    if (!products || products.length === 0) {
      return NextResponse.json(buildEmptyResponse(sellerId));
    }

    const productMap = new Map<string, ProductRow>();
    const productStats = new Map<
      string,
      { total: number; sumRating: number }
    >();

    products.forEach((product) => {
      productMap.set(product.id, product);
      productStats.set(product.id, { total: 0, sumRating: 0 });
    });

    const productIds = Array.from(productMap.keys());

    const { data: feedbacks, error: feedbackError } = await supabaseAdmin
      .from("product_feedbacks")
      .select(
        "id, product_id, customer_name, comment, rating, province, created_at",
      )
      .in("product_id", productIds)
      .order("created_at", { ascending: false });

    if (feedbackError) {
      throw new Error(feedbackError.message);
    }

    if (!feedbacks || feedbacks.length === 0) {
      return NextResponse.json(buildEmptyResponse(sellerId));
    }

    const ratingCount: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    const provinceCount: Record<string, number> = {};

    feedbacks.forEach((feedback) => {
      const stat = productStats.get(feedback.product_id);
      if (stat) {
        stat.total += 1;
        stat.sumRating += feedback.rating;
      }
      ratingCount[feedback.rating as keyof typeof ratingCount] =
        (ratingCount[feedback.rating as keyof typeof ratingCount] ?? 0) + 1;
      const provinceKey = feedback.province?.trim() || "Tidak diketahui";
      provinceCount[provinceKey] = (provinceCount[provinceKey] ?? 0) + 1;
    });

    const totalFeedbacks = feedbacks.length;
    const averageRating =
      totalFeedbacks === 0
        ? 0
        : Number(
            (
              Object.entries(ratingCount).reduce(
                (sum, [rating, total]) => sum + Number(rating) * total,
                0,
              ) / totalFeedbacks
            ).toFixed(2),
          );

    const ratingDistribution = RATING_BUCKETS.map((rating) => {
      const total = ratingCount[rating] ?? 0;
      return {
        rating,
        total,
        percentage: totalFeedbacks ? Math.round((total / totalFeedbacks) * 100) : 0,
      };
    });

    const provinceDistribution = Object.entries(provinceCount)
      .map(([province, total]) => ({ province, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const productPerformance = products
      .map((product) => {
        const stat = productStats.get(product.id) ?? { total: 0, sumRating: 0 };
        const avg = stat.total ? Number((stat.sumRating / stat.total).toFixed(2)) : 0;
        return {
          id: product.id,
          name: product.name,
          category: product.category,
          stock: product.stock,
          price: product.price,
          totalFeedbacks: stat.total,
          averageRating: avg,
        };
      })
      .sort((a, b) => b.averageRating - a.averageRating);

    const recentFeedbacks = feedbacks.slice(0, 6).map((feedback) => ({
      ...feedback,
      product_name: productMap.get(feedback.product_id)?.name ?? "Produk",
    }));

    return NextResponse.json({
      sellerId,
      summary: {
        totalProducts: products.length,
        totalFeedbacks,
        averageRating,
        lastFeedbackAt: feedbacks[0]?.created_at ?? null,
      },
      ratingDistribution,
      provinceDistribution,
      productPerformance,
      recentFeedbacks,
    });
  } catch (error) {
    console.error("❌ Seller dashboard API error", error);
    return NextResponse.json(
      {
        error: "Gagal memuat dashboard penjual",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
