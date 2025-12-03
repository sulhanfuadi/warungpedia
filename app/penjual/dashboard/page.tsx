"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import SellerDashboardCharts from "@/components/penjual/SellerDashboardCharts";
import Logo from "@/components/ui/Logo";

export default function SellerDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSellerId = searchParams.get("sellerId") ?? "";
  const [sellerId, setSellerId] = useState(initialSellerId);
  const [activeSellerId, setActiveSellerId] = useState(initialSellerId);

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

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white">
      <header className="border-b border-[#1f1f1f] bg-[#060608]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo size="sm" variant="white" showText href="/" />
          <p className="text-sm text-gray-400">Dashboard Penjual Warungpedia</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="rounded-2xl border border-[#1f1f1f] bg-[#11111a] p-6">
          <form className="grid gap-4 md:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
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
                className="w-full rounded-xl bg-[#0779FF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0a62c9]"
              >
                Muat Dashboard
              </button>
            </div>
          </form>
        </section>

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
