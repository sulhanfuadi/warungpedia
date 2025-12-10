import { supabaseAdmin } from "@/lib/supabaseAdmin";

export class SellerStockReportError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface SellerProfileRow {
  id: string;
  user_id: string | null;
  store_name: string | null;
}

interface SellerProductRow {
  id: string;
  name: string | null;
  category: string | null;
  price: number;
  stock: number | null;
}

interface ProductFeedbackRow {
  product_id: string;
  rating: number | null;
}

export interface SellerStockReportItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
}

interface SellerMetadata {
  seller?: {
    id?: string;
    store_name?: string;
    storeName?: string;
  };
  store_name?: string;
  name?: string;
}

export async function fetchSellerStockReportData(params: {
  token: string;
  sellerId: string;
}): Promise<{ products: SellerStockReportItem[]; storeName: string; sellerUserId: string }> {
  const { token, sellerId } = params;

  const { data: authUser, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authUser?.user) {
    throw new SellerStockReportError(401, "Unauthorized - Token tidak valid");
  }

  const userMetadata = authUser.user.user_metadata as SellerMetadata | undefined;
  const metadataSeller = userMetadata?.seller;
  const fallbackStoreName = metadataSeller?.store_name || metadataSeller?.storeName || userMetadata?.store_name;

  const { data: sellerRow, error: sellerError } = await supabaseAdmin
    .from<SellerProfileRow>("sellers")
    .select("id, user_id, store_name")
    .or(`id.eq.${sellerId},user_id.eq.${sellerId}`)
    .limit(1)
    .maybeSingle();

  if (sellerError) {
    console.warn("[SellerStockReport] Seller query error", sellerError.message);
  }

  const resolvedSeller = sellerRow ||
    (sellerId === authUser.user.id
      ? {
          id: sellerId,
          user_id: authUser.user.id,
          store_name: fallbackStoreName || "Toko Saya",
        }
      : null);

  if (!resolvedSeller) {
    throw new SellerStockReportError(404, "Seller tidak ditemukan");
  }

  const ownsSellerProfile = resolvedSeller.user_id
    ? resolvedSeller.user_id === authUser.user.id
    : resolvedSeller.id === authUser.user.id;

  if (!ownsSellerProfile) {
    throw new SellerStockReportError(403, "Anda tidak memiliki akses ke profil penjual ini");
  }

  const { data: products, error: productsError } = await supabaseAdmin
    .from<SellerProductRow>("products")
    .select("id, name, category, price, stock")
    .eq("seller_id", sellerId);

  if (productsError) {
    throw new SellerStockReportError(500, `Gagal mengambil data produk: ${productsError.message}`);
  }

  const rows = products ?? [];
  const productIds = rows.map((row) => row.id);

  let feedbacks: ProductFeedbackRow[] = [];
  if (productIds.length > 0) {
    const { data: feedbackRows, error: feedbacksError } = await supabaseAdmin
      .from<ProductFeedbackRow>("product_feedbacks")
      .select("product_id, rating")
      .in("product_id", productIds);

    if (feedbacksError) {
      console.warn(
        "[SellerStockReport] Tidak dapat mengambil data feedback, lanjut tanpa rating",
        feedbacksError.message,
      );
    } else {
      feedbacks = feedbackRows ?? [];
    }
  }

  const ratingMap = new Map<string, { sum: number; count: number }>();
  feedbacks.forEach((feedback) => {
    if (!ratingMap.has(feedback.product_id)) {
      ratingMap.set(feedback.product_id, { sum: 0, count: 0 });
    }
    const stats = ratingMap.get(feedback.product_id)!;
    stats.sum += feedback.rating || 0;
    stats.count += 1;
  });

  const mapped: SellerStockReportItem[] = rows.map((product) => {
    const ratingData = ratingMap.get(product.id);
    const avg = ratingData && ratingData.count > 0 ? ratingData.sum / ratingData.count : 0;
    return {
      id: product.id,
      name: product.name ?? "-",
      category: product.category ?? "-",
      price: product.price,
      stock: product.stock ?? 0,
      rating: Math.round(avg * 100) / 100,
    };
  });

  // SRS-MartPlace-12: sort stok menurun, lalu nama produk asc
  mapped.sort((left, right) => {
    if (right.stock !== left.stock) {
      return right.stock - left.stock;
    }
    return left.name.localeCompare(right.name, "id", { sensitivity: "base" });
  });

  return {
    products: mapped,
    storeName: resolvedSeller.store_name || fallbackStoreName || "Toko Saya",
    sellerUserId: resolvedSeller.user_id || authUser.user.id,
  };
}
