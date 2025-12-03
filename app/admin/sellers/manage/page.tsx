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
      console.log(`📥 Downloading report for status: ${statusFilter}`);

      // Fetch JSON data from API
      const response = await fetch(
        `/api/admin/sellers/report?status=${statusFilter}`
      );

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        let errorMessage = "Unknown error";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error("❌ API Error:", errorData);
        } catch (parseError) {
          const errorText = await response.text();
          errorMessage = errorText || `HTTP ${response.status}`;
          console.error("❌ API Error (non-JSON response):", errorText);
        }
        alert(`❌ Gagal mengunduh laporan: ${errorMessage}`);
        return;
      }

      const reportData = await response.json();
      console.log(`✅ Report data fetched:`, reportData);

      if (!reportData.success || !reportData.data || reportData.data.length === 0) {
        alert("❌ Tidak ada data untuk diunduh");
        return;
      }

      // Build HTML content for PDF
      const generatedDate = new Date(reportData.generatedAt).toLocaleString("id-ID");
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="text-align: center; color: #1a1a1a; margin-bottom: 10px;">Laporan Data Penjual</h1>
          <p style="text-align: center; color: #666; margin-bottom: 20px;">Warungpedia Admin System</p>
          
          <div style="margin-bottom: 20px; border-top: 2px solid #0779FF; border-bottom: 1px solid #ccc; padding: 10px 0;">
            <p style="margin: 5px 0;"><strong>Filter Status:</strong> ${reportData.filterStatus}</p>
            <p style="margin: 5px 0;"><strong>Total Record:</strong> ${reportData.totalRecords}</p>
            <p style="margin: 5px 0;"><strong>Tanggal Generate:</strong> ${generatedDate}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #0779FF; color: white;">
                <th style="border: 1px solid #ccc; padding: 10px; text-align: left; font-weight: bold;">No</th>
                <th style="border: 1px solid #ccc; padding: 10px; text-align: left; font-weight: bold;">Nama Toko</th>
                <th style="border: 1px solid #ccc; padding: 10px; text-align: left; font-weight: bold;">PIC</th>
                <th style="border: 1px solid #ccc; padding: 10px; text-align: left; font-weight: bold;">Email</th>
                <th style="border: 1px solid #ccc; padding: 10px; text-align: left; font-weight: bold;">Kota</th>
                <th style="border: 1px solid #ccc; padding: 10px; text-align: left; font-weight: bold;">Status</th>
                <th style="border: 1px solid #ccc; padding: 10px; text-align: left; font-weight: bold;">Tanggal Daftar</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.data
                .map(
                  (row: { no: number; store_name: string; pic_name: string; pic_email: string; pic_city: string; status: string; created_at: string }) => `
                <tr style="${row.no % 2 === 0 ? "background-color: #f9f9f9;" : ""}">
                  <td style="border: 1px solid #ccc; padding: 8px;">${row.no}</td>
                  <td style="border: 1px solid #ccc; padding: 8px;">${row.store_name}</td>
                  <td style="border: 1px solid #ccc; padding: 8px;">${row.pic_name}</td>
                  <td style="border: 1px solid #ccc; padding: 8px;">${row.pic_email}</td>
                  <td style="border: 1px solid #ccc; padding: 8px;">${row.pic_city}</td>
                  <td style="border: 1px solid #ccc; padding: 8px; font-weight: bold; color: ${
                    row.status === "ACTIVE" ? "#22c55e" : row.status === "INACTIVE" ? "#ef4444" : "#f59e0b"
                  };">${row.status}</td>
                  <td style="border: 1px solid #ccc; padding: 8px;">${new Date(row.created_at).toLocaleDateString("id-ID")}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
            <p>Dokumen ini dibuat otomatis oleh sistem Warungpedia</p>
            <p>© 2025 Warungpedia. All rights reserved.</p>
          </div>
        </div>
      `;

      const filename = `Laporan_Penjual_${statusFilter}_${new Date().toISOString().split("T")[0]}.pdf`;

      console.log(`📄 Generating PDF: ${filename}`);

      // Create temporary element with larger size for better rendering
      const element = document.createElement("div");
      element.innerHTML = htmlContent;
      element.style.width = "210mm";
      element.style.height = "297mm";
      element.style.padding = "20mm";
      element.style.boxSizing = "border-box";
      element.style.backgroundColor = "white";
      element.style.visibility = "hidden";
      element.style.position = "absolute";
      element.style.left = "-9999px";
      document.body.appendChild(element);

      // Wait a moment for the DOM to render
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log(`Element content length: ${element.innerText.length}`);

      // Use html2pdf from window object
      if (typeof window !== "undefined" && (window as any).html2pdf) {
        const html2pdf = (window as any).html2pdf;
        const options = {
          margin: [10, 10, 10, 10],
          filename: filename,
          image: { type: "jpeg" as const, quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff"
          },
          jsPDF: { 
            orientation: "landscape" as const, 
            unit: "mm", 
            format: "a4",
            compress: true
          },
        };
        
        try {
          console.log(`Starting pdf generation with html2pdf...`);
          await html2pdf().set(options).from(element).save();
          console.log(`✅ PDF saved successfully`);
        } catch (pdfError) {
          console.error(`❌ PDF generation error:`, pdfError);
          throw pdfError;
        }
      } else {
        console.warn("⚠️ html2pdf not loaded, trying alternative approach");
        // Wait for it to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        if ((window as any).html2pdf) {
          const html2pdf = (window as any).html2pdf;
          const options = {
            margin: [10, 10, 10, 10],
            filename: filename,
            image: { type: "jpeg" as const, quality: 0.98 },
            html2canvas: { scale: 2, backgroundColor: "#ffffff" },
            jsPDF: { orientation: "landscape" as const, unit: "mm", format: "a4" },
          };
          await html2pdf().set(options).from(element).save();
        } else {
          throw new Error("html2pdf library not available");
        }
      }

      // Cleanup
      if (element.parentNode) {
        document.body.removeChild(element);
      }

      console.log(`✅ PDF/File generated and downloaded successfully`);
      alert("✅ Laporan berhasil diunduh");
    } catch (error) {
      console.error("❌ Error downloading report:", error);
      alert(
        `Terjadi kesalahan saat mengunduh laporan: ${error instanceof Error ? error.message : String(error)}`
      );
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
