"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Logo from "@/components/ui/Logo";
import Link from "next/link";

export default function SellerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Login via Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Login gagal. User tidak ditemukan.");
      }

      // Check if user is seller
      const { data: sellerData, error: sellerError } = await supabase
        .from("sellers")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (sellerError || !sellerData) {
        // User bukan penjual, logout
        await supabase.auth.signOut();
        throw new Error("Akses ditolak. Akun penjual tidak ditemukan.");
      }

      // Check status
      if (sellerData.status !== "ACTIVE") {
        await supabase.auth.signOut();
        throw new Error(
          `Akun Anda berstatus ${sellerData.status}. Silakan hubungi admin.`
        );
      }

      // Redirect ke dashboard penjual
      router.push("/penjual/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <Logo size="xl" variant="white" showText={true} href="/" />
          <h1 className="text-3xl font-bold text-white mt-6 mb-2">
            Login Penjual
          </h1>
          <p className="text-gray-400">
            Akses dashboard toko Anda di Warungpedia
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#2a2a2a] rounded-2xl shadow-2xl p-8 border border-[#3a3a3a]">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block mb-2 font-medium text-white">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-4 bg-[#1a1a1a] border-2 border-[#3a3a3a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent transition-all"
                placeholder="email@contoh.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block mb-2 font-medium text-white">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-4 bg-[#1a1a1a] border-2 border-[#3a3a3a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent transition-all"
                placeholder="Masukkan password"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0779FF] hover:bg-[#0669dd] text-white px-8 py-4 rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Login...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Belum punya akun?{" "}
              <Link
                href="/penjual/register"
                className="text-[#0779FF] hover:underline font-semibold"
              >
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          © 2025 Warungpedia. All rights reserved.
        </p>
      </div>
    </div>
  );
}
