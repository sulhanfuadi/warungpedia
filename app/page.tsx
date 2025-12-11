"use client";

import { useEffect, useState, useCallback } from "react";
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
import Footer from "@/components/layout/Footer";

// --- Types ---
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
  rating?: {
    average: number;
    count: number;
  };
};

type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

// --- Icons (SVGs) ---
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const StarIcon = ({ filled }: { filled?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={filled ? "text-yellow-400" : "text-gray-500"}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const MapPinIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const StoreIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M2 7h20" />
    <path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

// --- Helper ---
const formatCurrency = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function HomePage() {
  // --- State ---
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth State
  const [currentUser, setCurrentUser] = useState<UserLike | null>(null);
  const [userRole, setUserRole] = useState<Role | undefined>(undefined);
  const [authChecking, setAuthChecking] = useState(true);

  // Filter State - Sesuai SRS-MartPlace-05
  const [qProduct, setQProduct] = useState(""); // Nama produk
  const [qStore, setQStore] = useState(""); // Nama toko
  const [qCategory, setQCategory] = useState(""); // Kategori produk
  const [qLocation, setQLocation] = useState(""); // Lokasi (kota/provinsi)

  // Toggle Pencarian Detail
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // --- Categories (Static) ---
  const categories = [
    "Elektronik",
    "Fashion",
    "Makanan",
    "Minuman",
    "Hobi",
    "Rumah Tangga",
  ];

  // --- Fetch Data ---
  const fetchData = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (qProduct) params.set("product", qProduct);
        if (qStore) params.set("store", qStore);
        if (qCategory) params.set("category", qCategory);
        if (qLocation) params.set("location", qLocation);
        params.set("page", page.toString());
        params.set("limit", "24");

        const res = await fetch(`/api/products/search?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat produk");

        setProducts(data.products || []);
        setPagination(data.pagination);

        // Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat produk");
      } finally {
        setLoading(false);
      }
    },
    [qProduct, qStore, qCategory, qLocation]
  );

  // Initial Fetch & Debounce Search (reset to page 1)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [qProduct, qStore, qCategory, qLocation]);

  // --- Auth Check ---
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

  // --- Derived State ---
  const dashboardPath = dashboardPathByRole(userRole);
  const displayName =
    ((currentUser?.user_metadata as Record<string, unknown>)
      ?.full_name as string) ||
    currentUser?.email ||
    "User";

  // Check if any filter is active
  const hasActiveFilters = qProduct || qStore || qCategory || qLocation;

  // Reset all filters
  const resetFilters = () => {
    setQProduct("");
    setQStore("");
    setQCategory("");
    setQLocation("");
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchData(page);
    }
  };

  // Generate page numbers for pagination UI
  const getPageNumbers = () => {
    const current = pagination.page;
    const total = pagination.totalPages;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current > 3) {
        pages.push("...");
      }

      // Show pages around current
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(total);
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
      {/* --- Navbar (Standar seperti halaman login) --- */}
      <header className="border-b border-[#2f2f2f] bg-[#121212]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <Logo size="md" variant="white" showText href="/" />
            <div className="hidden sm:flex flex-col leading-tight text-sm text-gray-300">
              <span className="font-semibold text-white">Warungpedia</span>
              <span className="text-xs text-gray-400">
                Katalog Produk UMKM Indonesia
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {authChecking ? (
              <div className="h-9 w-32 bg-[#2f2f2f] animate-pulse rounded-full"></div>
            ) : currentUser ? (
              <Link
                href={dashboardPath || "/"}
                className="flex items-center gap-2 rounded-full border border-[#2f2f2f] bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-gray-100 transition hover:border-[#0779FF]"
              >
                <div className="h-6 w-6 rounded-full bg-[#0779FF] text-white flex items-center justify-center text-xs font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {displayName}
                </span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-[#2f2f2f] bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-gray-100 transition hover:border-[#0779FF] hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/penjual/register"
                  className="rounded-full border border-[#0779FF] bg-[#0779FF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0669dd] hover:border-[#0669dd]"
                >
                  Daftar Penjual
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Hero Banner - Simplified */}
        <section className="mb-8 rounded-2xl overflow-hidden relative bg-gradient-to-r from-[#051e38] to-[#0a3a6b] border border-[#2f2f2f]">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(7,121,255,0.3),transparent_70%)]"></div>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-8 py-10 md:py-12">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-2xl md:text-4xl font-bold mb-3 text-white leading-tight">
                Katalog Produk <span className="text-[#0779FF]">UMKM</span>
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-md">
                Temukan berbagai produk berkualitas dari penjual UMKM terpercaya
                di seluruh Indonesia. Lihat ulasan dan rating dari pengunjung
                lain.
              </p>
            </div>
            {!currentUser && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/penjual/register"
                  className="bg-[#0779FF] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#0669dd] transition text-center text-sm"
                >
                  Mulai Berjualan
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Pencarian Produk - Sesuai SRS-MartPlace-05 */}
        <section className="mb-8 rounded-xl border border-[#2f2f2f] bg-[#121212] p-5">
          {/* Quick Search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <SearchIcon />
              </div>
              <input
                type="text"
                className="w-full rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:border-[#0779FF] focus:outline-none focus:ring-1 focus:ring-[#0779FF]"
                placeholder="Cari nama produk..."
                value={qProduct}
                onChange={(e) => setQProduct(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                showAdvancedSearch
                  ? "border-[#0779FF] bg-[#0779FF]/10 text-[#0779FF]"
                  : "border-[#2f2f2f] text-gray-300 hover:border-[#0779FF] hover:text-white"
              }`}
            >
              <span>Pencarian Detail</span>
              <span
                className={`transition-transform ${
                  showAdvancedSearch ? "rotate-180" : ""
                }`}
              >
                <ChevronDownIcon />
              </span>
            </button>
          </div>

          {/* Advanced Search - SRS-MartPlace-05 */}
          {showAdvancedSearch && (
            <div className="border-t border-[#2f2f2f] pt-4 mt-4">
              <p className="text-xs text-gray-400 mb-3">
                Cari berdasarkan nama toko, kategori produk, nama produk, dan
                lokasi toko (kabupaten/kota dan provinsi)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Nama Toko */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Nama Toko
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ketik nama toko..."
                      className="w-full rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#0779FF] focus:outline-none focus:ring-1 focus:ring-[#0779FF]"
                      value={qStore}
                      onChange={(e) => setQStore(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <StoreIcon />
                    </div>
                  </div>
                </div>

                {/* Kategori Produk */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Kategori Produk
                  </label>
                  <select
                    className="w-full rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#0779FF] focus:outline-none focus:ring-1 focus:ring-[#0779FF] appearance-none cursor-pointer"
                    value={qCategory}
                    onChange={(e) => setQCategory(e.target.value)}
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lokasi (Kota/Provinsi) */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Lokasi (Kota/Provinsi)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ketik kota atau provinsi..."
                      className="w-full rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#0779FF] focus:outline-none focus:ring-1 focus:ring-[#0779FF]"
                      value={qLocation}
                      onChange={(e) => setQLocation(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <MapPinIcon />
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="w-full rounded-lg border border-[#2f2f2f] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-300 hover:border-red-500/50 hover:text-red-400 transition"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Products Section */}
        <section>
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Produk Tersedia</h2>
              <p className="text-sm text-gray-400 mt-1">
                {hasActiveFilters
                  ? `Hasil pencarian: ${pagination.total} produk ditemukan`
                  : `Menampilkan ${pagination.total} produk dari katalog`}
              </p>
            </div>
            {pagination.total > 0 && (
              <div className="text-sm text-gray-400">
                Halaman {pagination.page} dari {pagination.totalPages}
              </div>
            )}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-80 rounded-xl bg-[#121212] border border-[#2f2f2f] animate-pulse"
                ></div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-900/20 p-6 text-center text-red-400 border border-red-900/50">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-[#2f2f2f] bg-[#121212]">
              <div className="text-6xl mb-4 opacity-50">📦</div>
              <h3 className="text-lg font-bold text-white mb-2">
                Produk tidak ditemukan
              </h3>
              <p className="text-gray-500 text-sm max-w-sm">
                Tidak ada produk yang sesuai dengan pencarian Anda. Coba kata
                kunci lain atau reset filter.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-4 rounded-lg border border-[#0779FF] px-4 py-2 text-sm font-medium text-[#0779FF] hover:bg-[#0779FF]/10 transition"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group flex flex-col rounded-xl border border-[#2f2f2f] bg-[#121212] shadow-lg transition hover:-translate-y-1 hover:border-[#0779FF] overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative aspect-square w-full bg-[#0a0a0a] overflow-hidden">
                      {product.main_photo_path ? (
                        <Image
                          src={product.main_photo_path}
                          alt={product.name}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-600">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-3">
                      <h3 className="line-clamp-2 text-sm font-medium text-white mb-1 group-hover:text-[#0779FF] transition-colors">
                        {product.name}
                      </h3>
                      <div className="mb-2 text-base font-bold text-white">
                        {formatCurrency(product.price)}
                      </div>

                      {/* Location & Store */}
                      <div className="mt-auto space-y-1">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPinIcon />
                          <span className="truncate">
                            {product.seller?.pic_city ||
                              "Lokasi tidak diketahui"}
                            {product.seller?.pic_province &&
                              `, ${product.seller.pic_province}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <StoreIcon />
                          <span className="truncate font-medium">
                            {product.seller?.store_name || "Toko"}
                          </span>
                        </div>
                      </div>

                      {/* Rating - Sesuai SRS-MartPlace-04 */}
                      <div className="mt-3 flex items-center gap-1 text-xs pt-2 border-t border-[#2f2f2f]">
                        <StarIcon
                          filled={
                            !!(
                              product.rating?.average &&
                              product.rating.average > 0
                            )
                          }
                        />
                        <span className="font-medium text-white">
                          {product.rating?.average
                            ? product.rating.average.toFixed(1)
                            : "0.0"}
                        </span>
                        <span className="text-gray-500">
                          ({product.rating?.count || 0} ulasan)
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Info */}
                  <div className="text-sm text-gray-400">
                    Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    dari {pagination.total} produk
                  </div>

                  {/* Pagination Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => goToPage(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      className="flex items-center justify-center w-10 h-10 rounded-lg border border-[#2f2f2f] bg-[#121212] text-gray-300 transition hover:border-[#0779FF] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#2f2f2f] disabled:hover:text-gray-300"
                      aria-label="Previous page"
                    >
                      <ChevronLeftIcon />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) => {
                        if (page === "...") {
                          return (
                            <span
                              key={`ellipsis-${index}`}
                              className="px-2 text-gray-500"
                            >
                              ...
                            </span>
                          );
                        }
                        const pageNum = page as number;
                        const isActive = pageNum === pagination.page;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                              isActive
                                ? "bg-[#0779FF] text-white border border-[#0779FF]"
                                : "border border-[#2f2f2f] bg-[#121212] text-gray-300 hover:border-[#0779FF] hover:text-white"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => goToPage(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="flex items-center justify-center w-10 h-10 rounded-lg border border-[#2f2f2f] bg-[#121212] text-gray-300 transition hover:border-[#0779FF] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#2f2f2f] disabled:hover:text-gray-300"
                      aria-label="Next page"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer variant="full" className="mt-12" />
    </div>
  );
}
