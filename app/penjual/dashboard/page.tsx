"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SellerDashboardCharts from "@/components/penjual/SellerDashboardCharts";
import { supabase } from "@/lib/supabaseClient";
import Logo from "@/components/ui/Logo";

type SessionUser = {
  id: string;
  email: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

const getRole = (user?: SessionUser | null) =>
  (user?.user_metadata?.role as string | undefined) ||
  (user?.app_metadata?.role as string | undefined);

export default function SellerDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<SessionUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError("Gagal memeriksa sesi. Coba lagi.");
        setAuthChecking(false);
        return;
      }

      const session = data.session;
      const role = getRole(session?.user as SessionUser);

      if (!session || role !== "seller") {
        router.replace("/penjual/login");
        return;
      }

      if (mounted) {
        setUser(session.user as SessionUser);
        setAuthChecking(false);
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const role = getRole(session?.user as SessionUser);
      if (!session || event === "SIGNED_OUT" || role !== "seller") {
        router.replace("/penjual/login");
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(session.user as SessionUser);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [router, supabase]);

  const handleDownloadStokByStok = async () => {
    if (!user?.id) {
      setError("Session tidak ditemukan. Silakan login ulang.");
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      const response = await fetch(
        `/api/penjual/laporan/stok-by-stok?sellerId=${encodeURIComponent(user.id)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal download laporan");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Stok_${user.id}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsDownloading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0c0c0f] text-white flex items-center justify-center">
        Memeriksa sesi...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white">
      <header className="border-b border-[#1f1f1f] bg-[#060608]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo size="sm" variant="white" showText href="/" />
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <a
              href="/penjual/dashboard"
              className="rounded-lg border border-[#2a2a2a] px-3 py-2 font-semibold hover:border-[#0779FF]"
            >
              Dashboard
            </a>
            <a
              href="/penjual/upload-produk"
              className="rounded-lg border border-[#2a2a2a] px-3 py-2 font-semibold hover:border-[#0779FF]"
            >
              Upload Produk
            </a>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/penjual/login");
              }}
              className="rounded-lg border border-[#2a2a2a] px-3 py-2 font-semibold hover:border-red-500 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <section className="rounded-2xl border border-[#1f1f1f] bg-[#11111a] p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-gray-400">Seller ID</p>
              <p className="text-lg font-semibold">{user?.id}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadStokByStok}
                disabled={isDownloading}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                  isDownloading ? "cursor-not-allowed bg-gray-600" : "bg-[#0779FF] hover:bg-[#0563cc]"
                }`}
              >
                {isDownloading ? "Mengunduh..." : "Download Laporan Stok"}
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </section>

        <section>
          {user?.id ? (
            <SellerDashboardCharts sellerId={user.id} />
          ) : (
            <p className="rounded-2xl border border-[#1f1f1f] bg-[#11111a] p-6 text-sm text-gray-400">
              Sesi tidak ditemukan. Silakan login ulang.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
