import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface ProductStokData {
  id: string;
  name: string;
  stock: number;
  price: number;
  category: string;
  rating: number;
}

interface ProductFeedbackRow {
  product_id: string;
  rating: number | null;
}

// Consistent styling with other reports
const PAGE_SIZE: [number, number] = [842, 595]; // Landscape A4
const MARGIN_X = 40;
const HEADER_BG = rgb(7 / 255, 121 / 255, 255 / 255); // Blue header
const HEADER_TEXT = rgb(1, 1, 1); // White text
const ROW_ALT_BG = rgb(0.95, 0.95, 0.95);

// SRS-MartPlace-12: Kolom wajib No | Produk | Kategori | Harga | Rating | Stock
// Stock di pojok kanan karena ini laporan fokus stok
const columns = [
  { key: "no", title: "No", width: 34 },
  { key: "product", title: "Produk", width: 200 },
  { key: "category", title: "Kategori", width: 120 },
  { key: "price", title: "Harga (Rp)", width: 120 },
  { key: "rating", title: "Rating", width: 80 },
  { key: "stock", title: "Stock", width: 80 },
] as const;

type ColumnKey = (typeof columns)[number]["key"];

const columnGetter: Record<
  ColumnKey,
  (record: ProductStokData, index: number) => string
> = {
  no: (_record, index) => (index + 1).toString(),
  product: (record) => record.name,
  category: (record) => record.category,
  price: (record) => formatCurrency(record.price),
  rating: (record) => record.rating.toFixed(2),
  stock: (record) => record.stock.toString(),
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function drawTableHeader(options: {
  page: import("pdf-lib").PDFPage;
  headerFont: import("pdf-lib").PDFFont;
  startY: number;
}) {
  const { page, headerFont, startY } = options;
  let currentX = MARGIN_X;
  const headerHeight = 22;

  columns.forEach((column) => {
    page.drawRectangle({
      x: currentX,
      y: startY - headerHeight,
      width: column.width,
      height: headerHeight,
      color: HEADER_BG,
    });
    page.drawText(column.title, {
      x: currentX + 6,
      y: startY - headerHeight + 7,
      font: headerFont,
      size: 9,
      color: HEADER_TEXT,
    });
    currentX += column.width;
  });
}

function drawRow(options: {
  page: import("pdf-lib").PDFPage;
  font: import("pdf-lib").PDFFont;
  record: ProductStokData;
  index: number;
  startY: number;
}) {
  const { page, font, record, index, startY } = options;
  const rowHeight = 22;
  const textY = startY - rowHeight + 6;
  let currentX = MARGIN_X;

  const fillColor = index % 2 === 0 ? ROW_ALT_BG : undefined;

  columns.forEach((column) => {
    page.drawRectangle({
      x: currentX,
      y: startY - rowHeight,
      width: column.width,
      height: rowHeight,
      color: fillColor,
    });

    const rawText = columnGetter[column.key](record, index);
    const truncated =
      rawText.length > 38 ? `${rawText.slice(0, 35)}...` : rawText;

    // Stock column gets blue color (focus of this report), rating gets gray
    const textColor =
      column.key === "stock"
        ? rgb(0.07, 0.48, 0.95) // Blue for stock (main focus)
        : column.key === "rating"
        ? rgb(0.3, 0.3, 0.3) // Gray for rating
        : rgb(0.15, 0.15, 0.15); // Default dark

    page.drawText(truncated, {
      x: currentX + 6,
      y: textY,
      size: 9,
      font,
      color: textColor,
      maxWidth: column.width - 12,
    });

    currentX += column.width;
  });
}

function drawFooter(options: {
  page: import("pdf-lib").PDFPage;
  font: import("pdf-lib").PDFFont;
  width: number;
  pageNumber: number;
}) {
  const { page, font, width, pageNumber } = options;
  page.drawLine({
    start: { x: MARGIN_X, y: 50 },
    end: { x: width - MARGIN_X, y: 50 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  page.drawText("* Laporan diurutkan berdasarkan jumlah stok (terbanyak)", {
    x: MARGIN_X,
    y: 32,
    size: 8,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText(`Halaman ${pageNumber}`, {
    x: width - MARGIN_X - 70,
    y: 32,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
}

export async function generateStokByStokPDF(
  sellerId: string
): Promise<Uint8Array> {
  try {
    console.log("📄 [PDF-GEN] Starting generateStokByStokPDF for:", sellerId);

    // Query seller info
    const { data: seller, error: sellerError } = await supabaseAdmin
      .from("sellers")
      .select("store_name, pic_name, pic_phone, pic_email")
      .eq("id", sellerId)
      .single();

    if (sellerError) {
      console.error("❌ [PDF-GEN] Seller error:", sellerError);
    }

    // Query data produk (urut stok menurun)
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, name, stock, price, category")
      .eq("seller_id", sellerId)
      .order("stock", { ascending: false });

    if (error) {
      console.error("❌ [PDF-GEN] Database error:", error);
      throw new Error(`Gagal mengambil data produk: ${error.message}`);
    }

    console.log("✅ [PDF-GEN] Products fetched:", products?.length || 0);

    // Fetch rating data for products
    const productIds = (products ?? []).map((p) => p.id);
    let feedbacks: ProductFeedbackRow[] = [];
    if (productIds.length > 0) {
      const { data: feedbackRows, error: feedbacksError } = await supabaseAdmin
        .from("product_feedbacks")
        .select("product_id, rating")
        .in("product_id", productIds);

      if (feedbacksError) {
        console.warn(
          "[PDF-GEN] Tidak dapat mengambil data feedback, lanjut tanpa rating",
          feedbacksError.message
        );
      } else {
        feedbacks = feedbackRows ?? [];
      }
    }

    // Calculate rating averages
    const ratingMap = new Map<string, { sum: number; count: number }>();
    feedbacks.forEach((feedback) => {
      if (!ratingMap.has(feedback.product_id)) {
        ratingMap.set(feedback.product_id, { sum: 0, count: 0 });
      }
      const stats = ratingMap.get(feedback.product_id)!;
      stats.sum += feedback.rating || 0;
      stats.count += 1;
    });

    // Map products with rating
    const mappedProducts: ProductStokData[] = (products ?? []).map(
      (product) => {
        const ratingData = ratingMap.get(product.id);
        const avg =
          ratingData && ratingData.count > 0
            ? ratingData.sum / ratingData.count
            : 0;
        return {
          id: product.id,
          name: product.name ?? "-",
          category: product.category ?? "-",
          price: product.price ?? 0,
          stock: product.stock ?? 0,
          rating: Math.round(avg * 100) / 100,
        };
      }
    );

    const pdfDoc = await PDFDocument.create();
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const headerFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage(PAGE_SIZE);
    let { width, height } = page.getSize();
    let cursorY = height - 50;
    let pageNumber = 1;

    const ensureSpace = (required: number) => {
      if (cursorY - required > 70) {
        return;
      }

      drawFooter({ page, font: bodyFont, width, pageNumber });
      pageNumber += 1;
      page = pdfDoc.addPage(PAGE_SIZE);
      ({ width, height } = page.getSize());
      cursorY = height - 50;

      page.drawText("Laporan Stok Produk (lanjutan)", {
        x: MARGIN_X,
        y: cursorY,
        size: 14,
        font: headerFont,
        color: rgb(0.15, 0.15, 0.15),
      });
      cursorY -= 28;

      // Redraw table header on new page
      drawTableHeader({ page, headerFont, startY: cursorY });
      cursorY -= 28;
    };

    // ==================== HEADER ====================
    page.drawText("Warungpedia Seller Platform", {
      x: MARGIN_X,
      y: cursorY,
      size: 12,
      font: headerFont,
      color: rgb(0.07, 0.48, 0.95),
    });
    cursorY -= 18;

    page.drawText(
      `Laporan Stok Produk – ${seller?.store_name || "Toko Saya"}`,
      {
        x: MARGIN_X,
        y: cursorY,
        size: 16,
        font: headerFont,
        color: rgb(0.15, 0.15, 0.15),
      }
    );
    cursorY -= 30;

    // ==================== SUMMARY INFO ====================
    const currentDate = new Date();
    const createdAt = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(currentDate);

    // Calculate highest and lowest stock
    const sortedByStock = [...mappedProducts].sort((a, b) => b.stock - a.stock);
    const highestStock = sortedByStock.length > 0 ? sortedByStock[0].stock : 0;
    const lowestStock =
      sortedByStock.length > 0
        ? sortedByStock[sortedByStock.length - 1].stock
        : 0;

    const summaryLines = [
      `Tanggal dibuat : ${createdAt}`,
      `Total produk   : ${mappedProducts.length}`,
      mappedProducts.length > 0
        ? `Stok tertinggi : ${highestStock} | Stok terendah : ${lowestStock}`
        : "Belum ada data produk untuk ditampilkan",
    ];

    summaryLines.forEach((line) => {
      page.drawText(line, {
        x: MARGIN_X,
        y: cursorY,
        size: 10,
        font: bodyFont,
        color: rgb(0.25, 0.25, 0.25),
      });
      cursorY -= 16;
    });

    cursorY -= 10;

    // ==================== TABLE ====================
    if (mappedProducts.length === 0) {
      page.drawRectangle({
        x: MARGIN_X,
        y: cursorY - 40,
        width: width - MARGIN_X * 2,
        height: 40,
        color: rgb(0.97, 0.97, 0.97),
      });
      page.drawText("Belum ada produk yang dapat ditampilkan.", {
        x: MARGIN_X + 10,
        y: cursorY - 18,
        size: 11,
        font: bodyFont,
        color: rgb(0.35, 0.35, 0.35),
      });
    } else {
      drawTableHeader({ page, headerFont, startY: cursorY });
      cursorY -= 28;

      mappedProducts.forEach((record, index) => {
        ensureSpace(30);
        drawRow({ page, font: bodyFont, record, index, startY: cursorY });
        cursorY -= 24;
      });
    }

    drawFooter({ page, font: bodyFont, width, pageNumber });

    console.log("📄 [PDF-GEN] Saving PDF...");
    const pdfBytes = await pdfDoc.save();
    console.log("✅ [PDF-GEN] PDF saved successfully, size:", pdfBytes.length);

    return pdfBytes;
  } catch (error) {
    console.error("❌ [PDF-GEN] Error in generateStokByStokPDF:");
    console.error("Error:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack");
    throw error;
  }
}
