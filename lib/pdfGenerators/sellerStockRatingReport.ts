import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { SellerStockReportItem } from "@/lib/reports/sellerStockReportData";

const PAGE_SIZE: [number, number] = [842, 595];
const MARGIN_X = 40;
const HEADER_BG = rgb(7 / 255, 121 / 255, 255 / 255);
const HEADER_TEXT = rgb(1, 1, 1);
const ROW_ALT_BG = rgb(0.95, 0.95, 0.95);

// SRS-MartPlace-12: Kolom wajib No | Produk | Kategori | Harga | Stock | Rating
const columns = [
  { key: "no", title: "No", width: 34 },
  { key: "product", title: "Produk", width: 200 },
  { key: "category", title: "Kategori", width: 120 },
  { key: "price", title: "Harga (Rp)", width: 120 },
  { key: "stock", title: "Stock", width: 80 },
  { key: "rating", title: "Rating", width: 80 },
] as const;

type ColumnKey = (typeof columns)[number]["key"];

const columnGetter: Record<ColumnKey, (record: SellerStockReportItem, index: number) => string> = {
  no: (_record, index) => (index + 1).toString(),
  product: (record) => record.name,
  category: (record) => record.category,
  price: (record) => formatCurrency(record.price),
  stock: (record) => record.stock.toString(),
  rating: (record) => record.rating.toFixed(2),
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
  record: SellerStockReportItem;
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
    const truncated = rawText.length > 38 ? `${rawText.slice(0, 35)}...` : rawText;
    const textColor =
      column.key === "rating"
        ? rgb(0.07, 0.48, 0.95)
        : column.key === "stock"
          ? rgb(0.3, 0.3, 0.3)
          : rgb(0.15, 0.15, 0.15);

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
  page.drawText(`Halaman ${pageNumber}`, {
    x: width - MARGIN_X - 70,
    y: 32,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
}

export async function generateSellerStockRatingReport(options: {
  storeName: string;
  products: SellerStockReportItem[];
}): Promise<Uint8Array> {
  const { storeName, products } = options;

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
  };

  page.drawText("Warungpedia Seller Platform", {
    x: MARGIN_X,
    y: cursorY,
    size: 12,
    font: headerFont,
    color: rgb(0.07, 0.48, 0.95),
  });
  cursorY -= 18;

  page.drawText(`Laporan Stok Produk – ${storeName}`, {
    x: MARGIN_X,
    y: cursorY,
    size: 16,
    font: headerFont,
    color: rgb(0.15, 0.15, 0.15),
  });
  cursorY -= 30;

  const createdAt = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const summaryLines = [
    `Tanggal dibuat : ${createdAt}`,
    `Total produk   : ${products.length}`,
    products.length > 0
      ? `Rating tertinggi : ${products[0].rating.toFixed(2)} | Rating terendah : ${products[products.length - 1].rating.toFixed(2)}`
      : "Belum ada data rating untuk produk",
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

  if (products.length === 0) {
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

    products.forEach((record, index) => {
      ensureSpace(30);
      drawRow({ page, font: bodyFont, record, index, startY: cursorY });
      cursorY -= 24;
    });
  }

  drawFooter({ page, font: bodyFont, width, pageNumber });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
