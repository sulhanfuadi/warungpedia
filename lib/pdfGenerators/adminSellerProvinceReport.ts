import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface SellerRow {
  id: string;
  store_name: string | null;
  pic_name: string | null;
  pic_province: string | null;
  status: string | null;
}

const PAGE_SIZE: [number, number] = [842, 595];
const MARGIN_X = 40;
const HEADER_BG = rgb(7 / 255, 121 / 255, 255 / 255);
const HEADER_TEXT = rgb(1, 1, 1);
const ROW_ALT_BG = rgb(0.95, 0.95, 0.95);

const columns = [
  { key: "no", title: "No.", width: 40 },
  { key: "store", title: "Nama Toko", width: 230 },
  { key: "pic_name", title: "Nama PIC", width: 180 },
  { key: "province", title: "Provinsi", width: 260 },
] as const;

type ColumnKey = (typeof columns)[number]["key"];

const columnGetter: Record<ColumnKey, (seller: SellerRow, index: number) => string> = {
  no: (_seller, index) => (index + 1).toString(),
  store: (seller) => seller.store_name ?? "-",
  pic_name: (seller) => seller.pic_name ?? "-",
  province: (seller) => seller.pic_province ?? "-",
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
  seller: SellerRow;
  index: number;
  startY: number;
}) {
  const { page, font, seller, index, startY } = options;
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

    const rawText = columnGetter[column.key](seller, index);
    const truncated = rawText.length > 38 ? `${rawText.slice(0, 35)}...` : rawText;
    const textColor = rgb(0.15, 0.15, 0.15);

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

export async function generateSellerProvinceReport(): Promise<Uint8Array> {
  const { data, error } = await supabaseAdmin
    .from("sellers")
    .select("id, store_name, pic_name, pic_province, status");

  if (error) {
    throw new Error(`Gagal mengambil data penjual: ${error.message}`);
  }

  let sellers = data ?? [];
  
  // Sort by province (A-Z), then by store name within each province
  sellers.sort((a, b) => {
    const provinceA = (a.pic_province || "Tidak diketahui").trim();
    const provinceB = (b.pic_province || "Tidak diketahui").trim();
    const provinceCompare = provinceA.localeCompare(provinceB, "id", { sensitivity: "base" });
    
    if (provinceCompare !== 0) return provinceCompare;
    
    // If same province, sort by store name
    const storeA = (a.store_name || "").toLowerCase();
    const storeB = (b.store_name || "").toLowerCase();
    return storeA.localeCompare(storeB, "id", { sensitivity: "base" });
  });

  // Get current user info for "Diproses oleh"
  const processedDate = new Date().toLocaleDateString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const processedByName = "Admin System"; // Will be replaced with actual user if available

  const pdfDoc = await PDFDocument.create();
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const headerFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage(PAGE_SIZE);
  let { width, height } = page.getSize();
  let cursorY = height - 50;
  let pageNumber = 1;

  const ensureSpace = (required: number, withContinuationHeader = false) => {
    if (cursorY - required > 80) {
      return;
    }

    drawFooter({ page, font: bodyFont, width, pageNumber });
    pageNumber += 1;
    page = pdfDoc.addPage(PAGE_SIZE);
    ({ width, height } = page.getSize());
    cursorY = height - 50;

    if (withContinuationHeader) {
      page.drawText("Laporan Daftar Toko Berdasarkan Lokasi Provinsi (lanjutan)", {
        x: MARGIN_X,
        y: cursorY,
        size: 14,
        font: headerFont,
        color: rgb(0.15, 0.15, 0.15),
      });
      cursorY -= 30;
      
      drawTableHeader({ page, headerFont, startY: cursorY });
      cursorY -= 24;
    }
  };

  page.drawText("Warungpedia Admin Platform", {
    x: MARGIN_X,
    y: cursorY,
    size: 12,
    font: headerFont,
    color: rgb(0.07, 0.48, 0.95),
  });
  cursorY -= 18;

  page.drawText("Laporan Daftar Toko Berdasarkan Lokasi Provinsi", {
    x: MARGIN_X,
    y: cursorY,
    size: 16,
    font: headerFont,
    color: rgb(0.15, 0.15, 0.15),
  });
  cursorY -= 28;

  // Header info: Tanggal dibuat and processed by
  page.drawText(`Tanggal dibuat: ${processedDate}`, {
    x: MARGIN_X,
    y: cursorY,
    size: 10,
    font: bodyFont,
    color: rgb(0.25, 0.25, 0.25),
  });
  cursorY -= 18;

  page.drawText(`oleh ${processedByName}`, {
    x: MARGIN_X,
    y: cursorY,
    size: 10,
    font: bodyFont,
    color: rgb(0.25, 0.25, 0.25),
  });
  cursorY -= 24;

  // Draw single table header
  drawTableHeader({ page, headerFont, startY: cursorY });
  cursorY -= 24;

  // Draw all rows in single table, sorted by province
  sellers.forEach((seller, index) => {
    ensureSpace(30, true);
    drawRow({ page, font: bodyFont, seller, index, startY: cursorY });
    cursorY -= 24;
  });

  drawFooter({ page, font: bodyFont, width, pageNumber });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
