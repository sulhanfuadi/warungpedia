"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SellerDashboardCharts from "@/components/penjual/SellerDashboardCharts";
import { supabase } from "@/lib/supabaseClient";
import Logo from "@/components/ui/Logo";

type SessionUser = {
  id: string;
  email: string | null;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
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

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const role = getRole(session?.user as SessionUser);

        if (!session || event === "SIGNED_OUT" || role !== "seller") {
          router.replace("/penjual/login");
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
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/penjual/upload")}
              className="rounded-lg border border-[#2a2a2a] px-4 py-2 font-semibold hover:border-blue-500 hover:text-blue-300"
            >
              Upload Produk
            </button>
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

        <div className="mb-6 rounded-lg border border-[#2a2a2a] bg-[#111111] p-4">
          <h2 className="mb-2 text-lg font-semibold">Seller ID</h2>
          <p className="font-mono text-sm text-gray-400">{user?.id}</p>
          <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
        </div>

        {user?.id && (
          <div className="mb-6 rounded-lg border border-[#2a2a2a] bg-[#111111] p-4">
            <h2 className="mb-4 text-lg font-semibold">📊 Laporan Penjual</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadStokByStok}
                disabled={isDownloading}
                className="rounded-lg border border-[#2a2a2a] px-4 py-2 font-semibold hover:border-green-500 hover:text-green-300 disabled:opacity-50"
              >
                {isDownloading
                  ? "⏳ Generating..."
                  : "📥 Download Laporan Stok (Urut Stok)"}
              </button>
              <button
                onClick={handleDownloadStokMenipis}
                disabled={isDownloading}
                className="rounded-lg border border-[#2a2a2a] px-4 py-2 font-semibold hover:border-yellow-500 hover:text-yellow-300 disabled:opacity-50"
              >
                {isDownloading
                  ? "⏳ Generating..."
                  : "⚠️ Download Laporan Stok Menipis (< 2)"}
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
          <div className="rounded-lg border border-[#2a2a2a] bg-[#111111] p-8 text-center">
            Sesi tidak ditemukan. Silakan login ulang.
          </div>
        )}
      </div>
    </div>
  );
}
