import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface ProductLowStockData {
  id: string;
  name: string;
  stock: number;
  price: number;
  category: string;
}

// Consistent styling with other reports
const PAGE_SIZE: [number, number] = [842, 595]; // Landscape A4
const MARGIN_X = 40;
const HEADER_BG = rgb(0.8, 0.2, 0); // Red header for low stock alert
const HEADER_TEXT = rgb(1, 1, 1); // White text
const ROW_ALT_BG = rgb(0.95, 0.95, 0.95);

// SRS-MartPlace-14: Kolom No | Produk | Kategori | Harga | Stock
const columns = [
  { key: "no", title: "No", width: 40 },
  { key: "product", title: "Produk", width: 250 },
  { key: "category", title: "Kategori", width: 140 },
  { key: "price", title: "Harga (Rp)", width: 140 },
  { key: "stock", title: "Stock", width: 80 },
] as const;

type ColumnKey = (typeof columns)[number]["key"];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

const columnGetter: Record<
  ColumnKey,
  (record: ProductLowStockData, index: number) => string
> = {
  no: (_record, index) => (index + 1).toString(),
  product: (record) => record.name,
  category: (record) => record.category,
  price: (record) => formatCurrency(record.price),
  stock: (record) => record.stock.toString(),
};

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
  boldFont: import("pdf-lib").PDFFont;
  record: ProductLowStockData;
  index: number;
  startY: number;
}) {
  const { page, font, boldFont, record, index, startY } = options;
  const rowHeight = 22;
  const textY = startY - rowHeight + 6;
  let currentX = MARGIN_X;

  // Background color based on stock level
  const fillColor =
    record.stock === 0
      ? rgb(1, 0.9, 0.9) // Light red for out of stock
      : record.stock === 1
      ? rgb(1, 0.95, 0.85) // Light orange for critical
      : index % 2 === 0
      ? ROW_ALT_BG
      : undefined;

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
      rawText.length > 40 ? `${rawText.slice(0, 37)}...` : rawText;

    // Determine text color based on column and stock level
    let textColor = rgb(0.15, 0.15, 0.15); // Default dark
    let useFont = font;

    if (column.key === "stock") {
      useFont = boldFont;
      if (record.stock === 0) {
        textColor = rgb(0.8, 0, 0); // Red for out of stock
      } else if (record.stock === 1) {
        textColor = rgb(0.8, 0.4, 0); // Orange for critical
      } else {
        textColor = rgb(0.6, 0.3, 0); // Dark orange for low
      }
    }

    page.drawText(truncated, {
      x: currentX + 6,
      y: textY,
      size: 9,
      font: useFont,
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
  page.drawText("* Produk dengan stok < 2 memerlukan restok segera", {
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

function drawLegend(options: {
  page: import("pdf-lib").PDFPage;
  font: import("pdf-lib").PDFFont;
  boldFont: import("pdf-lib").PDFFont;
  startY: number;
}) {
  const { page, font, boldFont, startY } = options;
  let y = startY;

  page.drawText("Keterangan:", {
    x: MARGIN_X,
    y: y,
    size: 9,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 14;

  // Stok 0 legend
  page.drawRectangle({
    x: MARGIN_X,
    y: y - 2,
    width: 12,
    height: 12,
    color: rgb(1, 0.9, 0.9),
  });
  page.drawText("Stok 0 (Habis - Prioritas Tinggi)", {
    x: MARGIN_X + 18,
    y: y,
    size: 8,
    font: font,
    color: rgb(0.8, 0, 0),
  });
  y -= 14;

  // Stok 1 legend
  page.drawRectangle({
    x: MARGIN_X,
    y: y - 2,
    width: 12,
    height: 12,
    color: rgb(1, 0.95, 0.85),
  });
  page.drawText("Stok 1 (Kritis - Segera Restok)", {
    x: MARGIN_X + 18,
    y: y,
    size: 8,
    font: font,
    color: rgb(0.8, 0.4, 0),
  });

  return y - 10;
}

export async function generateStokMenipisPDF(
  sellerId: string
): Promise<Uint8Array> {
  try {
    console.log(
      "📄 [PDF-MENIPIS] Starting generateStokMenipisPDF for:",
      sellerId
    );

    // Query seller info
    const { data: seller, error: sellerError } = await supabaseAdmin
      .from("sellers")
      .select("store_name, pic_name, pic_phone, pic_email")
      .eq("id", sellerId)
      .single();

    if (sellerError) {
      console.error("❌ [PDF-MENIPIS] Seller error:", sellerError);
    }

    // Query data produk dengan stok < 2 (SRS-MartPlace-14)
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, name, stock, price, category")
      .eq("seller_id", sellerId)
      .lt("stock", 2)
      .order("stock", { ascending: true });

    if (error) {
      console.error("❌ [PDF-MENIPIS] Database error:", error);
      throw new Error(
        `Gagal mengambil data produk stok menipis: ${error.message}`
      );
    }

    console.log("✅ [PDF-MENIPIS] Products fetched:", products?.length || 0);

    // Map products
    const mappedProducts: ProductLowStockData[] = (products ?? []).map(
      (product) => ({
        id: product.id,
        name: product.name ?? "-",
        category: product.category ?? "-",
        price: product.price ?? 0,
        stock: product.stock ?? 0,
      })
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

      page.drawText("Laporan Stok Menipis (lanjutan)", {
        x: MARGIN_X,
        y: cursorY,
        size: 14,
        font: headerFont,
        color: rgb(0.8, 0.2, 0),
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
      `Laporan Stok Menipis - ${seller?.store_name || "Toko Saya"}`,
      {
        x: MARGIN_X,
        y: cursorY,
        size: 16,
        font: headerFont,
        color: rgb(0.8, 0.2, 0), // Red for alert
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

    // Count by stock level
    const outOfStock = mappedProducts.filter((p) => p.stock === 0).length;
    const critical = mappedProducts.filter((p) => p.stock === 1).length;

    const summaryLines = [
      `Tanggal dibuat : ${createdAt}`,
      `Total produk stok menipis (< 2) : ${mappedProducts.length}`,
      mappedProducts.length > 0
        ? `Stok 0 (Habis): ${outOfStock} | Stok 1 (Kritis): ${critical}`
        : "Semua produk memiliki stok yang cukup",
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

    // ==================== WARNING BOX (if has products) ====================
    if (mappedProducts.length > 0) {
      page.drawRectangle({
        x: MARGIN_X,
        y: cursorY - 22,
        width: width - MARGIN_X * 2,
        height: 22,
        color: rgb(1, 0.95, 0.9),
      });
      page.drawText("PERHATIAN: Produk berikut memerlukan restok segera!", {
        x: MARGIN_X + 10,
        y: cursorY - 15,
        size: 10,
        font: headerFont,
        color: rgb(0.8, 0.2, 0),
      });
      cursorY -= 32;
    }

    // ==================== TABLE / EMPTY STATE ====================
    if (mappedProducts.length === 0) {
      page.drawRectangle({
        x: MARGIN_X,
        y: cursorY - 50,
        width: width - MARGIN_X * 2,
        height: 50,
        color: rgb(0.9, 1, 0.9),
      });
      page.drawText("Tidak ada produk dengan stok menipis (< 2)", {
        x: MARGIN_X + 20,
        y: cursorY - 22,
        size: 12,
        font: headerFont,
        color: rgb(0, 0.6, 0),
      });
      page.drawText("Semua produk Anda memiliki stok yang cukup.", {
        x: MARGIN_X + 20,
        y: cursorY - 38,
        size: 10,
        font: bodyFont,
        color: rgb(0, 0.5, 0),
      });
    } else {
      drawTableHeader({ page, headerFont, startY: cursorY });
      cursorY -= 28;

      mappedProducts.forEach((record, index) => {
        ensureSpace(30);
        drawRow({
          page,
          font: bodyFont,
          boldFont: headerFont,
          record,
          index,
          startY: cursorY,
        });
        cursorY -= 24;
      });

      // Draw legend after table
      ensureSpace(50);
      cursorY -= 10;
      drawLegend({
        page,
        font: bodyFont,
        boldFont: headerFont,
        startY: cursorY,
      });
    }

    drawFooter({ page, font: bodyFont, width, pageNumber });

    console.log("📄 [PDF-MENIPIS] Saving PDF...");
    const pdfBytes = await pdfDoc.save();
    console.log(
      "✅ [PDF-MENIPIS] PDF saved successfully, size:",
      pdfBytes.length
    );

    return pdfBytes;
  } catch (error) {
    console.error("❌ [PDF-MENIPIS] Error:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack");
    throw error;
  }
}
