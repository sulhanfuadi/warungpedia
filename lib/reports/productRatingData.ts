import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface SellerInfo {
  store_name: string | null;
  pic_province: string | null;
}

interface ProductRow {
  id: string;
  name: string | null;
  category: string | null;
  price: number;
  stock: number | null;
  seller_id: string | null;
  sellers: SellerInfo[] | SellerInfo | null;
}

interface ProductFeedbackRow {
  product_id: string;
  rating: number | null;
}

export interface ProductRatingRecord {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  storeName: string;
  province: string;
  rating: number;
}

const DEFAULT_PROVINCE = "Tidak diketahui";

export async function fetchProductRatingData(): Promise<ProductRatingRecord[]> {
  const { data: products, error } = await supabaseAdmin
    .from<ProductRow>("products")
    .select(
      `id, name, category, price, stock, seller_id, sellers!products_seller_id_fkey (store_name, pic_province)`,
    );

  if (error) {
    throw new Error(`Gagal mengambil data produk: ${error.message}`);
  }

  const rows = products ?? [];
  if (rows.length === 0) {
    return [];
  }

  const productIds = rows.map((row) => row.id);

  const { data: feedbacks, error: feedbacksError } = await supabaseAdmin
    .from<ProductFeedbackRow>("product_feedbacks")
    .select("product_id, rating")
    .in("product_id", productIds);

  if (feedbacksError) {
    console.warn("[ProductRatingData] Tidak dapat mengambil tabel feedback, lanjut tanpa rating", feedbacksError.message);
  }

  const ratingMap = new Map<string, { sum: number; count: number }>();
  (feedbacks ?? []).forEach((feedback) => {
    if (!ratingMap.has(feedback.product_id)) {
      ratingMap.set(feedback.product_id, { sum: 0, count: 0 });
    }
    const bucket = ratingMap.get(feedback.product_id)!;
    bucket.sum += feedback.rating || 0;
    bucket.count += 1;
  });

  const records: ProductRatingRecord[] = rows.map((product) => {
    const sellerInfoRaw = product.sellers;
    const sellerInfo = Array.isArray(sellerInfoRaw)
      ? sellerInfoRaw[0]
      : sellerInfoRaw;

    const ratingData = ratingMap.get(product.id);
    const average = ratingData && ratingData.count > 0 ? ratingData.sum / ratingData.count : 0;

    return {
      id: product.id,
      name: product.name ?? "-",
      category: product.category ?? "-",
      price: product.price,
      stock: product.stock ?? 0,
      storeName: sellerInfo?.store_name ?? "-",
      province: sellerInfo?.pic_province ?? DEFAULT_PROVINCE,
      rating: Math.round(average * 100) / 100,
    };
  });

  records.sort((left, right) => {
    if (right.rating !== left.rating) {
      return right.rating - left.rating;
    }
    return left.name.localeCompare(right.name, "id", { sensitivity: "base" });
  });

  return records;
}
