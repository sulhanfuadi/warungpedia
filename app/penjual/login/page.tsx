"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { supabase } from "@/lib/supabaseClient";

export default function SellerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const adminEmails = [
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@warungpedia.id",
  ];

  const extractRole = (
    session: unknown,
  ): { role?: string; email?: string } => {
    if (!session || typeof session !== "object") return {};
    const s = session as {
      user?: {
        email?: string;
        user_metadata?: Record<string, unknown>;
        app_metadata?: Record<string, unknown>;
      };
    };
    const role =
      (s.user?.user_metadata?.role as string | undefined) ||
      (s.user?.app_metadata?.role as string | undefined);
    return { role, email: s.user?.email };
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      const { role, email } = extractRole(data.session);
      if (data.session && role === "seller") {
        router.replace("/penjual/upload-produk");
        return;
      }
      if (data.session && (role === "admin" || (email && adminEmails.includes(email)))) {
        supabase.auth.signOut();
        if (active) setInfo("Anda sebelumnya login sebagai admin. Silakan login sebagai seller.");
      }
      if (active) setAuthChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const { role, email } = extractRole({ user: session?.user });
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (role === "seller") {
          router.replace("/penjual/upload-produk");
        } else if (role === "admin" || (email && adminEmails.includes(email))) {
          supabase.auth.signOut();
          setError("Akun ini admin, bukan seller.");
        } else {
          router.replace("/penjual/upload-produk");
        }
      }
    });

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("Tidak dapat mengambil data pengguna");
      }
      const { role, email: userEmail } = extractRole({ user: userData.user });

      if (role === "admin" || (userEmail && adminEmails.includes(userEmail))) {
        await supabase.auth.signOut();
        throw new Error("Akun ini admin, bukan seller.");
      }

      if (role && role !== "seller") {
        await supabase.auth.signOut();
        throw new Error("Akun ini bukan seller. Gunakan akun penjual untuk login.");
      }

      router.replace("/penjual/upload-produk");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login gagal. Periksa email/password Anda.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-white">
        Memeriksa sesi...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <header className="border-b border-[#2f2f2f] bg-[#121212]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Logo size="md" variant="white" showText href="/" />
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl justify-center px-6 py-14">
        <div className="w-full max-w-md rounded-2xl border border-[#2f2f2f] bg-[#121212] p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white">Login Penjual</h1>
            <p className="mt-2 text-sm text-gray-400">
              Masuk untuk mengelola dan mengunggah produk.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {info && (
              <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                {info}
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm text-gray-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] px-4 py-3 text-white placeholder-gray-500 focus:border-[#0779FF] focus:outline-none focus:ring-1 focus:ring-[#0779FF]"
                placeholder="email@toko.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-gray-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] px-4 py-3 text-white placeholder-gray-500 focus:border-[#0779FF] focus:outline-none focus:ring-1 focus:ring-[#0779FF]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#0779FF] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0669dd] disabled:cursor-not-allowed disabled:bg-[#3a3a3a]"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Belum punya akun? Hubungi admin untuk pendaftaran penjual.
          </p>
        </div>
      </main>
    </div>
  );
}
