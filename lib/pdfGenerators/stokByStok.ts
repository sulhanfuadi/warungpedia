import PDFDocument from "pdfkit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface ProductStokData {
  id: string;
  name: string;
  stock: number;
  price: number;
  category: string;
  average_rating: number | null;
}

export async function generateStokByStokPDF(sellerId: string): Promise<Buffer> {
  // Query data produk (urut stok menurun)
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, name, stock, price, category, average_rating")
    .eq("seller_id", sellerId)
    .order("stock", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    throw new Error("Gagal mengambil data produk");
  }

  // Create PDF document
  const doc = new PDFDocument({ margin: 50 });
  const buffers: Buffer[] = [];

  doc.on("data", buffers.push.bind(buffers));

  // Header
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("LAPORAN STOK PRODUK", { align: "center" })
    .fontSize(12)
    .font("Helvetica")
    .text("(Diurutkan Berdasarkan Stok - Menurun)", { align: "center" })
    .moveDown();

  doc
    .fontSize(10)
    .text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`)
    .text(`Seller ID: ${sellerId}`)
    .moveDown();

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
  doc.fontSize(10).font("Helvetica-Bold");

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

  (products as ProductStokData[]).forEach((product, index) => {
    // Check for page break
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }

    currentX = 50;

    // No
    doc.text((index + 1).toString(), currentX, yPosition, {
      width: colWidths[0],
      align: "center",
    });
    currentX += colWidths[0];

    // Nama Produk (wrap text)
    doc.text(product.name || "-", currentX, yPosition, {
      width: colWidths[1],
      align: "left",
    });
    currentX += colWidths[1];

    // Stok
    doc.text(product.stock?.toString() || "0", currentX, yPosition, {
      width: colWidths[2],
      align: "right",
    });
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

  // Footer
  doc
    .moveDown(2)
    .fontSize(8)
    .text("Laporan ini digenerate otomatis oleh sistem Warungpedia", {
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
