"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { supabase } from "@/lib/supabaseClient";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#0779FF", "#4ade80", "#facc15", "#f87171", "#a855f7", "#fb7185", "#34d399", "#38bdf8"];
const NAV_LINKS = [
  { label: "Dashboard", href: "/penjual/dashboard" },
  { label: "Produk", href: "/penjual/upload-produk" },
  { label: "Pesanan", href: "#" },
  { label: "Analitik", href: "#" },
];

type DashboardSummary = {
  totalProducts: number;
  totalFeedbacks: number;
  averageRating: number;
  lastFeedbackAt: string | null;
};

type RatingDistribution = {
  rating: number;
  total: number;
  percentage: number;
};

type ProvinceDistribution = {
  province: string;
  total: number;
};

type ProductPerformance = {
  id: string;
  name: string;
  category: string | null;
  stock: number | null;
  price: number | null;
  totalFeedbacks: number;
  averageRating: number;
};

type RecentFeedback = {
  id: string;
  product_id: string;
  customer_name: string;
  comment: string;
  rating: number;
  province: string | null;
  created_at: string;
  product_name: string;
};

type SellerDashboardResponse = {
  sellerId: string;
  summary: DashboardSummary;
  ratingDistribution: RatingDistribution[];
  provinceDistribution: ProvinceDistribution[];
  productPerformance: ProductPerformance[];
  recentFeedbacks: RecentFeedback[];
};

