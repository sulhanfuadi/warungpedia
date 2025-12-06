"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import Logo from "@/components/ui/Logo";
import { supabase } from "@/lib/supabaseClient";

interface ProductReport {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  created_at: string;
}

export default function ProductsReportPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  const adminEmails = [
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@warungpedia.id",
  ];

  const inferRole = (session: unknown): string | undefined => {
    if (!session || typeof session !== "object") return undefined;
    const s = session as {
      user?: {
        user_metadata?: Record<string, unknown>;
        app_metadata?: Record<string, unknown>;
        email?: string;
      };
    };
    const metaRole =
      (s.user?.user_metadata?.role as string | undefined) ||
      (s.user?.app_metadata?.role as string | undefined);
    if (metaRole) return metaRole;
    const email = s.user?.email;
    if (email && adminEmails.includes(email)) return "admin";
    return undefined;
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const role = inferRole(data.session);
      if (!data.session || role !== "admin") {
        router.replace("/admin/login");
        return;
      }
      if (active) {
        setAuthChecking(false);
        fetchProducts();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string | null, session: Session | null) => {
      const role =
        (session?.user?.user_metadata as Record<string, unknown> | undefined)?.role ||
        (session?.user?.app_metadata as Record<string, unknown> | undefined)?.role;
      if (_event === "SIGNED_OUT" || !session || role !== "admin") {
        router.replace("/admin/login");
      }
    });

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products/report");
      const data = await response.json();
      setProducts(data.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Gagal mengambil data produk");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      console.log(`📥 [Step 1] Fetching products report`);

      // Get admin user info
      const { data: sessionData } = await supabase.auth.getSession();
      const adminEmail = sessionData?.session?.user?.email || "Admin";
      const adminName = sessionData?.session?.user?.user_metadata?.name || adminEmail;

      // Fetch data
      const response = await fetch("/api/admin/products/report");

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reportData = await response.json();
      console.log(`✅ [Step 2] Data dari Supabase:`, reportData.data);
      console.log(`   Total products: ${reportData.data.length}`);

      if (!reportData.success || !reportData.data?.length) {
        alert("Tidak ada data produk untuk diunduh");
        return;
      }

      // Check library availability
      if (!((window as any).html2pdf)) {
        throw new Error("html2pdf library tidak tersedia di window object");
      }

      // Build HTML
      const now = new Date();
      const tanggalDibuat = now.toLocaleDateString("id-ID");

      let tableRows = "";
      reportData.data.forEach((product: ProductReport, idx: number) => {
        const formattedPrice = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(product.price);

        tableRows += `<tr><td style="border:1px solid #000;padding:10px;text-align:center;color:#000;font-size:10px;">${idx + 1}</td><td style="border:1px solid #000;padding:10px;color:#000;font-size:10px;">${product.name || "-"}</td><td style="border:1px solid #000;padding:10px;color:#000;font-size:10px;">${product.category || "-"}</td><td style="border:1px solid #000;padding:10px;text-align:right;color:#000;font-size:10px;">${formattedPrice}</td><td style="border:1px solid #000;padding:10px;text-align:center;color:#0779FF;font-weight:bold;font-size:10px;">${product.rating.toFixed(2)}</td><td style="border:1px solid #000;padding:10px;text-align:center;color:#000;font-size:10px;">${product.stock}</td></tr>`;
      });

      const htmlContent = `<html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;padding:15px;margin:0;color:#000;"><h1 style="text-align:center;color:#000;font-size:16px;margin:0 0 5px 0;">LAPORAN DAFTAR PRODUK</h1><p style="text-align:center;color:#000;font-size:11px;margin:0 0 15px 0;">Warungpedia Admin System</p><div style="margin:10px 0;padding:10px;background:#f0f0f0;border:1px solid #000;"><p style="margin:3px 0;color:#000;font-size:11px;"><strong>Tanggal dibuat:</strong> ${tanggalDibuat} oleh ${adminName}</p><p style="margin:3px 0;color:#000;font-size:11px;"><strong>Total Produk:</strong> ${reportData.data.length}</p><p style="margin:3px 0;color:#000;font-size:11px;"><strong>Urutan:</strong> Rating Menurun (Tertinggi ke Terendah)</p></div><table style="width:100%;border-collapse:collapse;border:1px solid #000;margin:15px 0;"><thead><tr style="background:#0779FF;color:white;"><th style="border:1px solid #000;padding:10px;text-align:center;font-weight:bold;font-size:10px;">No.</th><th style="border:1px solid #000;padding:10px;text-align:left;font-weight:bold;font-size:10px;">Nama Produk</th><th style="border:1px solid #000;padding:10px;text-align:left;font-weight:bold;font-size:10px;">Kategori</th><th style="border:1px solid #000;padding:10px;text-align:right;font-weight:bold;font-size:10px;">Harga</th><th style="border:1px solid #000;padding:10px;text-align:center;font-weight:bold;font-size:10px;">Rating</th><th style="border:1px solid #000;padding:10px;text-align:center;font-weight:bold;font-size:10px;">Stok</th></tr></thead><tbody>${tableRows}</tbody></table><div style="margin-top:20px;border-top:1px solid #000;padding-top:10px;text-align:center;color:#000;font-size:9px;"><p style="margin:3px 0;">Dokumen ini dibuat otomatis oleh Warungpedia</p><p style="margin:0;">© 2025 Warungpedia</p></div></body></html>`;

      console.log(`✅ [Step 4] HTML generated: ${htmlContent.length} chars`);

      // Create temporary element
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.width = "1000px";
      tempDiv.style.background = "white";
      tempDiv.style.padding = "0";
      tempDiv.style.margin = "0";

      document.body.appendChild(tempDiv);
      console.log(`✅ [Step 5] Element appended to DOM`);

      // Wait untuk rendering
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate PDF
      const element = tempDiv;
      const opt = {
        margin: 5,
        filename: `Laporan-Produk-${new Date().toISOString().split("T")[0]}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "l", unit: "mm", format: "a4" },
      };

      console.log(`✅ [Step 6] Starting PDF generation with options:`, opt);
      const html2pdf = (window as any).html2pdf;
      html2pdf().set(opt).from(element).save();

      console.log(`✅ [Step 7] PDF download initiated`);

      // Clean up
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert(`Gagal mendownload laporan: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (authChecking || isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#0779FF] mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* HEADER */}
      <header className="bg-[#2a2a2a] text-white p-6 shadow-2xl border-b border-[#3a3a3a]">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <Logo size="lg" variant="white" showText={true} href="/" />
          <div className="hidden h-8 w-px bg-[#3a3a3a] md:block"></div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Admin Platform</h1>
            <p className="text-sm text-gray-400">Laporan Daftar Produk</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <a
              href="/admin/dashboard"
              className="rounded-lg border border-[#3a3a3a] px-3 py-2 text-gray-200 hover:border-[#0779FF]"
            >
              Dashboard
            </a>
            <a
              href="/admin/sellers/manage"
              className="rounded-lg border border-[#3a3a3a] px-3 py-2 text-gray-200 hover:border-[#0779FF]"
            >
              Kelola Seller
            </a>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/admin/login");
              }}
              className="rounded-lg border border-[#3a3a3a] px-3 py-2 text-gray-200 hover:border-red-500 hover:text-red-300"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-grow container mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Laporan Daftar Produk</h2>
            <p className="text-gray-400">Daftar semua produk diurutkan berdasarkan rating tertinggi</p>
          </div>
          <button
            onClick={handleDownloadReport}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            📥 Download PDF
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-[#2a2a2a] rounded-2xl border border-[#3a3a3a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0779FF] text-white">
                  <th className="px-4 py-3 text-center font-semibold">No.</th>
                  <th className="px-4 py-3 text-left font-semibold">Nama Produk</th>
                  <th className="px-4 py-3 text-left font-semibold">Kategori</th>
                  <th className="px-4 py-3 text-right font-semibold">Harga</th>
                  <th className="px-4 py-3 text-center font-semibold">Rating</th>
                  <th className="px-4 py-3 text-center font-semibold">Stok</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                      Tidak ada data produk
                    </td>
                  </tr>
                ) : (
                  products.map((product, idx) => (
                    <tr
                      key={product.id}
                      className="border-t border-[#3a3a3a] hover:bg-[#3a3a3a] transition-colors"
                    >
                      <td className="px-4 py-3 text-center text-gray-300">{idx + 1}</td>
                      <td className="px-4 py-3 text-gray-300">{product.name}</td>
                      <td className="px-4 py-3 text-gray-300">{product.category}</td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(product.price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[#0779FF] font-bold">{product.rating.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">{product.stock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-[#2a2a2a] rounded-2xl p-6 border border-[#3a3a3a]">
          <p className="text-gray-400 text-sm">
            <span className="font-semibold text-white">Total Produk:</span> {products.length}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            <span className="font-semibold text-white">Rating Tertinggi:</span>{" "}
            {products.length > 0 ? products[0].rating.toFixed(2) : "-"}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            <span className="font-semibold text-white">Rating Terendah:</span>{" "}
            {products.length > 0 ? products[products.length - 1].rating.toFixed(2) : "-"}
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] border-t border-[#3a3a3a] py-6 px-4 mt-auto">
        <div className="container mx-auto text-center text-gray-400 text-sm">
          © 2025 Warungpedia. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
