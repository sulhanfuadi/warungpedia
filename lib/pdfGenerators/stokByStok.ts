import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface ProductStokData {
  id: string;
  name: string;
  stock: number;
  price: number;
  category: string;
}

export async function generateStokByStokPDF(sellerId: string): Promise<Buffer> {
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
      color: rgb(0.1, 0.3, 0.7),
    });

    page.drawText("Laporan Stok Produk", {
      x: 50,
      y: yPosition - 25,
      size: 14,
      font: fontBold,
    });

    yPosition -= 50;

    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0.3, 0.3, 0.3),
    });

    yPosition -= 25;

    // ==================== INFO SECTION ====================
    // Left Column - Seller Info
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

    // Right Column - Report Info
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

    page.drawText(`Total Produk: ${products?.length || 0} item`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: font,
    });

    yPosition -= 30;

    // ==================== TABLE ====================
    // Table Header
    const tableTop = yPosition;
    const rowHeight = 18;

    // Header background
    page.drawRectangle({
      x: 40,
      y: tableTop - rowHeight,
      width: width - 80,
      height: rowHeight,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Column definitions
    const colX = {
      no: 45,
      name: 75,
      stock: 320,
      price: 380,
      category: 470,
    };

    // Headers
    page.drawText("No", {
      x: colX.no,
      y: tableTop - 13,
      size: 9,
      font: fontBold,
    });

    page.drawText("Nama Produk", {
      x: colX.name,
      y: tableTop - 13,
      size: 9,
      font: fontBold,
    });

    page.drawText("Stok", {
      x: colX.stock,
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

    page.drawText("Kategori", {
      x: colX.category,
      y: tableTop - 13,
      size: 9,
      font: fontBold,
    });

    yPosition = tableTop - rowHeight - 5;

    // Table Body
    let pageNumber = 1;
    (products as ProductStokData[]).forEach((product, index) => {
      // Check if need new page
      if (yPosition < 100) {
        // Footer for current page
        page.drawText(`Halaman ${pageNumber}`, {
          x: width / 2 - 30,
          y: 50,
          size: 8,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });

        // Create new page
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
        pageNumber++;

        // Repeat header on new page
        page.drawText("WARUNGPEDIA - Laporan Stok Produk (lanjutan)", {
          x: 50,
          y: yPosition,
          size: 12,
          font: fontBold,
        });
        yPosition -= 30;

        // Repeat table header
        page.drawRectangle({
          x: 40,
          y: yPosition - rowHeight,
          width: width - 80,
          height: rowHeight,
          color: rgb(0.85, 0.85, 0.85),
        });

        page.drawText("No", {
          x: colX.no,
          y: yPosition - 13,
          size: 9,
          font: fontBold,
        });
        page.drawText("Nama Produk", {
          x: colX.name,
          y: yPosition - 13,
          size: 9,
          font: fontBold,
        });
        page.drawText("Stok", {
          x: colX.stock,
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
        page.drawText("Kategori", {
          x: colX.category,
          y: yPosition - 13,
          size: 9,
          font: fontBold,
        });

        yPosition -= rowHeight + 5;
      }

      // Row background (alternating)
      if (index % 2 === 0) {
        page.drawRectangle({
          x: 40,
          y: yPosition - rowHeight,
          width: width - 80,
          height: rowHeight,
          color: rgb(0.97, 0.97, 0.97),
        });
      }

      // Row data
      page.drawText((index + 1).toString(), {
        x: colX.no,
        y: yPosition - 13,
        size: 8,
        font: font,
      });

      const productName =
        product.name.length > 35
          ? product.name.substring(0, 32) + "..."
          : product.name;
      page.drawText(productName, {
        x: colX.name,
        y: yPosition - 13,
        size: 8,
        font: font,
      });

      page.drawText((product.stock || 0).toString(), {
        x: colX.stock,
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

      const category =
        product.category.length > 15
          ? product.category.substring(0, 12) + "..."
          : product.category;
      page.drawText(category, {
        x: colX.category,
        y: yPosition - 13,
        size: 8,
        font: font,
      });

      yPosition -= rowHeight;
    });

    // Final page footer
    page.drawLine({
      start: { x: 50, y: 80 },
      end: { x: width - 50, y: 80 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    page.drawText("* Laporan diurutkan berdasarkan jumlah stok (terbanyak)", {
      x: 50,
      y: 65,
      size: 7,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText(`Halaman ${pageNumber}`, {
      x: width / 2 - 30,
      y: 50,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    console.log("📄 [PDF-GEN] Saving PDF...");
    const pdfBytes = await pdfDoc.save();
    console.log("✅ [PDF-GEN] PDF saved successfully, size:", pdfBytes.length);

    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("❌ [PDF-GEN] Error in generateStokByStokPDF:");
    console.error("Error:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack");
    throw error;
  }
}