export default function SellerDashboardPage() {
  const [sessionSellerId, setSessionSellerId] = useState<string | null>(null);
  const [manualSellerId, setManualSellerId] = useState("");
  const [customSellerId, setCustomSellerId] = useState<string | null>(null);
  const [stats, setStats] = useState<SellerDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeSellerId = sessionSellerId || customSellerId;

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (data.user?.id) {
          setSessionSellerId(data.user.id);
        }
      })
      .catch(() => setSessionSellerId(null));
  }, []);

  useEffect(() => {
    if (!activeSellerId) return;
    fetch(`/api/penjual/dashboard?sellerId=${activeSellerId}`)
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error || "Gagal memuat statistik penjual");
        }
        setError(null);
        setStats(payload);
      })
      .catch((err: Error) => {
        setStats(null);
        setError(err.message);
      });
  }, [activeSellerId]);

  const ratingDataset = useMemo(() => stats?.ratingDistribution ?? [], [stats]);
  const provinceDataset = useMemo(() => stats?.provinceDistribution ?? [], [stats]);
  const topProducts = useMemo(() => stats?.productPerformance.slice(0, 5) ?? [], [stats]);
  const recentFeedbacks = stats?.recentFeedbacks ?? [];
  const hasRatingData = ratingDataset.some((entry) => entry.total > 0);
  const chartRatingData = useMemo(() => [...ratingDataset].reverse(), [ratingDataset]);

  const lastFeedbackLabel = (() => {
    const last = stats?.summary.lastFeedbackAt;
    if (!last) return "Belum ada ulasan";
    return `Update terakhir ${new Date(last).toLocaleDateString("id-ID")}`;
  })();

  const handleManualConnect = () => {
    if (!manualSellerId.trim()) {
      setError("Isi Seller ID terlebih dahulu atau login sebagai penjual.");
      return;
    }
    setCustomSellerId(manualSellerId.trim());
  };

  return (
    <div className="min-h-screen bg-[#0b0d13] text-white">
      <header className="border-b border-white/5 bg-gradient-to-r from-[#050817] via-[#0b1535] to-[#05192b]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <Logo size="lg" variant="white" showText href="/" />
            <nav className="flex gap-4 text-sm text-white/70">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`rounded-full px-3 py-1 transition ${
                    link.href === "/penjual/dashboard"
                      ? "bg-white/10 text-white"
                      : "hover:text-[#6ae0ff]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/70">
            <span className="hidden sm:inline">{activeSellerId ? "ID Penjual" : "Belum login"}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-white">
              {activeSellerId ? activeSellerId.slice(0, 10) + "…" : "Guest"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="mb-8 rounded-2xl border border-white/5 bg-[#101524] p-6 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-[#6ae0ff]">Dashboard Penjual</p>
              <h1 className="mt-2 text-3xl font-semibold">Pantau performa tokomu secara real-time</h1>
              <p className="mt-2 text-white/70">
                Statistik rating, sebaran pelanggan, serta umpan balik terbaru otomatis diperbarui.
              </p>
            </div>
            {!sessionSellerId && (
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="mb-2 text-sm font-semibold text-white/80">Masukkan Seller ID (untuk testing)</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={manualSellerId}
                    onChange={(e) => setManualSellerId(e.target.value)}
                    placeholder="UUID seller"
                    className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm focus:border-[#6ae0ff] focus:outline-none"
                  />
                  <button
                    onClick={handleManualConnect}
                    className="rounded-xl bg-[#0779FF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f8bff]"
                  >
                    Muat Data
                  </button>
                </div>
              </div>
            )}
          </div>
          {error && (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
        </section>

        {!activeSellerId && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-10 text-center text-white/70">
            <p className="text-lg font-semibold text-white">Masuk sebagai penjual untuk melihat dashboard.</p>
            <p className="mt-2">Gunakan tombol di atas untuk memasukkan Seller ID secara manual jika belum ada sesi login.</p>
          </div>
        )}

        {activeSellerId && (
          <section className="space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              <SummaryCard title="Produk Aktif" value={stats?.summary.totalProducts ?? 0} subtitle="Total katalog kamu" />
              <SummaryCard title="Total Feedback" value={stats?.summary.totalFeedbacks ?? 0} subtitle="Akumulasi ulasan pelanggan" />
              <SummaryCard
                title="Rata-rata Rating"
                value={(stats?.summary.averageRating ?? 0).toFixed(2)}
                subtitle={lastFeedbackLabel}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-black/30 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Sebaran Rating</h2>
                  <span className="text-sm text-white/60">5 skor terakhir</span>
                </div>
                <div className="h-72">
                  {hasRatingData ? (
                    <ResponsiveContainer>
                      <BarChart data={chartRatingData}>
                        <XAxis dataKey={(entry) => `${entry.rating}★`} stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "white" }}
                          labelFormatter={(label) => `Rating ${label}`}
                        />
                        <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="Belum ada data rating" />
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-black/30 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Sebaran Provinsi Perating</h2>
                  <span className="text-sm text-white/60">Top 8 provinsi</span>
                </div>
                <div className="h-72">
                  {provinceDataset.length > 0 ? (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={provinceDataset} dataKey="total" nameKey="province" innerRadius={60} outerRadius={110} paddingAngle={2}>
                          {provinceDataset.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", color: "white" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="Belum ada sebaran provinsi" />
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="rounded-2xl border border-white/5 bg-black/30 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Performa Produk</h2>
                  <span className="text-sm text-white/60">Urut rating tertinggi</span>
                </div>
                {topProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-white/60">
                        <tr>
                          <th className="pb-3 font-medium">Produk</th>
                          <th className="pb-3 font-medium">Kategori</th>
                          <th className="pb-3 font-medium">Stok</th>
                          <th className="pb-3 font-medium">Ulasan</th>
                          <th className="pb-3 font-medium">Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((product) => (
                          <tr key={product.id} className="border-t border-white/5">
                            <td className="py-3 font-semibold text-white">{product.name}</td>
                            <td className="py-3 text-white/70">{product.category || "-"}</td>
                            <td className="py-3 text-white/70">{product.stock ?? 0}</td>
                            <td className="py-3 text-white/70">{product.totalFeedbacks}</td>
                            <td className="py-3 font-semibold text-[#6ae0ff]">{product.averageRating.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState message="Belum ada performa produk" />
                )}
              </div>

              <div className="rounded-2xl border border-white/5 bg-black/30 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Feedback Terbaru</h2>
                  <span className="text-sm text-white/60">6 ulasan terakhir</span>
                </div>
                <div className="space-y-4">
                  {recentFeedbacks.length ? (
                    recentFeedbacks.map((feedback) => (
                      <article key={feedback.id} className="rounded-xl border border-white/5 bg-white/5 p-4">
                        <div className="flex items-center justify-between text-sm">
                          <p className="font-semibold">{feedback.customer_name || "Anonim"}</p>
                          <span className="text-[#facc15]">{"★".repeat(Math.round(feedback.rating))}</span>
                        </div>
                        <p className="mt-1 text-xs text-white/60">{feedback.product_name}</p>
                        <p className="mt-2 text-sm text-white/80">{feedback.comment || "Tidak ada komentar"}</p>
                        <div className="mt-2 text-xs text-white/50">
                          <span>{feedback.province || "Provinsi tidak diketahui"}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(feedback.created_at).toLocaleDateString("id-ID")}</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <EmptyState message="Belum ada feedback" />
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="mt-12 border-t border-white/5 bg-black/40 py-6 text-center text-sm text-white/60">
        © {new Date().getFullYear()} Warungpedia. Semua hak dilindungi.
      </footer>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/30 p-5 shadow-inner">
      <p className="text-sm uppercase tracking-widest text-white/60">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {subtitle && <p className="mt-2 text-sm text-white/60">{subtitle}</p>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/50">
      {message}
    </div>
  );
}
