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
  storeName: string;
  province: string;
}

const ADMIN_EMAILS = [
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@warungpedia.id",
];

const inferAdminRole = (session: unknown): string | undefined => {
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
  if (email && ADMIN_EMAILS.includes(email)) return "admin";
  return undefined;
};

export default function ProductsReportPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const role = inferAdminRole(data.session);
      if (!data.session || role !== "admin") {
        router.replace("/login");
        return;
      }
      if (active) {
        setAuthChecking(false);
        fetchProducts();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string | null, session: Session | null) => {
      const role = inferAdminRole(session);
      if (_event === "SIGNED_OUT" || !session || role !== "admin") {
        router.replace("/login");
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
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `API error ${response.status}`);
      }
      const data = await response.json();
      setProducts(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Gagal mengambil data produk");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = () => {
    setDownloading(true);
    try {
      const newWindow = window.open(
        "/api/admin/reports/products/rating",
        "_blank",
        "noopener,noreferrer",
      );
      if (!newWindow) {
        throw new Error("Browser memblokir pop-up download. Izinkan pop-up dan coba lagi.");
      }
    } catch (error) {
      console.error("Error opening report:", error);
      alert(`Gagal membuka laporan: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setTimeout(() => setDownloading(false), 300);
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
                router.replace("/login");
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
            disabled={downloading}
            className="bg-purple-600 hover:bg-purple-700 disabled:hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? "Mengunduh laporan..." : "📥 Download PDF"}
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
                  <th className="px-4 py-3 text-left font-semibold">Nama Toko</th>
                  <th className="px-4 py-3 text-left font-semibold">Kategori</th>
                  <th className="px-4 py-3 text-right font-semibold">Harga</th>
                  <th className="px-4 py-3 text-center font-semibold">Provinsi</th>
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
                      <td className="px-4 py-3 text-gray-300">{product.storeName}</td>
                      <td className="px-4 py-3 text-gray-300">{product.category}</td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(product.price)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">{product.province}</td>
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
