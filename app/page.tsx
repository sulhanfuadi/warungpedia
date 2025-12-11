"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/ui/Logo";
import { supabase } from "@/lib/supabaseClient";
import {
  dashboardPathByRole,
  inferRole,
  type Role,
  type UserLike,
} from "@/lib/auth/roles";

type ProductCard = {
  id: string;
  name: string;
  category: string;
  price: number;
  main_photo_path: string;
  specifications: Record<string, string>;
  seller?: {
    store_name?: string;
    pic_city?: string;
    pic_province?: string;
  };
  product_variants?: { id: string; option_group: string; name: string }[];
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function HomePage() {
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserLike | null>(null);
  const [userRole, setUserRole] = useState<Role | undefined>(undefined);

  const [qProduct, setQProduct] = useState("");
  const [qStore, setQStore] = useState("");
  const [qCategory, setQCategory] = useState("");
  const [qLocation, setQLocation] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (qProduct) params.set("product", qProduct);
      if (qStore) params.set("store", qStore);
      if (qCategory) params.set("category", qCategory);
      if (qLocation) params.set("location", qLocation);

      const res = await fetch(`/api/products/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat produk");
      setProducts(data.products || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;

    const syncSession = (sessionUser?: UserLike | null) => {
      if (!active) return;
      const normalizedUser = sessionUser ?? null;
      setCurrentUser(normalizedUser);
      setUserRole(inferRole(normalizedUser));
      setAuthChecking(false);
    };

    supabase.auth.getSession().then(({ data }) => {
      syncSession((data.session?.user as UserLike) || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        syncSession((session?.user as UserLike) || null);
      }
    );

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const activeFilters = useMemo(
    () => qProduct || qStore || qCategory || qLocation,
    [qProduct, qStore, qCategory, qLocation]
  );

  const getMetaString = (key: string) => {
    const meta = currentUser?.user_metadata as Record<string, unknown> | null;
    const value = meta?.[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    }
    return undefined;
  };

  const displayName =
    getMetaString("full_name") ||
    getMetaString("name") ||
    currentUser?.email ||
    "Akun Anda";
  const avatarUrl = getMetaString("avatar_url");
  const avatarInitial = (displayName || "P").charAt(0).toUpperCase();
  const dashboardPath = dashboardPathByRole(userRole);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <header className="border-b border-[#2f2f2f] bg-[#121212]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo size="md" variant="white" showText href="/" />
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>
              Jelajahi produk UMKM • Cari nama produk, toko, kategori, atau
              lokasi
            </span>
            {authChecking ? (
              <div className="h-10 w-24 animate-pulse rounded-full bg-[#1f1f1f]" />
            ) : currentUser && dashboardPath ? (
              <Link
                href={dashboardPath}
                className="group flex items-center gap-3 rounded-full border border-[#2f2f2f] px-3 py-1.5 text-white transition hover:border-[#0779FF]"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={48}
                    height={48}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0779FF] text-sm font-semibold text-white">
                    {avatarInitial}
                  </div>
                )}
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold text-white">
                    {displayName}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                    {userRole === "admin" ? "Admin" : "Seller"}
                  </p>
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-[#2f2f2f] px-4 py-2 text-xs font-semibold text-white transition hover:border-[#0779FF] hover:text-[#0779FF]"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-2xl border border-[#2f2f2f] bg-[#0f0f0f] p-5 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <input
                value={qProduct}
                onChange={(e) => setQProduct(e.target.value)}
                placeholder="Nama produk"
                className="rounded-xl border border-[#2f2f2f] bg-[#161616] px-4 py-3 text-sm text-white placeholder-gray-500 transition focus:border-[#0779FF] focus:outline-none focus:ring-1 focus:ring-[#0779FF]"
                suppressHydrationWarning
              />
              <input
                value={qStore}
                onChange={(e) => setQStore(e.target.value)}
                placeholder="Nama toko"
                className="rounded-xl border border-[#2f2f2f] bg-[#161616] px-4 py-3 text-sm text-white placeholder-gray-500 transition focus:border-[#0779FF] focus:outline-none focus:ring-1 focus:ring-[#0779FF]"
                suppressHydrationWarning
              />
              <input
                value={qCategory}
                onChange={(e) => setQCategory(e.target.value)}
                placeholder="Kategori"
                className="rounded-xl border border-[#2f2f2f] bg-[#161616] px-4 py-3 text-sm text-white placeholder-gray-500 transition focus:border-[#0779FF] focus:outline-none focus:ring-1 focus:ring-[#0779FF]"
                suppressHydrationWarning
              />
              <input
                value={qLocation}
                onChange={(e) => setQLocation(e.target.value)}
                placeholder="Lokasi (kota/provinsi)"
                className="rounded-xl border border-[#2f2f2f] bg-[#161616] px-4 py-3 text-sm text-white placeholder-gray-500 transition focus:border-[#0779FF] focus:outline-none focus:ring-1 focus:ring-[#0779FF]"
                suppressHydrationWarning
              />
            </div>
            <div className="flex gap-3 lg:w-auto">
              <button
                onClick={fetchData}
                className="rounded-full bg-[#0779FF] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#0669dd]"
                suppressHydrationWarning
              >
                Cari
              </button>
              {activeFilters && (
                <button
                  onClick={() => {
                    setQProduct("");
                    setQStore("");
                    setQCategory("");
                    setQLocation("");
                    fetchData();
                  }}
                  className="rounded-full border border-[#2f2f2f] px-5 py-3 text-sm text-gray-300 transition hover:border-[#0779FF]"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-8 text-center text-gray-400">Memuat produk...</div>
        )}
        {error && (
          <div className="mt-8 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {!loading &&
            !error &&
            products.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="group rounded-2xl border border-[#2f2f2f] bg-[#121212] p-4 shadow-lg transition hover:border-[#0779FF]"
              >
                <div className="overflow-hidden rounded-xl border border-[#2f2f2f] bg-[#111]">
                  <Image
                    src={p.main_photo_path}
                    alt={p.name}
                    width={600}
                    height={400}
                    className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <span className="rounded-full bg-[#1f1f1f] px-2 py-1 text-[#0779FF]">
                    {p.category}
                  </span>
                  {p.seller?.pic_city && (
                    <span className="rounded-full bg-[#1f1f1f] px-2 py-1 text-gray-300">
                      {p.seller.pic_city}
                      {p.seller.pic_province
                        ? `, ${p.seller.pic_province}`
                        : ""}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-white">
                  {p.name}
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  {p.seller?.store_name || "Toko"}
                </p>
                <p className="mt-2 text-xl font-bold text-[#0779FF]">
                  {formatCurrency(p.price)}
                </p>
                {p.product_variants && p.product_variants.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.product_variants.slice(0, 4).map((v) => (
                      <span
                        key={v.id}
                        className="rounded-full border border-[#2f2f2f] bg-[#1a1a1a] px-2 py-1 text-xs text-gray-300"
                      >
                        {v.option_group
                          ? `${v.option_group}: ${v.name}`
                          : v.name}
                      </span>
                    ))}
                    {p.product_variants.length > 4 && (
                      <span className="rounded-full border border-[#2f2f2f] bg-[#1a1a1a] px-2 py-1 text-xs text-gray-400">
                        +{p.product_variants.length - 4} varian
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
        </div>
        {!loading && !error && products.length === 0 && (
          <div className="mt-8 text-center text-gray-400">
            Tidak ada produk dengan filter saat ini.
          </div>
        )}
      </main>
    </div>
  );
}
