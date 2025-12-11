"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import {
  PieChart, Pie, Cell, Label,
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { supabase } from "@/lib/supabaseClient";

const COLORS = ["#0779FF", "#4ade80", "#facc15", "#f87171"];

interface ProductCategory {
  category: string;
  total: number;
}

interface StoreProvince {
  province: string;
  total: number;
}

interface DashboardStats {
  users: number;
  productCategories: ProductCategory[];
  storesByProvince: StoreProvince[];
  sellerStatusCounts?: {
    ACTIVE: number;
    INACTIVE: number;
    PENDING: number;
    REJECTED: number;
  };
  feedbackStats?: {
    totalFeedbacks: number;
    uniqueReviewers: number;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [downloadingStatusReport, setDownloadingStatusReport] = useState(false);
  const [downloadingProvinceReport, setDownloadingProvinceReport] = useState(false);
  const [downloadingProductReport, setDownloadingProductReport] = useState(false);

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

  const downloadReport = (
    endpoint: string,
    _filenamePrefix: string,
    setLoading: (state: boolean) => void,
  ) => {
    setLoading(true);
    try {
      const newWindow = window.open(endpoint, "_blank", "noopener,noreferrer");
      if (!newWindow) {
        throw new Error("Browser memblokir pop-up. Izinkan pop-up download dan coba lagi.");
      }
    } catch (error) {
      console.error("Gagal membuka laporan", error);
      alert(
        `Gagal membuka laporan: ${
          error instanceof Error ? error.message : "Terjadi kesalahan"
        }`,
      );
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleDownloadStatusReport = () =>
    downloadReport(
      "/api/admin/reports/sellers/status",
      "Laporan-Akun-Penjual",
      setDownloadingStatusReport,
    );

  const handleDownloadProvinceReport = () =>
    downloadReport(
      "/api/admin/reports/sellers/province",
      "Laporan-Toko-Provinsi",
      setDownloadingProvinceReport,
    );

  const handleDownloadProductReport = () =>
    downloadReport(
      "/api/admin/reports/products/rating",
      "Laporan-Produk-Rating",
      setDownloadingProductReport,
    );

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      const role = inferRole(data.session);
      if (!data.session || role !== "admin") {
        router.replace("/login");
        return;
      }
      if (active) {
        setAuthChecking(false);
        load();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const role =
        (session?.user.user_metadata as Record<string, unknown>)?.role ||
        (session?.user.app_metadata as Record<string, unknown>)?.role;
      if (event === "SIGNED_OUT" || !session || role !== "admin") {
        router.replace("/login");
      }
    });

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };

    async function load() {
      const res = await fetch("/api/dashboard");
      const data = await res.json();

      setStats({
        users: data.users ?? 0,
        productCategories: data.productCategories ?? [],
        storesByProvince: data.storesByProvince ?? [],
        sellerStatusCounts: data.sellerStatusCounts ?? { ACTIVE: 0, INACTIVE: 0, PENDING: 0, REJECTED: 0 },
        feedbackStats: data.feedbackStats ?? { totalFeedbacks: 0, uniqueReviewers: 0 },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authChecking || !stats) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#0779FF] mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const totalCategoryProducts = stats.productCategories.reduce((sum, item) => sum + item.total, 0);
  const categoryLegend = stats.productCategories.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
    percentage: totalCategoryProducts ? Math.round((item.total / totalCategoryProducts) * 100) : 0,
  }));

