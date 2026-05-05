import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface SellerStatusRecord {
  namaUser: string; // Email PIC sebagai Nama User
  picName: string;
  storeName: string;
  statusLabel: "Aktif" | "Tidak Aktif";
}

const PAGE_SIZE: [number, number] = [842, 595]; // Landscape A4
const MARGIN_X = 40;
const HEADER_BG = rgb(7 / 255, 121 / 255, 255 / 255);
const HEADER_TEXT = rgb(1, 1, 1);
const ROW_ALT_BG = rgb(0.95, 0.95, 0.95);

// Kolom sesuai format: No | Nama User (Email PIC) | Nama PIC | Nama Toko | Status
const columns = [
  { key: "no", title: "No", width: 40 },
  { key: "namaUser", title: "Nama User (Email PIC)", width: 220 },
  { key: "picName", title: "Nama PIC", width: 180 },
  { key: "store", title: "Nama Toko", width: 220 },
  { key: "status", title: "Status", width: 100 },
] as const;

type ColumnKey = (typeof columns)[number]["key"];

const columnGetter: Record<
  ColumnKey,
  (record: SellerStatusRecord, index: number) => string
> = {
  no: (_record, index) => (index + 1).toString(),
  namaUser: (record) => record.namaUser,
  picName: (record) => record.picName,
  store: (record) => record.storeName,
  status: (record) => record.statusLabel,
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function formatDate(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return dateFormatter.format(date);
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
  record: SellerStatusRecord;
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
      rawText.length > 45 ? `${rawText.slice(0, 42)}...` : rawText;

    // Status column gets colored text
    const textColor =
      column.key === "status"
        ? record.statusLabel === "Aktif"
          ? rgb(0.05, 0.45, 0.2) // Green for active
          : rgb(0.7, 0.2, 0.2) // Red for inactive
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

export async function generateSellerStatusReport(): Promise<Uint8Array> {
  const { data, error } = await supabaseAdmin
    .from("sellers")
    .select(
      "id, store_name, pic_email, pic_name, pic_phone, pic_province, status, created_at, role"
    )
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Gagal mengambil data penjual: ${error.message}`);
  }

  const sellers = data ?? [];
  const enriched: SellerStatusRecord[] = [];

  for (const seller of sellers) {
    enriched.push({
      namaUser: seller.pic_email ?? "-", // Email PIC sebagai Nama User
      picName: seller.pic_name ?? "-",
      storeName: seller.store_name ?? "-",
      statusLabel: seller.status === "ACTIVE" ? "Aktif" : "Tidak Aktif",
    });
  }

  // Sort: Aktif dulu, lalu Tidak Aktif, kemudian by store name
  enriched.sort((a, b) => {
    if (a.statusLabel === b.statusLabel) {
      return a.storeName.localeCompare(b.storeName);
    }
    return a.statusLabel === "Aktif" ? -1 : 1;
  });

  const activeCount = enriched.filter(
    (record) => record.statusLabel === "Aktif"
  ).length;
  const inactiveCount = enriched.length - activeCount;

  const pdfDoc = await PDFDocument.create();
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const headerFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage(PAGE_SIZE);
  let { width, height } = page.getSize();
  let cursorY = height - 50;
  let pageNumber = 1;

  const ensureSpace = (required: number, isContinuationHeader = false) => {
    if (cursorY - required > 70) {
      return;
    }

    drawFooter({ page, font: bodyFont, width, pageNumber });
    pageNumber += 1;
    page = pdfDoc.addPage(PAGE_SIZE);
    ({ width, height } = page.getSize());
    cursorY = height - 50;

    if (isContinuationHeader) {
      page.drawText("Warungpedia Admin Platform", {
        x: MARGIN_X,
        y: cursorY,
        size: 12,
        font: headerFont,
        color: rgb(0.07, 0.48, 0.95),
      });
      cursorY -= 18;

      page.drawText("Laporan Akun Penjual (lanjutan)", {
        x: MARGIN_X,
        y: cursorY,
        size: 14,
        font: headerFont,
        color: rgb(0.15, 0.15, 0.15),
      });
      cursorY -= 25;

      drawTableHeader({ page, headerFont, startY: cursorY });
      cursorY -= 28;
    }
  };

  // ==================== HEADER ====================
  page.drawText("Warungpedia Admin Platform", {
    x: MARGIN_X,
    y: cursorY,
    size: 12,
    font: headerFont,
    color: rgb(0.07, 0.48, 0.95),
  });
  cursorY -= 18;

  page.drawText("Laporan Akun Penjual (Aktif & Tidak Aktif)", {
    x: MARGIN_X,
    y: cursorY,
    size: 16,
    font: headerFont,
    color: rgb(0.15, 0.15, 0.15),
  });
  cursorY -= 30;

  // ==================== SUMMARY INFO ====================
  const summaryLines = [
    `Tanggal dibuat : ${formatDate(new Date().toISOString())}`,
    `Total penjual  : ${enriched.length} | Aktif: ${activeCount} | Tidak Aktif: ${inactiveCount}`,
  ];

  summaryLines.forEach((line) => {
    page.drawText(line, {
      x: MARGIN_X,
      y: cursorY,
      size: 10,
      font: bodyFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    cursorY -= 14;
  });

  cursorY -= 10;

  // ==================== TABLE ====================
  drawTableHeader({ page, headerFont, startY: cursorY });
  cursorY -= 28;

  enriched.forEach((record, index) => {
    ensureSpace(26, true);
    drawRow({ page, font: bodyFont, record, index, startY: cursorY });
    cursorY -= 22;
  });

  drawFooter({ page, font: bodyFont, width, pageNumber });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
