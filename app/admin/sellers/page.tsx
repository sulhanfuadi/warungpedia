"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "@/components/ui/Logo";
import { supabase } from "@/lib/supabaseClient";

interface Seller {
  id: string;
  store_name: string;
  pic_name: string;
  pic_email: string;
  pic_phone: string;
  pic_street: string;
  pic_rt: string;
  pic_rw: string;
  pic_village: string;
  pic_city: string;
  pic_province: string;
  pic_ktp_number: string;
  pic_photo_path: string;
  pic_ktp_file_path: string;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  created_at: string;
  verified_at: string | null;
  store_description: string | null;
}

export default function AdminSellersPage() {
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const adminEmails = [
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@warungpedia.id",
  ];

  const inferRole = (session: unknown): string | undefined => {
    if (!session || typeof session !== "object") return undefined;
    const s = session as { user?: { user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown>; email?: string } };
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
    supabase.auth.getSession().then(({ data }) => {
      const role = inferRole(data.session);
      if (!data.session || role !== "admin") {
        router.replace("/admin/login");
        return;
      }
      if (active) {
        setAuthChecking(false);
        fetchPendingSellers();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const role =
        (session?.user.user_metadata as Record<string, unknown>)?.role ||
        (session?.user.app_metadata as Record<string, unknown>)?.role;
      if (event === "SIGNED_OUT" || !session || role !== "admin") {
        router.replace("/admin/login");
      }
    });

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPendingSellers = async () => {
    try {
      const response = await fetch("/api/admin/sellers?status=PENDING");
      const data = await response.json();
      setSellers(data.sellers || []);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      alert("Gagal mengambil data penjual");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowDetail = (seller: Seller) => {
    setSelectedSeller(seller);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApprove = async () => {
    if (!selectedSeller) return;

    if (
      !confirm(
        `Apakah Anda yakin ingin menerima pendaftaran ${selectedSeller.store_name}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/sellers/${selectedSeller.id}/approve`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert(
          "✅ Pendaftaran berhasil diterima! Email aktivasi telah dikirim."
        );
        setSelectedSeller(null);
        fetchPendingSellers();
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error approving seller:", error);
      alert("Terjadi kesalahan saat menerima pendaftaran");
    }
  };

  const handleReject = async () => {
    if (!selectedSeller || !rejectReason.trim()) {
      alert("Alasan penolakan harus diisi!");
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/sellers/${selectedSeller.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert(
          "✅ Pendaftaran berhasil ditolak! Email penolakan telah dikirim."
        );
        setSelectedSeller(null);
        setShowRejectModal(false);
        setRejectReason("");
        fetchPendingSellers();
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error rejecting seller:", error);
      alert("Terjadi kesalahan saat menolak pendaftaran");
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
      {/* Header */}
      <header className="bg-[#2a2a2a] text-white p-6 shadow-2xl border-b border-[#3a3a3a]">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="lg" variant="white" showText={true} href="/" />
              <div className="h-8 w-px bg-[#3a3a3a]"></div>
              <div>
                <h1 className="text-2xl font-bold">Admin Platform</h1>
                <p className="text-sm text-gray-400">
                  Panel Verifikasi Penjual
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow container mx-auto p-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Verifikasi Pendaftaran Penjual
          </h2>
          <p className="text-gray-400">
            Kelola dan verifikasi pendaftaran calon penjual
          </p>
        </div>

        {/* Table */}
        <div className="bg-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden border border-[#3a3a3a]">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="p-4 text-left text-gray-300 font-semibold">
                  Tanggal Daftar
                </th>
                <th className="p-4 text-left text-gray-300 font-semibold">
                  Nama Toko
                </th>
                <th className="p-4 text-left text-gray-300 font-semibold">
                  Nama PIC
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
                    <div className="flex flex-col items-center justify-center py-8">
                      <svg
                        className="w-16 h-16 text-gray-600 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <p className="text-xl font-semibold">
                        Tidak ada pendaftaran yang menunggu verifikasi
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sellers.map((seller) => (
                  <tr
                    key={seller.id}
                    className="border-b border-[#3a3a3a] hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="p-4 text-gray-300">
                      {new Date(seller.created_at).toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 font-medium text-white">
                      {seller.store_name}
                    </td>
                    <td className="p-4 text-gray-300">{seller.pic_name}</td>
                    <td className="p-4">
                      <span className="bg-yellow-500 text-black px-3 py-1 rounded-lg text-sm font-bold">
                        {seller.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleShowDetail(seller)}
                        className="bg-[#0779FF] text-white px-4 py-2 rounded-lg hover:bg-[#0669dd] font-semibold transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                      >
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selectedSeller && (
          <div className="bg-[#2a2a2a] rounded-2xl shadow-2xl p-8 mt-8 border border-[#3a3a3a]">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Detail Verifikasi: {selectedSeller.store_name}
                </h3>
                <p className="text-gray-400">
                  Periksa kelengkapan data administrasi calon penjual
                </p>
              </div>
              <button
                onClick={() => setSelectedSeller(null)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Tutup detail"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <hr className="border-[#3a3a3a] mb-6" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Data */}
              <div className="space-y-4">
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
                  <label className="text-gray-500 text-xs font-bold block mb-1 uppercase tracking-wider">
                    Nama Toko
                  </label>
                  <p className="text-lg text-white font-medium">
                    {selectedSeller.store_name}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
                  <label className="text-gray-500 text-xs font-bold block mb-1 uppercase tracking-wider">
                    Deskripsi
                  </label>
                  <p className="text-lg text-white">
                    {selectedSeller.store_description || "-"}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
                  <label className="text-gray-500 text-xs font-bold block mb-1 uppercase tracking-wider">
                    Nama PIC
                  </label>
                  <p className="text-lg text-white">
                    {selectedSeller.pic_name}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
                  <label className="text-gray-500 text-xs font-bold block mb-1 uppercase tracking-wider">
                    Email
                  </label>
                  <p className="text-lg text-[#0779FF]">
                    {selectedSeller.pic_email}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
                  <label className="text-gray-500 text-xs font-bold block mb-1 uppercase tracking-wider">
                    No HP
                  </label>
                  <p className="text-lg text-white">
                    {selectedSeller.pic_phone}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
                  <label className="text-gray-500 text-xs font-bold block mb-1 uppercase tracking-wider">
                    Alamat Lengkap
                  </label>
                  <p className="text-base text-white leading-relaxed">
                    {selectedSeller.pic_street}
                    <br />
                    RT {selectedSeller.pic_rt} / RW {selectedSeller.pic_rw}
                    <br />
                    Kel. {selectedSeller.pic_village}
                    <br />
                    {selectedSeller.pic_city}, {selectedSeller.pic_province}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
                  <label className="text-gray-500 text-xs font-bold block mb-1 uppercase tracking-wider">
                    No. KTP
                  </label>
                  <p className="text-lg text-white font-mono">
                    {selectedSeller.pic_ktp_number}
                  </p>
                </div>
              </div>

              {/* Right Column - Files */}
              <div className="space-y-6">
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
                  <label className="text-gray-500 text-xs font-bold block mb-3 uppercase tracking-wider">
                    Foto PIC
                  </label>
                  <div className="border-2 border-dashed border-[#3a3a3a] rounded-lg overflow-hidden hover:border-[#0779FF] transition-colors">
                    <Image
                      src={selectedSeller.pic_photo_path}
                      alt="Foto PIC"
                      width={500}
                      height={400}
                      className="w-full h-80 object-cover"
                    />
                  </div>
                </div>
                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
                  <label className="text-gray-500 text-xs font-bold block mb-3 uppercase tracking-wider">
                    File KTP
                  </label>
                  <div className="border-2 border-dashed border-[#3a3a3a] rounded-lg overflow-hidden hover:border-[#0779FF] transition-colors">
                    <Image
                      src={selectedSeller.pic_ktp_file_path}
                      alt="File KTP"
                      width={500}
                      height={400}
                      className="w-full h-80 object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-[#3a3a3a] my-8" />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <button
                onClick={() => setShowRejectModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-bold transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
              >
                ✕ Tolak Pendaftaran
              </button>
              <button
                onClick={handleApprove}
                className="bg-[#0779FF] hover:bg-[#0669dd] text-white px-8 py-4 rounded-lg font-bold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
              >
                ✓ Terima & Aktifkan
              </button>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#2a2a2a] rounded-2xl p-8 max-w-md w-full border border-[#3a3a3a] shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-600 rounded-full p-2">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Alasan Penolakan
                </h3>
              </div>
              <p className="text-gray-400 mb-6">
                Jelaskan alasan penolakan pendaftaran ini
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-4 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg mb-6 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent transition-all"
                rows={4}
                placeholder="Masukkan alasan penolakan..."
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                  }}
                  className="flex-1 px-6 py-3 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white rounded-lg font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
                >
                  Kirim Penolakan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] border-t border-[#3a3a3a] py-6 px-4 mt-auto">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Logo size="sm" variant="white" showText={true} href="/" />
            </div>
            <div className="text-gray-400 text-sm text-center md:text-right">
              <p>© 2025 Warungpedia. All rights reserved.</p>
              <p className="mt-1">
                Butuh bantuan?{" "}
                <a
                  href="mailto:support@warungpedia.id"
                  className="text-[#0779FF] hover:underline"
                >
                  support@warungpedia.id
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
