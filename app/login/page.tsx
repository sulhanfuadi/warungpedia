"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Tambahkan import Link
import Logo from "@/components/ui/Logo";
import { supabase } from "@/lib/supabaseClient";
import {
  dashboardPathByRole,
  inferRole,
  type Role,
  type UserLike,
} from "@/lib/auth/roles";
import Footer from "@/components/layout/Footer";

const redirectByRole = (
  role: Role | undefined,
  router: ReturnType<typeof useRouter>
) => {
  const destination = dashboardPathByRole(role);
  if (destination) {
    router.replace(destination);
  }
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      const role = inferRole(data.session?.user as UserLike);
      if (data.session && role) {
        redirectByRole(role, router);
        return;
      }
      if (active) setAuthChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const role = inferRole(session?.user as UserLike);
        if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && role) {
          redirectByRole(role, router);
        }
        if (event === "SIGNED_OUT") {
          setAuthChecking(false);
        }
      }
    );

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, [router]);

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

      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("Tidak dapat mengambil data pengguna");
      }

      const role = inferRole(userData.user as UserLike);
      if (!role) {
        await supabase.auth.signOut();
        throw new Error("Akun belum memiliki role admin atau seller.");
      }

      redirectByRole(role, router);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login gagal. Periksa email/password Anda."
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <Logo size="md" variant="white" showText href="/" />
            <div className="hidden sm:flex flex-col leading-tight text-sm text-gray-300">
              <span className="font-semibold text-white">
                Masuk ke Warungpedia
              </span>
              <span className="text-xs text-gray-400">
                Akses dashboard admin & penjual
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Menggunakan Link agar navigasi smooth tanpa reload */}
            <Link
              href="/"
              className="rounded-full border border-[#2f2f2f] bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-gray-100 transition hover:border-[#0779FF] hover:text-white"
            >
              Ke Beranda
            </Link>
            <Link
              href="/penjual/register"
              className="rounded-full border border-[#0779FF] bg-[#0779FF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0669dd] hover:border-[#0669dd]"
            >
              Daftar Penjual
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl justify-center px-6 py-14">
        <div className="w-full max-w-md rounded-2xl border border-[#2f2f2f] bg-[#121212] p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white">Login</h1>
            <p className="mt-2 text-sm text-gray-400">
              Gunakan akun Anda. Admin akan diarahkan ke dashboard admin, seller
              ke dashboard penjual.
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
                placeholder="email@domain.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] px-4 py-3 pr-12 text-white placeholder-gray-500 focus:border-[#0779FF] focus:outline-none focus:ring-1 focus:ring-[#0779FF]"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  )}
                </button>
              </div>
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

          {/* Update teks footer agar mengarah ke register */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Belum punya akun penjual?{" "}
            <Link
              href="/penjual/register"
              className="font-medium text-[#0779FF] hover:text-[#0669dd] hover:underline"
            >
              Daftar di sini
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <Footer variant="minimal" />
    </div>
  );
}
