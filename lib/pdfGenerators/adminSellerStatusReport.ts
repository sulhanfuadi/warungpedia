import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface SellerRow {
  id: string;
  store_name: string | null;
  pic_email: string | null;
  pic_name: string | null;
  pic_phone: string | null;
  pic_province: string | null;
  status: string | null;
  created_at: string;
  role: string | null;
}

interface SellerStatusRecord {
  accountEmail: string;
  picEmail: string;
  storeName: string;
  createdAt: string;
  statusLabel: "Aktif" | "Tidak Aktif";
}

const PAGE_SIZE: [number, number] = [842, 595];
const MARGIN_X = 40;
const HEADER_BG = rgb(7 / 255, 121 / 255, 255 / 255);
const HEADER_TEXT = rgb(1, 1, 1);
const ROW_ALT_BG = rgb(0.95, 0.95, 0.95);

const columns = [
  { key: "no", title: "No.", width: 36 },
  { key: "email", title: "Email", width: 170 },
  { key: "picEmail", title: "Email PIC", width: 170 },
  { key: "status", title: "Status", width: 90 },
  { key: "created", title: "Tanggal Dibuat", width: 130 },
  { key: "store", title: "Nama Toko", width: 180 },
] as const;

type ColumnKey = (typeof columns)[number]["key"];

const columnGetter: Record<ColumnKey, (record: SellerStatusRecord, index: number) => string> = {
  no: (_record, index) => (index + 1).toString(),
  email: (record) => record.accountEmail,
  picEmail: (record) => record.picEmail,
  status: (record) => record.statusLabel,
  created: (record) => record.createdAt,
  store: (record) => record.storeName,
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

async function resolveAccountEmail(userId: string, fallback: string): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error) {
      console.warn("[SellerStatusPDF] Failed to fetch auth user", error.message);
      return fallback;
    }
    return data?.user?.email || fallback;
  } catch (error) {
    console.warn("[SellerStatusPDF] Unexpected auth lookup error", error);
    return fallback;
  }
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
    const truncated = rawText.length > 40 ? `${rawText.slice(0, 37)}...` : rawText;
    const textColor =
      column.key === "status"
        ? record.statusLabel === "Aktif"
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

export async function generateSellerStatusReport(): Promise<Uint8Array> {
  const { data, error } = await supabaseAdmin
    .from("sellers")
    .select(
      "id, store_name, pic_email, pic_name, pic_phone, pic_province, status, created_at, role",
    )
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Gagal mengambil data penjual: ${error.message}`);
  }

  const sellers = data ?? [];
  const emailCache = new Map<string, string>();
  const enriched: SellerStatusRecord[] = [];

  for (const seller of sellers) {
    const fallbackEmail = seller.pic_email ?? "-";
    let accountEmail = fallbackEmail;

    if (seller.id) {
      if (emailCache.has(seller.id)) {
        accountEmail = emailCache.get(seller.id)!;
      } else {
        accountEmail = await resolveAccountEmail(seller.id, fallbackEmail);
        emailCache.set(seller.id, accountEmail);
      }
    }

    enriched.push({
      accountEmail,
      picEmail: fallbackEmail,
      storeName: seller.store_name ?? "-",
      createdAt: formatDate(seller.created_at),
      statusLabel: seller.status === "ACTIVE" ? "Aktif" : "Tidak Aktif",
    });
  }

  enriched.sort((a, b) => {
    if (a.statusLabel === b.statusLabel) {
      return a.accountEmail.localeCompare(b.accountEmail, "id", { sensitivity: "base" });
    }
    return a.statusLabel === "Aktif" ? -1 : 1;
  });

  const activeCount = enriched.filter((record) => record.statusLabel === "Aktif").length;
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

    page.drawText(
      isContinuationHeader
        ? "Laporan Akun Penjual (lanjutan)"
        : "Laporan Akun Penjual (Aktif & Tidak Aktif)",
      {
        x: MARGIN_X,
        y: cursorY,
        size: 14,
        font: headerFont,
        color: rgb(0.15, 0.15, 0.15),
      },
    );
    cursorY -= 28;
    drawTableHeader({ page, headerFont, startY: cursorY });
    cursorY -= 28;
  };

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

  const summaryLines = [
    `Tanggal dibuat : ${formatDate(new Date().toISOString())}`,
    `Total penjual : ${enriched.length} | Aktif: ${activeCount} | Tidak Aktif: ${inactiveCount}`,
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
  drawTableHeader({ page, headerFont, startY: cursorY });
  cursorY -= 28;

  enriched.forEach((record, index) => {
    ensureSpace(30, true);
    drawRow({ page, font: bodyFont, record, index, startY: cursorY });
    cursorY -= 24;
  });

  drawFooter({ page, font: bodyFont, width, pageNumber });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
