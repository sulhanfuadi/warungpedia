import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface ProductLowStockData {
  id: string;
  name: string;
  stock: number;
  price: number;
  category: string;
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

    // Query data produk dengan stok < 2
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

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    let yPosition = height - 50;

    // ==================== HEADER ====================
    page.drawText("WARUNGPEDIA", {
      x: 50,
      y: yPosition,
      size: 20,
      font: fontBold,
      color: rgb(0.8, 0.2, 0),
    });

    page.drawText("Laporan Stok Produk Menipis", {
      x: 50,
      y: yPosition - 25,
      size: 14,
      font: fontBold,
      color: rgb(0.8, 0.2, 0),
    });

    yPosition -= 50;

    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0.8, 0.2, 0),
    });

    yPosition -= 25;

    // ==================== INFO SECTION ====================
    page.drawText("Informasi Penjual", {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontBold,
    });
    yPosition -= 15;

    page.drawText(`Nama Toko: ${seller?.store_name || "-"}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: font,
    });
    yPosition -= 12;

    page.drawText(`Pemilik: ${seller?.pic_name || "-"}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: font,
    });
    yPosition -= 12;

    page.drawText(`Kontak: ${seller?.pic_phone || "-"}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: font,
    });
    yPosition -= 12;

    page.drawText(`Email: ${seller?.pic_email || "-"}`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: font,
    });

    yPosition -= 20;

    // Report Info
    const currentDate = new Date();
    page.drawText("Informasi Laporan", {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontBold,
    });
    yPosition -= 15;

    page.drawText(
      `Tanggal: ${currentDate.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`,
      {
        x: 50,
        y: yPosition,
        size: 9,
        font: font,
      }
    );
    yPosition -= 12;

    page.drawText(
      `Waktu: ${currentDate.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })} WIB`,
      {
        x: 50,
        y: yPosition,
        size: 9,
        font: font,
      }
    );
    yPosition -= 12;

    page.drawText(`Produk Menipis: ${products?.length || 0} item`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: fontBold,
      color: rgb(0.8, 0, 0),
    });

    yPosition -= 30;

    // ==================== EMPTY STATE ====================
    if (!products || products.length === 0) {
      page.drawRectangle({
        x: 100,
        y: yPosition - 60,
        width: width - 200,
        height: 60,
        color: rgb(0.9, 1, 0.9),
      });

      page.drawText("Tidak ada produk dengan stok menipis (< 2)", {
        x: 150,
        y: yPosition - 30,
        size: 11,
        font: fontBold,
        color: rgb(0, 0.6, 0),
      });

      page.drawText("Semua produk memiliki stok yang cukup", {
        x: 170,
        y: yPosition - 45,
        size: 9,
        font: font,
        color: rgb(0, 0.5, 0),
      });

      page.drawText(`Halaman 1`, {
        x: width / 2 - 30,
        y: 50,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });

      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    }

    // ==================== WARNING BOX ====================
    page.drawRectangle({
      x: 40,
      y: yPosition - 25,
      width: width - 80,
      height: 25,
      color: rgb(1, 0.95, 0.9),
    });

    page.drawText("PERHATIAN: Produk berikut memerlukan restok segera!", {
      x: 50,
      y: yPosition - 15,
      size: 9,
      font: fontBold,
      color: rgb(0.8, 0.2, 0),
    });

    yPosition -= 35;

    // ==================== TABLE ====================
    const tableTop = yPosition;
    const rowHeight = 18;

    // Header background
    page.drawRectangle({
      x: 40,
      y: tableTop - rowHeight,
      width: width - 80,
      height: rowHeight,
      color: rgb(0.9, 0.7, 0.7),
    });

    // SRS-MartPlace-14: Kolom No | Produk | Kategori | Harga | Stock (angka)
    const colX = {
      no: 45,
      name: 75,
      category: 300,
      price: 420,
      stock: 525,
    };

    // Headers
    page.drawText("No", {
      x: colX.no,
      y: tableTop - 13,
      size: 9,
      font: fontBold,
    });

    page.drawText("Produk", {
      x: colX.name,
      y: tableTop - 13,
      size: 9,
      font: fontBold,
    });

    page.drawText("Kategori", {
      x: colX.category,
      y: tableTop - 13,
      size: 9,
      font: fontBold,
    });

    page.drawText("Harga (Rp)", {
      x: colX.price,
      y: tableTop - 13,
      size: 9,
      font: fontBold,
    });

    page.drawText("Stock", {
      x: colX.stock,
      y: tableTop - 13,
      size: 9,
      font: fontBold,
    });

    yPosition = tableTop - rowHeight - 5;

    // Table Body
    let pageNumber = 1;
    (products as ProductLowStockData[]).forEach((product, index) => {
      // Check if need new page
      if (yPosition < 100) {
        // Footer
        page.drawText(`Halaman ${pageNumber}`, {
          x: width / 2 - 30,
          y: 50,
          size: 8,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });

        // New page
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
        pageNumber++;

        // Repeat header
        page.drawText("WARUNGPEDIA - Laporan Stok Menipis (lanjutan)", {
          x: 50,
          y: yPosition,
          size: 12,
          font: fontBold,
          color: rgb(0.8, 0.2, 0),
        });
        yPosition -= 30;

        // Repeat table header
        page.drawRectangle({
          x: 40,
          y: yPosition - rowHeight,
          width: width - 80,
          height: rowHeight,
          color: rgb(0.9, 0.7, 0.7),
        });

        page.drawText("No", {
          x: colX.no,
          y: yPosition - 13,
          size: 9,
          font: fontBold,
        });
        page.drawText("Produk", {
          x: colX.name,
          y: yPosition - 13,
          size: 9,
          font: fontBold,
        });
        page.drawText("Kategori", {
          x: colX.category,
          y: yPosition - 13,
          size: 9,
          font: fontBold,
        });
        page.drawText("Harga (Rp)", {
          x: colX.price,
          y: yPosition - 13,
          size: 9,
          font: fontBold,
        });
        page.drawText("Stock", {
          x: colX.stock,
          y: yPosition - 13,
          size: 9,
          font: fontBold,
        });

        yPosition -= rowHeight + 5;
      }

      // Row background dengan warna berdasarkan stok
      const bgColor =
        product.stock === 0
          ? rgb(1, 0.85, 0.85) // Merah muda untuk habis
          : product.stock === 1
          ? rgb(1, 0.95, 0.85) // Orange muda untuk kritis
          : rgb(0.97, 0.97, 0.97); // Abu-abu terang

      page.drawRectangle({
        x: 40,
        y: yPosition - rowHeight,
        width: width - 80,
        height: rowHeight,
        color: bgColor,
      });

      // Row data
      page.drawText((index + 1).toString(), {
        x: colX.no,
        y: yPosition - 13,
        size: 8,
        font: font,
      });

      const productName =
        product.name.length > 30
          ? product.name.substring(0, 27) + "..."
          : product.name;
      page.drawText(productName, {
        x: colX.name,
        y: yPosition - 13,
        size: 8,
        font: font,
      });

      const category =
        product.category.length > 18
          ? product.category.substring(0, 15) + "..."
          : product.category;
      page.drawText(category, {
        x: colX.category,
        y: yPosition - 13,
        size: 8,
        font: font,
      });

      page.drawText((product.price || 0).toLocaleString("id-ID"), {
        x: colX.price,
        y: yPosition - 13,
        size: 8,
        font: font,
      });

      // SRS-MartPlace-14: kolom Stock wajib angka, pakai warna untuk menandai kritis/habis
      const stockColor =
        product.stock === 0
          ? rgb(0.8, 0, 0)
          : product.stock === 1
          ? rgb(0.8, 0.4, 0)
          : rgb(0, 0, 0);

      page.drawText(product.stock.toString(), {
        x: colX.stock,
        y: yPosition - 13,
        size: 8,
        font: fontBold,
        color: stockColor,
      });

      yPosition -= rowHeight;
    });

    // Footer - Legend
    yPosition -= 10;
    page.drawText("Keterangan:", {
      x: 50,
      y: yPosition,
      size: 8,
      font: fontBold,
    });
    yPosition -= 12;

    page.drawRectangle({
      x: 50,
      y: yPosition - 2,
      width: 10,
      height: 10,
      color: rgb(1, 0.85, 0.85),
    });
    page.drawText("HABIS = Stok 0 (Prioritas Tinggi)", {
      x: 65,
      y: yPosition,
      size: 7,
      font: font,
    });
    yPosition -= 12;

    page.drawRectangle({
      x: 50,
      y: yPosition - 2,
      width: 10,
      height: 10,
      color: rgb(1, 0.95, 0.85),
    });
    page.drawText("KRITIS = Stok 1 (Segera Restok)", {
      x: 65,
      y: yPosition,
      size: 7,
      font: font,
    });

    // Final page footer
    page.drawLine({
      start: { x: 50, y: 80 },
      end: { x: width - 50, y: 80 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    page.drawText(
      "* Segera lakukan restok untuk produk dengan status HABIS dan KRITIS",
      {
        x: 50,
        y: 65,
        size: 7,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      }
    );

    page.drawText(`Halaman ${pageNumber}`, {
      x: width / 2 - 30,
      y: 50,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

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
