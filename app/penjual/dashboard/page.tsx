"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SellerDashboardCharts from "@/components/penjual/SellerDashboardCharts";
import { supabase } from "@/lib/supabaseClient";
import Logo from "@/components/ui/Logo";
import Footer from "@/components/layout/Footer";

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
  const [loggingOut, setLoggingOut] = useState(false);

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
        router.replace("/login");
        return;
      }

      if (mounted) {
        setUser(session.user as SessionUser);
        setAuthChecking(false);
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const role = getRole(session?.user as SessionUser);

        if (!session || event === "SIGNED_OUT" || role !== "seller") {
          router.replace("/login");
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setUser(session.user as SessionUser);
        }
      }
    );

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [router]);

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

      console.log("🔍 Session Debug:", {
        hasSession: !!session.data.session,
        hasToken: !!token,
        userId: session.data.session?.user?.id,
      });

      if (!token) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      const response = await fetch(
        `/api/penjual/laporan/stok-by-stok?sellerId=${encodeURIComponent(
          user.id
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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

  const handleDownloadStokMenipis = async () => {
    if (!user?.id) {
      setError("Session tidak ditemukan. Silakan login ulang.");
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      console.log("🔍 Session Debug (Stok Menipis):", {
        hasSession: !!session.data.session,
        hasToken: !!token,
        userId: session.data.session?.user?.id,
      });

      if (!token) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      const response = await fetch(
        `/api/penjual/laporan/stok-menipis?sellerId=${encodeURIComponent(
          user.id
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Gagal download laporan stok menipis"
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Stok_Menipis_${user.id}_${Date.now()}.pdf`;
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

  const handleDownloadStockRating = async () => {
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
        `/api/penjual/reports/stock-rating?sellerId=${encodeURIComponent(
          user.id
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal download laporan rating");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Rating_${user.id}_${Date.now()}.pdf`;
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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Logout:", err);
    } finally {
      window.location.href = "/login";
    }
  };

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-center">
          <Logo />
          <p className="mt-4">Memeriksa sesi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col text-white">
      <header className="bg-[#2a2a2a] text-white p-6 shadow-2xl border-b border-[#3a3a3a]">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <Logo size="lg" variant="white" showText={true} href="/" />
          <div className="hidden h-8 w-px bg-[#3a3a3a] md:block"></div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Seller Platform</h1>
            <p className="text-sm text-gray-400">Dashboard Penjual</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/penjual/dashboard"
              className="rounded-lg border border-transparent bg-[#0779FF] px-3 py-2 font-semibold text-white hover:bg-[#0669dd]"
            >
              Dashboard
            </Link>
            <Link
              href="/penjual/upload-produk"
              className="rounded-lg border border-[#3a3a3a] px-3 py-2 text-gray-200 hover:border-[#0779FF]"
            >
              Upload Produk
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-[#3a3a3a] px-3 py-2 text-gray-200 hover:border-red-500 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <div className="container mx-auto p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white">Dashboard</h2>
              <p className="text-gray-400">
                Pantau performa toko dan laporan terbaru.
              </p>
            </div>

            <div className="mb-6 rounded-xl border border-[#3a3a3a] bg-[#2a2a2a] p-6">
              <h2 className="mb-2 text-lg font-semibold">Seller ID</h2>
              <p className="font-mono text-sm text-gray-300">{user?.id}</p>
              <p className="mt-1 text-sm text-gray-400">{user?.email}</p>
            </div>

            {user?.id && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Laporan Stok Produk */}
                <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#3a3a3a] shadow-2xl flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Laporan Stok Produk
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Unduh laporan PDF stok produk berdasarkan urutan stok.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadStokByStok}
                    disabled={isDownloading}
                    className="rounded-lg bg-green-600 hover:bg-green-700 px-5 py-3 font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloading
                      ? "Mengunduh laporan..."
                      : "Download Laporan Stok"}
                  </button>
                </div>

                {/* Laporan Stok Menipis */}
                <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#3a3a3a] shadow-2xl flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Laporan Stok Menipis
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Daftar produk yang harus segera dipesan (stok &lt; 2).
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadStokMenipis}
                    disabled={isDownloading}
                    className="rounded-lg bg-yellow-600 hover:bg-yellow-700 px-5 py-3 font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloading
                      ? "Mengunduh laporan..."
                      : "Download Stok Menipis"}
                  </button>
                </div>

                {/* Laporan Rating Produk (SRS-MartPlace-13) */}
                <div className="bg-[#2a2a2a] p-6 rounded-xl border border-[#3a3a3a] shadow-2xl flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Laporan Rating Produk
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Daftar produk diurutkan berdasarkan rating (menurun).
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadStockRating}
                    disabled={isDownloading}
                    className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-3 font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloading ? "Mengunduh laporan..." : "Download Rating"}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-300">
                {error}
              </div>
            )}

            {user?.id ? (
              <SellerDashboardCharts sellerId={user.id} />
            ) : (
              <div className="rounded-xl border border-[#3a3a3a] bg-[#2a2a2a] p-8 text-center text-gray-300">
                Sesi tidak ditemukan. Silakan login ulang.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer variant="compact" />
    </div>
  );
}
