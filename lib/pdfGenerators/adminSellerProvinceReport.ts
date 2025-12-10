import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface SellerRow {
  id: string;
  store_name: string | null;
  pic_email: string | null;
  pic_city: string | null;
  pic_province: string | null;
  status: string | null;
}

interface ProvinceGroup {
  province: string;
  sellers: SellerRow[];
}

const PAGE_SIZE: [number, number] = [842, 595];
const MARGIN_X = 40;
const HEADER_BG = rgb(7 / 255, 121 / 255, 255 / 255);
const HEADER_TEXT = rgb(1, 1, 1);
const ROW_ALT_BG = rgb(0.95, 0.95, 0.95);

const columns = [
  { key: "no", title: "No.", width: 40 },
  { key: "store", title: "Nama Toko", width: 200 },
  { key: "email", title: "Email Penjual", width: 190 },
  { key: "city", title: "Kota/Kab", width: 160 },
  { key: "status", title: "Status", width: 120 },
] as const;

type ColumnKey = (typeof columns)[number]["key"];

const columnGetter: Record<ColumnKey, (seller: SellerRow, index: number) => string> = {
  no: (_seller, index) => (index + 1).toString(),
  store: (seller) => seller.store_name ?? "-",
  email: (seller) => seller.pic_email ?? "-",
  city: (seller) => seller.pic_city ?? seller.pic_province ?? "-",
  status: (seller) => (seller.status === "ACTIVE" ? "Aktif" : "Tidak Aktif"),
};

function groupByProvince(rows: SellerRow[]): ProvinceGroup[] {
  const buckets = new Map<string, SellerRow[]>();

  rows.forEach((row) => {
    const province = (row.pic_province || "Tidak diketahui").trim() || "Tidak diketahui";
    const key = province.toUpperCase();
    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key)!.push(row);
  });

  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0], "id", { sensitivity: "base" }))
    .map(([province, sellers]) => {
      sellers.sort((left, right) => {
        const leftName = (left.store_name || "").toLowerCase();
        const rightName = (right.store_name || "").toLowerCase();
        return leftName.localeCompare(rightName, "id", { sensitivity: "base" });
      });
      return { province, sellers };
    });
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
    const textColor =
      column.key === "status"
        ? rawText === "Aktif"
          ? rgb(0.05, 0.45, 0.2)
          : rgb(0.7, 0.2, 0.2)
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

export async function generateSellerProvinceReport(): Promise<Uint8Array> {
  const { data, error } = await supabaseAdmin
    .from<SellerRow>("sellers")
    .select("id, store_name, pic_email, pic_city, pic_province, status")
    .order("pic_province", { ascending: true });

  if (error) {
    throw new Error(`Gagal mengambil data penjual: ${error.message}`);
  }

  const sellers = data ?? [];
  const groups = groupByProvince(sellers);

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

    const title = withContinuationHeader
      ? "Laporan Daftar Toko per Provinsi (lanjutan)"
      : "Laporan Daftar Toko per Provinsi";
    page.drawText(title, {
      x: MARGIN_X,
      y: cursorY,
      size: 14,
      font: headerFont,
      color: rgb(0.15, 0.15, 0.15),
    });
    cursorY -= 30;
  };

  page.drawText("Warungpedia Admin Platform", {
    x: MARGIN_X,
    y: cursorY,
    size: 12,
    font: headerFont,
    color: rgb(0.07, 0.48, 0.95),
  });
  cursorY -= 18;

  page.drawText("Laporan Daftar Toko per Provinsi", {
    x: MARGIN_X,
    y: cursorY,
    size: 16,
    font: headerFont,
    color: rgb(0.15, 0.15, 0.15),
  });
  cursorY -= 30;

  page.drawText(`Total Provinsi: ${groups.length} | Total Toko: ${sellers.length}`, {
    x: MARGIN_X,
    y: cursorY,
    size: 10,
    font: bodyFont,
    color: rgb(0.25, 0.25, 0.25),
  });
  cursorY -= 24;

  groups.forEach((group) => {
    ensureSpace(80, true);

    page.drawText(`${group.province} (${group.sellers.length} Toko)`, {
      x: MARGIN_X,
      y: cursorY,
      size: 13,
      font: headerFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    cursorY -= 20;

    drawTableHeader({ page, headerFont, startY: cursorY });
    cursorY -= 28;

    group.sellers.forEach((seller, sellerIndex) => {
      ensureSpace(30, true);
      drawRow({ page, font: bodyFont, seller, index: sellerIndex, startY: cursorY });
      cursorY -= 24;
    });

    cursorY -= 16;
  });

  drawFooter({ page, font: bodyFont, width, pageNumber });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
