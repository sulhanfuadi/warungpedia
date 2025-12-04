"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import SellerDashboardCharts from "@/components/penjual/SellerDashboardCharts";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/ui/Logo";

export default function SellerDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const initialSellerId = searchParams.get("sellerId") ?? "";
  const [sellerId, setSellerId] = useState(initialSellerId);
  const [activeSellerId, setActiveSellerId] = useState(initialSellerId);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setSellerId(initialSellerId);
    setActiveSellerId(initialSellerId);
  }, [initialSellerId]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams.toString());
    if (sellerId) {
      next.set("sellerId", sellerId);
    } else {
      next.delete("sellerId");
    }
    const query = next.toString();
    router.replace(query ? `?${query}` : "");
    setActiveSellerId(sellerId);
  };

  const handleDownloadStokByStok = async () => {
    if (!activeSellerId.trim()) {
      alert("⚠️ Masukkan Seller ID terlebih dahulu");
      return;
    }

    setIsDownloading(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      // ✅ DEBUG: Cek session
      console.log("🔍 Session Debug:", {
        hasSession: !!session.data.session,
        hasToken: !!token,
        userId: session.data.session?.user?.id,
      });

      if (!token) {
        alert("⚠️ Anda harus login terlebih dahulu");
        return;
      }

      const response = await fetch(
        `/api/penjual/laporan/stok-by-stok?sellerId=${encodeURIComponent(
          activeSellerId
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal download laporan");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Stok_${activeSellerId}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert("✅ Laporan berhasil didownload!");
    } catch (err) {
      console.error("❌ Error Detail:", err);
      alert(
        `❌ Error: ${err instanceof Error ? err.message : "Terjadi kesalahan"}`
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white">
      {/* HEADER */}
      <header className="border-b border-[#1f1f1f] bg-[#060608]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo size="sm" variant="white" showText href="/" />
          <p className="text-sm text-gray-400">Dashboard Penjual Warungpedia</p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* FORM INPUT SELLER ID */}
        <section className="rounded-2xl border border-[#1f1f1f] bg-[#11111a] p-6">
          <form
            className="grid gap-4 md:grid-cols-[1fr_auto]"
            onSubmit={handleSubmit}
          >
            <div>
              <label className="text-sm text-gray-400">Seller ID</label>
              <input
                type="text"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                placeholder="Masukkan UUID seller"
                className="mt-1 w-full rounded-xl border border-[#252533] bg-transparent px-3 py-2 text-sm text-white focus:border-[#0779FF] focus:outline-none"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#0779FF] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0a62c9]"
              >
                Muat Dashboard
              </button>
            </div>
          </form>

          {/* TOMBOL DOWNLOAD LAPORAN */}
          {activeSellerId && (
            <div className="mt-6 border-t border-[#1f1f1f] pt-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-300">
                📊 Laporan Penjual
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDownloadStokByStok}
                  disabled={isDownloading}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                    isDownloading
                      ? "cursor-not-allowed bg-gray-600"
                      : "bg-[#0779FF] hover:bg-[#0563cc]"
                  }`}
                >
                  {isDownloading
                    ? "⏳ Generating..."
                    : "📥 Download Laporan Stok (Urut Stok)"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* DASHBOARD CHARTS */}
        <section className="mt-6">
          {activeSellerId ? (
            <SellerDashboardCharts sellerId={activeSellerId} />
          ) : (
            <p className="rounded-2xl border border-[#1f1f1f] bg-[#11111a] p-6 text-sm text-gray-400">
              Masukkan Seller ID terlebih dahulu untuk melihat dashboard.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
