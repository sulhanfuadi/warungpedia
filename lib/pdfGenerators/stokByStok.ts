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

    // Query data produk (urut stok menurun) - TANPA average_rating
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

    // Create PDF document
    console.log("📄 [PDF-GEN] Creating PDF document...");
    const pdfDoc = await PDFDocument.create();

    console.log("📄 [PDF-GEN] Embedding fonts...");
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    console.log("📄 [PDF-GEN] Adding page...");
    let page = pdfDoc.addPage([595, 842]); // A4 size
    const { height } = page.getSize();
    let yPosition = height - 50;

    console.log("📄 [PDF-GEN] Drawing content...");

    // Header
    page.drawText("LAPORAN STOK PRODUK", {
      x: 50,
      y: yPosition,
      size: 20,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 25;

    page.drawText("(Diurutkan Berdasarkan Stok - Menurun)", {
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

    page.drawText(`Total Produk: ${products?.length || 0}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
    });
    yPosition -= 30;

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

    // Draw line under header
    page.drawLine({
      start: { x: 50, y: yPosition - 5 },
      end: { x: 530, y: yPosition - 5 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    yPosition -= 20;

    console.log("📄 [PDF-GEN] Drawing products...");

    // Table Body
    (products as ProductStokData[]).forEach((product, index) => {
      // Check for page break
      if (yPosition < 50) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
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

      // Stok
      page.drawText(product.stock?.toString() || "0", {
        x: currentX + 30,
        y: yPosition,
        size: 9,
        font: font,
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

    // Footer
    page.drawText("Laporan ini digenerate otomatis oleh sistem Warungpedia", {
      x: 120,
      y: 30,
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
