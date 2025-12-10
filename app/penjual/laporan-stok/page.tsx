"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import Logo from "@/components/ui/Logo";
import { supabase } from "@/lib/supabaseClient";

interface ProductStock {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  created_at: string;
}

interface SellerProfileRow {
  id: string;
  store_name: string | null;
  user_id?: string | null;
}

export default function SellerStockReportPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [storeName, setStoreName] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [downloading, setDownloading] = useState(false);

  const resolveSellerProfile = useCallback(async (session: Session | null) => {
    if (!session?.user) return null;

    const metadata = (session.user.user_metadata as Record<string, unknown> | undefined) || {};
    const sellerFromMeta = metadata.seller as
      | {
          id?: string;
          store_name?: string;
          storeName?: string;
        }
      | undefined;

    if (sellerFromMeta?.id) {
      return {
        id: sellerFromMeta.id,
        storeName:
          sellerFromMeta.store_name || (sellerFromMeta.storeName as string | undefined) || undefined,
      };
    }

    const fallbackUserId = session.user.id;
    try {
      const { data, error } = await supabase
        .from<SellerProfileRow>("sellers")
        .select("id, store_name, user_id")
        .or(`id.eq.${fallbackUserId},user_id.eq.${fallbackUserId}`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("Fallback seller query failed:", error.message);
        return null;
      }

      if (!data) {
        console.warn("Seller profile not found for user:", fallbackUserId);
        return null;
      }

      return {
        id: data.id,
        storeName: data.store_name || undefined,
      };
    } catch (err) {
      console.error("Error resolving seller profile fallback:", err);
      return null;
    }
  }, []);

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
    return undefined;
  };

  const fetchProducts = useCallback(async (id: string, token: string) => {
    try {
      const response = await fetch(`/api/penjual/laporan/stok-rating?sellerId=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || errorBody?.message || `API error: ${response.status}`;
        console.error("Seller stock report API error", response.status, errorBody);
        throw new Error(message);
      }

      const data = await response.json();
      setProducts(data.data || []);
      setStoreName((prev) => data.storeName || prev || "");
    } catch (error) {
      console.error("Error fetching products:", error);
      alert(
        error instanceof Error
          ? `Gagal mengambil data produk: ${error.message}`
          : "Gagal mengambil data produk"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSellerData = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session ?? null;
      const token = session?.access_token;

      if (!token) {
        alert("Token tidak ditemukan");
        return;
      }

      const sellerProfile = await resolveSellerProfile(session);
      const fallbackId = session?.user?.id;
      const id = sellerProfile?.id || fallbackId;

      if (!id) {
        alert("Data penjual tidak ditemukan");
        return;
      }

      const name =
        sellerProfile?.storeName ||
        ((session?.user?.user_metadata as Record<string, unknown> | undefined)?.store_name as string | undefined) ||
        ((session?.user?.user_metadata as Record<string, unknown> | undefined)?.name as string | undefined) ||
        "Toko Saya";

      setSellerId(id);
      setStoreName(name);

      await fetchProducts(id, token);
    } catch (error) {
      console.error("Error loading seller data:", error);
      alert("Gagal memuat data penjual");
    }
  }, [fetchProducts, resolveSellerProfile]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const role = inferRole(data.session);
      if (!data.session || role !== "seller") {
        router.replace("/login");
        return;
      }
      if (active) {
        setAuthChecking(false);
        loadSellerData();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: string | null, session: Session | null) => {
        const role =
          (session?.user?.user_metadata as Record<string, unknown> | undefined)?.role ||
          (session?.user?.app_metadata as Record<string, unknown> | undefined)?.role;
        if (_event === "SIGNED_OUT" || !session || role !== "seller") {
          router.replace("/login");
        }
      }
    );

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, [router, loadSellerData]);

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token || !sellerId) {
        throw new Error("Token atau Seller ID tidak ditemukan");
      }

      const response = await fetch(`/api/penjual/reports/stock-rating?sellerId=${sellerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `API error: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeStoreName = (storeName || "Toko-Saya").replace(/\s+/g, "-");
      link.download = `Laporan-Stok-${safeStoreName}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert(`Gagal mendownload laporan: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setDownloading(false);
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
            <h1 className="text-2xl font-bold">Penjual Platform</h1>
            <p className="text-sm text-gray-400">Laporan Stok Produk</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <a
              href="/penjual/dashboard"
              className="rounded-lg border border-[#3a3a3a] px-3 py-2 text-gray-200 hover:border-[#0779FF]"
            >
              Dashboard
            </a>
            <a
              href="/penjual/upload-produk"
              className="rounded-lg border border-[#3a3a3a] px-3 py-2 text-gray-200 hover:border-[#0779FF]"
            >
              Upload Produk
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
            <h2 className="text-3xl font-bold text-white">Laporan Stok Produk</h2>
            <p className="text-gray-400">Daftar produk diurutkan berdasarkan rating tertinggi</p>
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
            <span className="font-semibold text-white">Toko:</span> {storeName}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            <span className="font-semibold text-white">Total Stok:</span>{" "}
            {products.reduce((sum, p) => sum + p.stock, 0)}
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
