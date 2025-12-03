"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { useParams } from "next/navigation";
import ProductFeedbackSection from "@/components/products/ProductFeedbackSection";

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  condition: "BARU" | "BEKAS";
  specifications: Record<string, string>;
  main_photo_path: string;
  gallery_photos?: string[];
  product_variants?: Variant[];
  seller?: {
    store_name?: string;
    pic_city?: string;
    pic_province?: string;
  };
};

type Variant = {
  id: string;
  option_group: string;
  name: string;
  price: number | null;
  stock: number;
  image_path?: string | null;
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat produk");
        const seller = data.sellers?.[0] || data.sellers || data.seller;
        setProduct({ ...data, seller, product_variants: data.product_variants || [] });

        const defaults: Record<string, string> = {};
        (data.product_variants || []).forEach((v: Variant) => {
          if (!defaults[v.option_group]) defaults[v.option_group] = v.name;
        });
        setSelected(defaults);
        setSelectedImage(data.main_photo_path || null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat produk");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const isValid = (src: unknown) =>
      typeof src === "string" && src.trim().length > 0;
    const thumbs = (product.gallery_photos || []).filter(isValid);
    const variantImages =
      product.product_variants
        ?.map((v) => v.image_path)
        .filter(isValid) || [];
    const merged = [product.main_photo_path, ...thumbs, ...variantImages] as string[];
    const unique = merged.filter((src, idx) => isValid(src) && merged.indexOf(src) === idx);
    return unique.slice(0, 3); // tampilkan maksimal 3 gambar (main + 2 lainnya)
  }, [product]);

  const groupedVariants = useMemo(() => {
    const groups: Record<string, Variant[]> = {};
    (product?.product_variants || []).forEach((v) => {
      if (!groups[v.option_group]) groups[v.option_group] = [];
      groups[v.option_group].push(v);
    });
    return groups;
  }, [product]);

  const activeVariantImage = useMemo(() => {
    if (!product) return null;
    for (const group in selected) {
      const found = (product.product_variants || []).find(
        (v) => v.option_group === group && v.name === selected[group],
      );
      if (found?.image_path) return found.image_path;
    }
    return null;
  }, [product, selected]);

  const activePrice = useMemo(() => {
    if (!product) return 0;
    for (const group in selected) {
      const found = (product.product_variants || []).find(
        (v) => v.option_group === group && v.name === selected[group] && v.price,
      );
      if (found?.price) return found.price;
    }
    return product.price;
  }, [product, selected]);

  const activeStock = useMemo(() => {
    if (!product) return 0;
    for (const group in selected) {
      const found = (product.product_variants || []).find(
        (v) => v.option_group === group && v.name === selected[group],
      );
      if (found) return found.stock;
    }
    return product.stock;
  }, [product, selected]);

  const locationText = useMemo(() => {
    const city = product?.seller?.pic_city;
    const prov = product?.seller?.pic_province;
    return city || prov ? [city, prov].filter(Boolean).join(", ") : "Lokasi tidak tersedia";
  }, [product]);
  const sellerName = product?.seller?.store_name || "Nama Toko";
  const ratingText = "4.8 (156 ulasan)";
  const primaryImage = gallery[0] || product?.main_photo_path || "";

  if (!id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fa] text-gray-600">
        Memuat...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6fa] text-gray-600">
        Memuat produk...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f6fa] text-gray-700">
        <p className="text-lg font-semibold">Gagal memuat produk</p>
        <p className="text-sm text-gray-500">{error}</p>
        <Link href="/" className="mt-4 text-[#0779FF] hover:underline">
          Kembali
        </Link>
      </div>
    );
  }

  const displayImage =
    (selectedImage && gallery.includes(selectedImage) && selectedImage) ||
    (activeVariantImage && gallery.includes(activeVariantImage) && activeVariantImage) ||
    primaryImage;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <header className="border-b border-[#2f2f2f] bg-[#121212]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo size="md" variant="white" showText href="/" />
          <nav className="text-sm text-gray-400">
            <Link href="/" className="hover:text-[#0779FF]">
              Beranda
            </Link>{" "}
            / <span className="text-gray-200">{product.name}</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 lg:flex-row">
        {/* Left: gallery + info */}
        <div className="w-full lg:w-2/3">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-[#2f2f2f] bg-[#111] shadow-lg">
                <Image
                  src={displayImage}
                  alt={product.name}
                  width={800}
                  height={600}
                  className="h-[420px] w-full object-cover md:h-[520px]"
                  onError={() => setSelectedImage(primaryImage)}
                />
              </div>
              {gallery.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {gallery.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(src)}
                      className={`overflow-hidden rounded-lg border ${
                        displayImage === src ? "border-[#0779FF]" : "border-[#2f2f2f]"
                      } bg-[#111] shadow-sm`}
                    >
                      <Image
                        src={src}
                        alt={`thumb-${idx}`}
                        width={96}
                        height={96}
                        className="h-20 w-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-semibold text-white">{product.name}</h1>
                <p className="mt-2 text-3xl font-bold text-[#0779FF]">
                  Rp{activePrice.toLocaleString("id-ID")}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-300">
                  <span className="rounded-full bg-[#111] px-3 py-1 font-semibold text-white">
                    {sellerName}
                  </span>
                  <span className="rounded-full border border-[#2f2f2f] bg-[#1a1a1a] px-3 py-1">
                    {locationText}
                  </span>
                  <span className="rounded-full border border-[#2f2f2f] bg-[#1a1a1a] px-3 py-1">
                    ⭐ {ratingText}
                  </span>
                </div>
              </div>

              {Object.keys(groupedVariants).map((group) => (
                <div key={group} className="space-y-2">
                  <p className="text-sm font-semibold text-gray-200">
                    Pilih {group}
                    {selected[group] ? `: ${selected[group]}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {groupedVariants[group].map((v) => {
                      const active = selected[group] === v.name;
                      const disabled = v.stock <= 0;
                      return (
                        <button
                          key={v.id}
                          disabled={disabled}
                          onClick={() =>
                            setSelected((prev) => {
                              if (v.image_path) {
                                setSelectedImage(v.image_path);
                              } else {
                                setSelectedImage(null);
                              }
                              return { ...prev, [group]: v.name };
                            })
                          }
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            active
                              ? "border-[#0779FF] bg-[#0b2b52] text-white"
                              : "border-[#3a3a3a] bg-[#1a1a1a] text-gray-200 hover:border-[#0779FF]"
                          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          {v.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-200">Stok</p>
                <p className="text-gray-300">
                  {activeStock > 0 ? (
                    <span className="text-green-400">Sisa {activeStock}</span>
                  ) : (
                    <span className="text-red-400">Habis</span>
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-[#2f2f2f] bg-[#1f1f1f] p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Kondisi</span>
                  <span className="text-sm font-semibold text-white">
                    {product.condition === "BARU" ? "Baru" : "Bekas"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-400">Kategori</span>
                  <span className="text-sm font-semibold text-[#0779FF]">{product.category}</span>
                </div>
              </div>

              <div className="rounded-xl border border-[#2f2f2f] bg-[#1f1f1f] p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-white">Deskripsi</h3>
                <p className="text-sm leading-6 text-gray-300">
                  {product.description || "Belum ada deskripsi."}
                </p>
                {product.specifications && (
                  <div className="mt-4 space-y-2 text-sm text-gray-300">
                    {Object.entries(product.specifications).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-gray-500">{k}</span>
                        <span className="font-medium text-white">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: purchase card */}
        <aside className="w-full lg:w-1/3">
          <div className="rounded-xl border border-[#2f2f2f] bg-[#1f1f1f] p-5 shadow-md">
            <div className="mb-4 flex items-start gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-lg border border-[#2f2f2f] bg-[#111]">
                <Image
                  src={displayImage}
                  alt={product.name}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{product.name}</p>
                <p className="text-xs text-gray-400">
                  {Object.values(selected).filter(Boolean).join(", ") || "Pilih varian"}
                </p>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-400">Jumlah</span>
              <div className="flex items-center rounded-full border border-[#2f2f2f] bg-[#121212]">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-white hover:text-[#0779FF]"
                  disabled={qty <= 1}
                >
                  -
                </button>
                <span className="px-3 text-sm font-semibold text-white">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-3 py-2 text-white hover:text-[#0779FF]"
                  disabled={activeStock > 0 ? qty >= activeStock : false}
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-400">Subtotal</span>
              <span className="text-xl font-bold text-[#0779FF]">
                Rp{(activePrice * qty).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </aside>
      </main>

      <section className="mx-auto mt-6 max-w-6xl px-6 pb-10">
        <ProductFeedbackSection productId={id} />
      </section>
    </div>
  );
}
