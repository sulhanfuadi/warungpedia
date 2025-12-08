"use client";

import { useCallback, useEffect, useState } from "react";
import Logo from "@/components/ui/Logo";

interface Seller {
  id: string;
  store_name: string;
  pic_name: string;
  pic_email: string;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  verified_at: string | null;
}

export default function ManageSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const fetchSellers = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/sellers?status=${filter === "ALL" ? "ALL" : filter}`
      );
      const data = await response.json();
      // Filter hanya ACTIVE & INACTIVE
      const filtered = (data.sellers || []).filter(
        (s: Seller) => s.status === "ACTIVE" || s.status === "INACTIVE"
      );
      setSellers(filtered);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      alert("Gagal mengambil data penjual");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const handleToggleStatus = async (seller: Seller) => {
    const action = seller.status === "ACTIVE" ? "suspend" : "reactivate";
    const confirmText =
      action === "suspend"
        ? `Suspend akun ${seller.store_name}?`
        : `Reaktivasi akun ${seller.store_name}?`;

    if (!confirm(confirmText)) return;

    try {
      const response = await fetch(`/api/admin/sellers/${seller.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ ${result.message}`);
        fetchSellers();
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Terjadi kesalahan saat mengubah status");
    }
  };

  if (isLoading) {
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
      {/* Header */}
      <header className="bg-[#2a2a2a] text-white p-6 shadow-2xl border-b border-[#3a3a3a]">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="lg" variant="white" showText={true} href="/" />
              <div className="h-8 w-px bg-[#3a3a3a]"></div>
              <div>
                <h1 className="text-2xl font-bold">Admin Platform</h1>
                <p className="text-sm text-gray-400">Kelola Status Penjual</p>
              </div>
            </div>
            <a
              href="/admin/sellers"
              className="text-[#0779FF] hover:underline text-sm"
            >
              ← Kembali ke Verifikasi
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow container mx-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Kelola Status Akun Penjual
            </h2>
            <p className="text-gray-400">
              Suspend atau reaktivasi akun penjual
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === "ALL"
                  ? "bg-[#0779FF] text-white"
                  : "bg-[#3a3a3a] text-gray-400 hover:bg-[#4a4a4a]"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter("ACTIVE")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === "ACTIVE"
                  ? "bg-green-600 text-white"
                  : "bg-[#3a3a3a] text-gray-400 hover:bg-[#4a4a4a]"
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setFilter("INACTIVE")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === "INACTIVE"
                  ? "bg-red-600 text-white"
                  : "bg-[#3a3a3a] text-gray-400 hover:bg-[#4a4a4a]"
              }`}
            >
              Tidak Aktif
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden border border-[#3a3a3a]">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="p-4 text-left text-gray-300 font-semibold">
                  Nama Toko
                </th>
                <th className="p-4 text-left text-gray-300 font-semibold">
                  Nama PIC
                </th>
                <th className="p-4 text-left text-gray-300 font-semibold">
                  Email
                </th>
                <th className="p-4 text-left text-gray-300 font-semibold">
                  Status
                </th>
                <th className="p-4 text-left text-gray-300 font-semibold">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {sellers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Tidak ada data penjual
                  </td>
                </tr>
              ) : (
                sellers.map((seller) => (
                  <tr
                    key={seller.id}
                    className="border-b border-[#3a3a3a] hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="p-4 font-medium text-white">
                      {seller.store_name}
                    </td>
                    <td className="p-4 text-gray-300">{seller.pic_name}</td>
                    <td className="p-4 text-gray-300">{seller.pic_email}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-bold ${
                          seller.status === "ACTIVE"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {seller.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(seller)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          seller.status === "ACTIVE"
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                      >
                        {seller.status === "ACTIVE"
                          ? "Suspend Akun"
                          : "Reaktivasi"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
