"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchPendingSellers();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <header className="bg-[#343a40] text-white p-6 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">Admin Platform - Warungpedia</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          Verifikasi Pendaftaran Penjual
        </h2>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f8f9fa]">
              <tr>
                <th className="p-4 text-left text-gray-700 font-semibold">
                  Tanggal Daftar
                </th>
                <th className="p-4 text-left text-gray-700 font-semibold">
                  Nama Toko
                </th>
                <th className="p-4 text-left text-gray-700 font-semibold">
                  Nama PIC
                </th>
                <th className="p-4 text-left text-gray-700 font-semibold">
                  Status
                </th>
                <th className="p-4 text-left text-gray-700 font-semibold">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {sellers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Tidak ada pendaftaran yang menunggu verifikasi
                  </td>
                </tr>
              ) : (
                sellers.map((seller) => (
                  <tr key={seller.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      {new Date(seller.created_at).toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 font-medium">{seller.store_name}</td>
                    <td className="p-4">{seller.pic_name}</td>
                    <td className="p-4">
                      <span className="bg-yellow-400 text-black px-3 py-1 rounded-md text-sm font-bold">
                        {seller.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleShowDetail(seller)}
                        className="bg-[#17a2b8] text-white px-4 py-2 rounded-md hover:bg-[#138496] font-semibold"
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
          <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
            <h3 className="text-2xl font-bold mb-4">
              Detail Verifikasi: {selectedSeller.store_name}
            </h3>
            <hr className="mb-6" />

            <div className="grid grid-cols-2 gap-8">
              {/* Left Column - Data */}
              <div className="space-y-4">
                <div>
                  <label className="text-gray-600 text-sm font-bold">
                    Nama Toko
                  </label>
                  <p className="text-lg">{selectedSeller.store_name}</p>
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-bold">
                    Deskripsi
                  </label>
                  <p className="text-lg">
                    {selectedSeller.store_description || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-bold">
                    Nama PIC
                  </label>
                  <p className="text-lg">{selectedSeller.pic_name}</p>
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-bold">
                    Email
                  </label>
                  <p className="text-lg">{selectedSeller.pic_email}</p>
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-bold">
                    No HP
                  </label>
                  <p className="text-lg">{selectedSeller.pic_phone}</p>
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-bold">
                    Alamat Lengkap
                  </label>
                  <p className="text-lg">
                    {selectedSeller.pic_street}, RT {selectedSeller.pic_rt} / RW{" "}
                    {selectedSeller.pic_rw}
                    <br />
                    Kel. {selectedSeller.pic_village}, {selectedSeller.pic_city}
                    <br />
                    {selectedSeller.pic_province}
                  </p>
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-bold">
                    No. KTP
                  </label>
                  <p className="text-lg">{selectedSeller.pic_ktp_number}</p>
                </div>
              </div>

              {/* Right Column - Files */}
              <div className="space-y-6">
                <div>
                  <label className="text-gray-600 text-sm font-bold block mb-2">
                    Foto PIC
                  </label>
                  <div className="border border-dashed border-gray-300 rounded-lg overflow-hidden">
                    <Image
                      src={selectedSeller.pic_photo_path}
                      alt="Foto PIC"
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-bold block mb-2">
                    File KTP
                  </label>
                  <div className="border border-dashed border-gray-300 rounded-lg overflow-hidden">
                    <Image
                      src={selectedSeller.pic_ktp_file_path}
                      alt="File KTP"
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-6" />

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowRejectModal(true)}
                className="bg-[#dc3545] text-white px-6 py-3 rounded-md hover:bg-[#c82333] font-bold"
              >
                Tolak Pendaftaran
              </button>
              <button
                onClick={handleApprove}
                className="bg-[#28a745] text-white px-6 py-3 rounded-md hover:bg-[#218838] font-bold"
              >
                Terima & Aktifkan
              </button>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Alasan Penolakan</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                rows={4}
                placeholder="Masukkan alasan penolakan..."
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                  }}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-[#dc3545] text-white rounded-md hover:bg-[#c82333]"
                >
                  Kirim Penolakan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
