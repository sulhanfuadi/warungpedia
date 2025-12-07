"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer
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
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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
        </div>

        {/* CHART GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* PIE CHART */}
          <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#3a3a3a] shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Distribusi Kategori Produk</h3>
            <div className="h-80">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.productCategories as any}
                    dataKey="total"
                    nameKey="category"
                    outerRadius={120}
                    fill="#8884d8"
                  >
                    {stats.productCategories.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BAR CHART */}
          <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#3a3a3a] shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Penjual per Provinsi</h3>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={stats.storesByProvince}>
                  <XAxis
                    dataKey="province"
                    interval={0}
                    tick={(props) => {
                      const { x, y, payload } = props;
                      const text = payload.value.split(" ");
                      return (
                        <g transform={`translate(${x},${y})`}>
                          {text.map((word: string, i: number) => (
                            <text
                              key={i}
                              x={0}
                              y={i * 14}
                              textAnchor="middle"
                              fill="#ccc"
                              fontSize={11}
                            >
                              {word}
                            </text>
                          ))}
                        </g>
                      );
                    }}
                  />  
                  <YAxis stroke="#ccc" />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333" }} />
                  <Bar dataKey="total" fill="#0779FF" />
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
