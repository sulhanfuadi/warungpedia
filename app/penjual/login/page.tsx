"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { supabase } from "@/lib/supabaseClient";

export default function SellerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      window.location.href = "/penjual/upload-produk";
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

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <header className="border-b border-[#2f2f2f] bg-[#121212]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Logo size="md" variant="white" showText href="/" />
          <Link
            href="/penjual/upload-produk"
            className="text-sm text-[#0779FF] hover:underline"
          >
            Upload Produk
          </Link>
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
