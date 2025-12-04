import PDFDocument from "pdfkit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface ProductLowStockData {
  id: string;
  name: string;
  stock: number;
  price: number;
  category: string;
  average_rating: number | null;
}

export async function generateStokMenipisPDF(
  sellerId: string
): Promise<Buffer> {
  // Query data produk dengan stok < 2 (urut stok menurun)
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, name, stock, price, category, average_rating")
    .eq("seller_id", sellerId)
    .lt("stock", 2) // ✅ FILTER: stok < 2
    .order("stock", { ascending: false });

  if (error) {
    console.error("Error fetching low stock products:", error);
    throw new Error("Gagal mengambil data produk stok menipis");
  }

  // Create PDF document
  const doc = new PDFDocument({ margin: 50 });
  const buffers: Buffer[] = [];

  doc.on("data", buffers.push.bind(buffers));

  // Header
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("⚠️ LAPORAN STOK PRODUK MENIPIS", { align: "center" })
    .fontSize(12)
    .font("Helvetica")
    .text("(Produk dengan Stok < 2 - Harus Segera Dipesan)", {
      align: "center",
    })
    .moveDown();

  doc
    .fontSize(10)
    .text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`)
    .text(`Seller ID: ${sellerId}`)
    .text(`Total Produk Menipis: ${products?.length || 0}`)
    .moveDown();

  // ✅ HANDLE: Jika tidak ada produk stok menipis
  if (!products || products.length === 0) {
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#00AA00")
      .text("✅ Tidak ada produk dengan stok menipis!", { align: "center" })
      .moveDown()
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#000000")
      .text("Semua produk Anda memiliki stok yang cukup (≥ 2).", {
        align: "center",
      });

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);
    });
  }

  // Table Header
  const startY = doc.y;
  const colWidths = [40, 180, 60, 80, 80, 60];
  const headers = [
    "No",
    "Nama Produk",
    "Stok",
    "Harga (Rp)",
    "Kategori",
    "Rating",
  ];

  let currentX = 50;
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#000000");

  headers.forEach((header, i) => {
    doc.text(header, currentX, startY, {
      width: colWidths[i],
      align: i === 0 ? "center" : "left",
    });
    currentX += colWidths[i];
  });

  doc
    .moveTo(50, startY + 15)
    .lineTo(550, startY + 15)
    .stroke();

  // Table Body
  doc.font("Helvetica").fontSize(9);
  let yPosition = startY + 20;

  (products as ProductLowStockData[]).forEach((product, index) => {
    // Check for page break
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }

    currentX = 50;

    // ✅ HIGHLIGHT: Baris dengan background merah muda untuk stok 0 atau 1
    if (product.stock < 1) {
      doc.rect(50, yPosition - 2, 500, 18).fill("#FFE5E5");
    } else if (product.stock === 1) {
      doc.rect(50, yPosition - 2, 500, 18).fill("#FFF5E5");
    }

    doc.fillColor("#000000"); // Reset text color

    // No
    doc.text((index + 1).toString(), currentX, yPosition, {
      width: colWidths[0],
      align: "center",
    });
    currentX += colWidths[0];

    // Nama Produk
    doc.text(product.name || "-", currentX, yPosition, {
      width: colWidths[1],
      align: "left",
    });
    currentX += colWidths[1];

    // Stok (dengan warna merah jika 0)
    if (product.stock === 0) {
      doc.fillColor("#FF0000").font("Helvetica-Bold");
    } else if (product.stock === 1) {
      doc.fillColor("#FF6600").font("Helvetica-Bold");
    }

    doc.text(product.stock?.toString() || "0", currentX, yPosition, {
      width: colWidths[2],
      align: "right",
    });

    doc.fillColor("#000000").font("Helvetica"); // Reset
    currentX += colWidths[2];

    // Harga
    doc.text(
      product.price ? product.price.toLocaleString("id-ID") : "0",
      currentX,
      yPosition,
      {
        width: colWidths[3],
        align: "right",
      }
    );
    currentX += colWidths[3];

    // Kategori
    doc.text(product.category || "-", currentX, yPosition, {
      width: colWidths[4],
      align: "left",
    });
    currentX += colWidths[4];

    // Rating
    doc.text(
      product.average_rating ? product.average_rating.toFixed(1) : "0.0",
      currentX,
      yPosition,
      {
        width: colWidths[5],
        align: "center",
      }
    );

    yPosition += 20;
  });

  // Legend
  doc
    .moveDown(2)
    .fontSize(8)
    .fillColor("#000000")
    .text("Keterangan:", 50, yPosition + 10)
    .rect(50, yPosition + 22, 15, 10)
    .fill("#FFE5E5")
    .fillColor("#000000")
    .text("= Stok Habis (0)", 70, yPosition + 23)
    .rect(50, yPosition + 37, 15, 10)
    .fill("#FFF5E5")
    .fillColor("#000000")
    .text("= Stok Kritis (1)", 70, yPosition + 38);

  // Footer
  doc
    .moveDown(2)
    .fontSize(8)
    .text("⚠️ Laporan ini menampilkan produk yang perlu segera dipesan", {
      align: "center",
    })
    .text("Laporan digenerate otomatis oleh sistem Warungpedia", {
      align: "center",
    });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on("error", reject);
  });
}
