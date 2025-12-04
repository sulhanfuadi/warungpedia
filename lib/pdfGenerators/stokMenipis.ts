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
): Promise<Buffer> {
  try {
    console.log(
      "📄 [PDF-MENIPIS] Starting generateStokMenipisPDF for:",
      sellerId
    );

    // Query data produk dengan stok < 2 - TANPA average_rating
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, name, stock, price, category")
      .eq("seller_id", sellerId)
      .lt("stock", 2)
      .order("stock", { ascending: false });

    if (error) {
      console.error("❌ [PDF-MENIPIS] Database error:", error);
      throw new Error(
        `Gagal mengambil data produk stok menipis: ${error.message}`
      );
    }

    console.log("✅ [PDF-MENIPIS] Products fetched:", products?.length || 0);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595, 842]); // A4 size
    const { height } = page.getSize();
    let yPosition = height - 50;

    // Header
    page.drawText("LAPORAN STOK PRODUK MENIPIS", {
      x: 50,
      y: yPosition,
      size: 20,
      font: fontBold,
      color: rgb(0.8, 0, 0),
    });
    yPosition -= 25;

    page.drawText("(Produk dengan Stok < 2 - Harus Segera Dipesan)", {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    page.drawText(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    });
    yPosition -= 15;

    page.drawText(`Seller ID: ${sellerId}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    });
    yPosition -= 15;

    page.drawText(`Total Produk Menipis: ${products?.length || 0}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    });
    yPosition -= 30;

    // Handle empty products
    if (!products || products.length === 0) {
      page.drawText("Tidak ada produk dengan stok menipis!", {
        x: 150,
        y: yPosition,
        size: 14,
        font: fontBold,
        color: rgb(0, 0.7, 0),
      });
      yPosition -= 25;
      page.drawText("Semua produk Anda memiliki stok yang cukup (>= 2).", {
        x: 120,
        y: yPosition,
        size: 10,
        font: font,
      });

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    }

    // Table Header (TANPA Rating)
    const colWidths = [40, 200, 80, 100, 100];
    const headers = ["No", "Nama Produk", "Stok", "Harga (Rp)", "Kategori"];
    let currentX = 50;

    headers.forEach((header, i) => {
      page.drawText(header, {
        x: currentX,
        y: yPosition,
        size: 10,
        font: fontBold,
      });
      currentX += colWidths[i];
    });

    page.drawLine({
      start: { x: 50, y: yPosition - 5 },
      end: { x: 530, y: yPosition - 5 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    yPosition -= 20;

    // Table Body
    (products as ProductLowStockData[]).forEach((product, index) => {
      if (yPosition < 50) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }

      // Highlight background for low stock
      if (product.stock === 0) {
        page.drawRectangle({
          x: 50,
          y: yPosition - 2,
          width: 480,
          height: 18,
          color: rgb(1, 0.9, 0.9),
        });
      } else if (product.stock === 1) {
        page.drawRectangle({
          x: 50,
          y: yPosition - 2,
          width: 480,
          height: 18,
          color: rgb(1, 0.95, 0.9),
        });
      }

      currentX = 50;

      // No
      page.drawText((index + 1).toString(), {
        x: currentX + 15,
        y: yPosition,
        size: 9,
        font: font,
      });
      currentX += colWidths[0];

      // Nama Produk
      const productName = product.name || "-";
      const truncatedName =
        productName.length > 35
          ? productName.substring(0, 32) + "..."
          : productName;
      page.drawText(truncatedName, {
        x: currentX,
        y: yPosition,
        size: 9,
        font: font,
      });
      currentX += colWidths[1];

      // Stok (with red color if 0)
      const stockColor =
        product.stock === 0
          ? rgb(1, 0, 0)
          : product.stock === 1
          ? rgb(1, 0.4, 0)
          : rgb(0, 0, 0);
      page.drawText(product.stock?.toString() || "0", {
        x: currentX + 30,
        y: yPosition,
        size: 9,
        font: fontBold,
        color: stockColor,
      });
      currentX += colWidths[2];

      // Harga
      page.drawText(
        product.price ? product.price.toLocaleString("id-ID") : "0",
        {
          x: currentX,
          y: yPosition,
          size: 9,
          font: font,
        }
      );
      currentX += colWidths[3];

      // Kategori
      const category = product.category || "-";
      const truncatedCategory =
        category.length > 18 ? category.substring(0, 15) + "..." : category;
      page.drawText(truncatedCategory, {
        x: currentX,
        y: yPosition,
        size: 9,
        font: font,
      });

      yPosition -= 20;
    });

    // Legend
    yPosition -= 10;
    page.drawText("Keterangan:", { x: 50, y: yPosition, size: 8, font: font });
    yPosition -= 12;
    page.drawRectangle({
      x: 50,
      y: yPosition,
      width: 15,
      height: 10,
      color: rgb(1, 0.9, 0.9),
    });
    page.drawText("= Stok Habis (0)", {
      x: 70,
      y: yPosition + 2,
      size: 8,
      font: font,
    });
    yPosition -= 15;
    page.drawRectangle({
      x: 50,
      y: yPosition,
      width: 15,
      height: 10,
      color: rgb(1, 0.95, 0.9),
    });
    page.drawText("= Stok Kritis (1)", {
      x: 70,
      y: yPosition + 2,
      size: 8,
      font: font,
    });

    // Footer
    page.drawText("Laporan ini menampilkan produk yang perlu segera dipesan", {
      x: 120,
      y: 40,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
    page.drawText("Laporan digenerate otomatis oleh sistem Warungpedia", {
      x: 130,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("❌ [PDF-MENIPIS] Error:", error);
    throw error;
  }
}