  const formatProvinceName = (province: string) =>
    province
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const wrapLabel = (label: string, maxChars = 12) => {
    const words = label.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxChars) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word.length > maxChars ? `${word.slice(0, maxChars - 1)}…` : word;
      }
    }
    if (current) lines.push(current);
    return lines.slice(0, 2); // clamp to 2 lines to avoid overflow
  };

  const provinceData = [...stats.storesByProvince]
    .map((item) => ({ ...item, displayName: formatProvinceName(item.province) }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">

      {/* HEADER */}
      <header className="bg-[#2a2a2a] text-white p-6 shadow-2xl border-b border-[#3a3a3a]">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <Logo size="lg" variant="white" showText={true} href="/" />
          <div className="hidden h-8 w-px bg-[#3a3a3a] md:block"></div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Admin Platform</h1>
            <p className="text-sm text-gray-400">Dashboard Statistik</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <a
              href="/admin/dashboard"
              className="rounded-lg border border-transparent bg-[#0779FF] px-3 py-2 font-semibold text-white hover:bg-[#0669dd]"
            >
              Dashboard
            </a>
            <a
              href="/admin/sellers"
              className="rounded-lg border border-[#3a3a3a] px-3 py-2 text-gray-200 hover:border-[#0779FF]"
            >
              Verifikasi Seller
            </a>
            <a
              href="/admin/sellers/manage"
              className="rounded-lg border border-[#3a3a3a] px-3 py-2 text-gray-200 hover:border-[#0779FF]"
            >
              Kelola Seller
            </a>
            <a
              href="/admin/products/report"
              className="rounded-lg border border-[#3a3a3a] px-3 py-2 text-gray-200 hover:border-[#0779FF]"
            >
              Laporan Produk
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
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-gray-400 mb-8">Ringkasan aktivitas penjual & produk</p>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
          <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#3a3a3a] shadow-2xl">
            <p className="text-gray-400 text-sm">Total Penjual</p>
            <h3 className="text-3xl font-bold text-white">{stats.users}</h3>
          </div>

          <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#3a3a3a] shadow-2xl">
            <p className="text-gray-400 text-sm">Kategori Produk</p>
            <h3 className="text-3xl font-bold text-white">{stats.productCategories.length}</h3>
          </div>

          <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#3a3a3a] shadow-2xl">
            <p className="text-gray-400 text-sm">Wilayah Penjual</p>
            <h3 className="text-3xl font-bold text-white">{stats.storesByProvince.length}</h3>
          </div>

          <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#3a3a3a] shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-gray-300 text-sm">Penjual Aktif</p>
              <span className="rounded-full border border-[#2f4460] bg-[#1b2737] px-2 py-1 text-[11px] text-[#8cb7ff]">
                Status
              </span>
            </div>
            <h3 className="text-3xl font-bold text-white mt-2">
              {stats.sellerStatusCounts?.ACTIVE ?? 0}
            </h3>
            <div className="mt-3 space-y-1 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-[#facc15]" />
                Non-aktif: {stats.sellerStatusCounts?.INACTIVE ?? 0}
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-[#f97316]" />
                Pending/Reject:{" "}
                {(stats.sellerStatusCounts?.PENDING ?? 0) + (stats.sellerStatusCounts?.REJECTED ?? 0)}
              </div>
            </div>
          </div>

          <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#3a3a3a] shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-gray-300 text-sm">Pengunjung Berkomentar</p>
              <span className="rounded-full border border-[#234433] bg-[#182922] px-2 py-1 text-[11px] text-[#93e2b6]">
                Feedback
              </span>
            </div>
            <h3 className="text-3xl font-bold text-white mt-2">
              {stats.feedbackStats?.uniqueReviewers ?? 0}
            </h3>
            <p className="text-xs text-gray-300 mt-3">
              Total komentar/rating:{" "}
              <span className="font-semibold text-[#93e2b6]">
                {stats.feedbackStats?.totalFeedbacks ?? 0}
              </span>
            </p>
            {(stats.feedbackStats?.totalFeedbacks ?? 0) === 0 && (
              <p className="text-[11px] text-gray-500 mt-2">
                Belum ada feedback. Dorong pengunjung untuk meninggalkan rating.
              </p>
            )}
          </div>
        </div>

        {/* REPORT ACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#3a3a3a] shadow-2xl flex flex-col gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Laporan Penjual</h3>
              <p className="text-gray-400 text-sm">
                Unduh laporan PDF akun aktif/tidak aktif serta rekap toko per provinsi.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleDownloadStatusReport}
                disabled={downloadingStatusReport}
                className="rounded-lg bg-purple-600 hover:bg-purple-700 px-5 py-3 font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingStatusReport ? "Mengunduh laporan akun..." : "Download Laporan Akun Penjual"}
              </button>
              <button
                onClick={handleDownloadProvinceReport}
                disabled={downloadingProvinceReport}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-3 font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingProvinceReport ? "Mengunduh laporan provinsi..." : "Download Laporan Toko per Provinsi"}
              </button>
            </div>
          </div>

          <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#3a3a3a] shadow-2xl flex flex-col gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Laporan Produk Platform</h3>
              <p className="text-gray-400 text-sm">
                Daftar produk lengkap dengan rating, toko, kategori, harga, dan provinsi.
              </p>
            </div>
            <button
              onClick={handleDownloadProductReport}
              disabled={downloadingProductReport}
              className="rounded-lg bg-green-600 hover:bg-green-700 px-5 py-3 font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingProductReport ? "Mengunduh laporan produk..." : "Download Laporan Produk"}
            </button>
          </div>
        </div>

        {/* CHART GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* PIE CHART */}
          <div className="bg-gradient-to-b from-[#2f2f2f] to-[#1d1d1d] p-6 rounded-2xl border border-[#3a3a3a] shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Distribusi Kategori Produk</h3>
            <div className="h-80 pt-4">
              {categoryLegend.length ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                  <PieChart>
                    <Pie
                      data={categoryLegend}
                      dataKey="total"
                      nameKey="category"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {categoryLegend.map((item, index) => (
                        <Cell key={`${item.category || "kategori"}-${index}`} fill={item.color} />
                      ))}
                      <Label
                        position="center"
                        content={({ viewBox }) => {
                          const vb = viewBox as { cx?: number; cy?: number } | undefined;
                          if (!vb || typeof vb.cx !== "number" || typeof vb.cy !== "number") {
                            return null;
                          }
                          const { cx, cy } = vb;
                          return (
                            <g>
                              <text x={cx} y={cy - 8} textAnchor="middle" fill="#a3a3a3" fontSize={12}>
                                Total Produk
                              </text>
                              <text x={cx} y={cy + 18} textAnchor="middle" fill="#ffffff" fontSize={24} fontWeight={700}>
                                {totalCategoryProducts}
                              </text>
                            </g>
                          );
                        }}
                      />
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#1f1f1f", border: "1px solid #333" }}
                      labelStyle={{ color: "#f5f5f5" }}
                      itemStyle={{ color: "#e0e0e0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Belum ada data kategori.
                </div>
              )}
            </div>

            {categoryLegend.length > 0 && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryLegend.map((item, index) => (
                  <div
                    key={`${item.category || "kategori"}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-4 py-3 shadow-inner"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ background: item.color }}></span>
                      <p className="text-white text-sm font-medium truncate max-w-[120px]">
                        {item.category || "Tanpa Kategori"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm font-semibold">{item.percentage}%</p>
                      <p className="text-xs text-gray-400">{item.total} produk</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BAR CHART */}
          <div className="bg-gradient-to-b from-[#2f2f2f] to-[#1d1d1d] p-6 rounded-2xl border border-[#3a3a3a] shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Penjual per Provinsi</h3>
            <div className="h-80 pt-4">
              <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                <BarChart data={provinceData} margin={{ top: 10, right: 16, left: 4, bottom: 24 }}>
                  <defs>
                    <linearGradient id="provinceBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0b8cff" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#0669dd" stopOpacity={0.95} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" vertical={false} />
                  <XAxis
                    dataKey="displayName"
                    interval={0}
                    tickMargin={10}
                    tick={(props) => {
                      const { x, y, payload } = props;
                      const lines = wrapLabel(payload.value, 12);
                      return (
                        <g transform={`translate(${x},${y})`}>
                          {lines.map((line: string, i: number) => (
                            <text
                              key={i}
                              x={0}
                              y={i * 13}
                              textAnchor="middle"
                              fill="#d1d5db"
                              fontSize={11}
                            >
                              {line}
                            </text>
                          ))}
                        </g>
                      );
                    }}
                  />
                  <YAxis stroke="#ccc" tick={{ fill: "#d1d5db", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "#111827", border: "1px solid #374151" }}
                    labelStyle={{ color: "#e5e7eb" }}
                    itemStyle={{ color: "#e5e7eb" }}
                    formatter={(value: number, _name, entry) => [`${value} penjual`, entry.payload.displayName]}
                  />
                  <Bar dataKey="total" fill="url(#provinceBar)" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-[#1a1a1a] border-t border-[#3a3a3a] py-6 px-4 mt-auto">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
          <Logo size="sm" variant="white" showText={true} href="/" />
          <p>© 2025 Warungpedia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
