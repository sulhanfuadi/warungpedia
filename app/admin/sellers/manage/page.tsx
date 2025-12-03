"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { supabase } from "@/lib/supabaseClient";

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
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [authChecking, setAuthChecking] = useState(true);
const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

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
        fetchSellers();
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

  const fetchSellers = async () => {
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
  };

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

  const handleDownloadReport = async () => {
    try {
      const statusFilter = filter === "ALL" ? "ALL" : filter;
      console.log(`📥 [Step 1] Fetching report data untuk status: ${statusFilter}`);

      // Step 1: Fetch data dari Supabase via API
      const response = await fetch(`/api/admin/sellers/report?status=${statusFilter}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reportData = await response.json();
      console.log(`✅ [Step 2] Data dari Supabase:`, reportData.data);
      console.log(`   Total sellers: ${reportData.data.length}`);

      if (!reportData.success || !reportData.data?.length) {
        alert("Tidak ada data untuk diunduh");
        return;
      }

      // Step 2: Check library availability
      console.log(`🔍 [Step 3] Checking html2pdf...`);
      console.log(`   typeof html2pdf: ${typeof (window as any).html2pdf}`);

      if (!((window as any).html2pdf)) {
        throw new Error("html2pdf library tidak tersedia di window object");
      }

      // Step 3: Buat HTML string sederhana (Landscape)
      const generatedDate = new Date(reportData.generatedAt).toLocaleString("id-ID");
      
      let tableRows = "";
      reportData.data.forEach((seller: any, idx: number) => {
        const statusColor = 
          seller.status === "ACTIVE" ? "#22c55e" :
          seller.status === "INACTIVE" ? "#ef4444" : "#f59e0b";
        
        tableRows += `<tr><td style="border:1px solid #000;padding:10px;text-align:center;color:#000;font-size:11px;">${idx + 1}</td><td style="border:1px solid #000;padding:10px;color:#000;font-size:11px;">${seller.store_name}</td><td style="border:1px solid #000;padding:10px;color:#000;font-size:11px;">${seller.pic_name}</td><td style="border:1px solid #000;padding:10px;text-align:center;color:${statusColor};font-weight:bold;font-size:11px;">${seller.status}</td></tr>`;
      });

      const htmlContent = `<html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;padding:15px;margin:0;color:#000;"><h1 style="text-align:center;color:#000;font-size:16px;margin:0 0 5px 0;">LAPORAN DAFTAR AKUN PENJUAL</h1><p style="text-align:center;color:#000;font-size:11px;margin:0 0 15px 0;">Warungpedia Admin System</p><div style="margin:10px 0;padding:10px;background:#f0f0f0;border:1px solid #000;"><p style="margin:3px 0;color:#000;font-size:10px;"><strong>Filter:</strong> ${reportData.filterStatus}</p><p style="margin:3px 0;color:#000;font-size:10px;"><strong>Total Penjual:</strong> ${reportData.totalRecords}</p><p style="margin:3px 0;color:#000;font-size:10px;"><strong>Tanggal:</strong> ${generatedDate}</p></div><table style="width:100%;border-collapse:collapse;border:1px solid #000;margin:15px 0;"><thead><tr style="background:#0779FF;color:white;"><th style="border:1px solid #000;padding:10px;text-align:left;font-weight:bold;font-size:11px;">No</th><th style="border:1px solid #000;padding:10px;text-align:left;font-weight:bold;font-size:11px;">Nama Toko</th><th style="border:1px solid #000;padding:10px;text-align:left;font-weight:bold;font-size:11px;">PIC</th><th style="border:1px solid #000;padding:10px;text-align:center;font-weight:bold;font-size:11px;">Status</th></tr></thead><tbody>${tableRows}</tbody></table><div style="margin-top:20px;border-top:1px solid #000;padding-top:10px;text-align:center;color:#000;font-size:9px;"><p style="margin:3px 0;">Dokumen ini dibuat otomatis oleh Warungpedia</p><p style="margin:0;">© 2025 Warungpedia</p></div></body></html>`;

      console.log(`✅ [Step 4] HTML generated: ${htmlContent.length} chars`);

      // Step 4: Create temporary element
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.width = "800px";
      tempDiv.style.background = "white";
      tempDiv.style.padding = "0";
      tempDiv.style.margin = "0";
      
      document.body.appendChild(tempDiv);
      console.log(`✅ [Step 5] Element appended to DOM`);
      console.log(`   Element innerText length: ${tempDiv.innerText.length}`);

      // Wait untuk rendering
      await new Promise(r => setTimeout(r, 500));

      const filename = `Laporan_Penjual_${statusFilter}_${new Date().toISOString().slice(0, 10)}.pdf`;
      console.log(`📄 [Step 6] Starting PDF generation: ${filename}`);

      const html2pdf = (window as any).html2pdf;
      const options = {
        margin: 5,
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { orientation: "landscape", unit: "mm", format: "a4", compress: true }
      };

      // Generate PDF
      await html2pdf()
        .set(options)
        .from(tempDiv)
        .save();

      console.log(`✅ [Step 7] PDF generated and downloaded!`);
      
      document.body.removeChild(tempDiv);
      alert(`✅ Laporan PDF berhasil diunduh!\n${filename}`);

    } catch (error) {
      console.error("❌ ERROR:", error);
      alert(`❌ Gagal: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  useEffect(() => {
    if (!authChecking) {
      fetchSellers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, authChecking]);

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

          {/* Filter Buttons & Download */}
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

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadReport}
              className="ml-4 px-4 py-2 rounded-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center gap-2"
            >
              <span>📄</span>
              Download PDF
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
