"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { supabase } from "@/lib/supabaseClient";
import Footer from "@/components/layout/Footer";

type Condition = "BARU" | "BEKAS";

interface SpecRow {
  key: string;
  value: string;
}

interface VariantRow {
  optionGroup: string;
  name: string;
  price: string;
  stock: string;
  image: File | null;
  preview: string | null;
}

const CONDITION_OPTIONS: Condition[] = ["BARU", "BEKAS"];

export default function UploadProdukPage() {
  const router = useRouter();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [condition, setCondition] = useState<Condition>("BARU");
  const [specs, setSpecs] = useState<SpecRow[]>([{ key: "", value: "" }]);
  const [mainPhoto, setMainPhoto] = useState<File | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<File[]>([]);
  const [mainPreview, setMainPreview] = useState<string | null>(null);
  const [galleryPreview, setGalleryPreview] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const role =
          (data.session?.user.user_metadata as Record<string, unknown>)?.role ||
          (data.session?.user.app_metadata as Record<string, unknown>)?.role;
        const email = data.session?.user.email;
        const adminEmails = [
          process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@warungpedia.id",
        ];
        if (!data.session) {
          router.replace("/login");
          return;
        }
        if (role === "admin" || (email && adminEmails.includes(email))) {
          supabase.auth.signOut();
          router.replace("/login");
          return;
        }
        if (active) setSellerId(data.session.user?.id ?? null);
      })
      .catch(() => {
        if (active) router.replace("/login");
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const role =
          (session?.user.user_metadata as Record<string, unknown>)?.role ||
          (session?.user.app_metadata as Record<string, unknown>)?.role;
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          const email = session?.user.email;
          const adminEmails = [
            process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@warungpedia.id",
          ];
          if (role === "admin" || (email && adminEmails.includes(email))) {
            supabase.auth.signOut();
            router.replace("/login");
            return;
          }
          setSellerId(session?.user?.id ?? null);
        }
        if (event === "SIGNED_OUT") {
          setSellerId(null);
          router.replace("/login");
        }
      }
    );

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  const specsObject = useMemo(() => {
    const cleaned = specs
      .filter((row) => row.key.trim() && row.value.trim())
      .reduce<Record<string, string>>((acc, row) => {
        acc[row.key.trim()] = row.value.trim();
        return acc;
      }, {});
    return cleaned;
  }, [specs]);

  const handleMainPhotoChange = (file: File | null) => {
    setMainPhoto(file);
    setMainPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleGalleryChange = (files: FileList | null) => {
    if (!files) return;
    const asArray = Array.from(files);
    setGalleryPhotos(asArray);
    setGalleryPreview(asArray.map((f) => URL.createObjectURL(f)));
  };

  const handleAddSpec = () =>
    setSpecs((prev) => [...prev, { key: "", value: "" }]);

  const handleSpecChange = (
    idx: number,
    field: "key" | "value",
    value: string
  ) => {
    setSpecs((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleVariantChange = (
    idx: number,
    field: keyof Omit<VariantRow, "image" | "preview">,
    value: string
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    );
  };

  const handleVariantImage = (idx: number, file: File | null) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === idx
          ? {
              ...v,
              image: file,
              preview: file ? URL.createObjectURL(file) : null,
            }
          : v
      )
    );
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        optionGroup: prev[0]?.optionGroup || "opsi",
        name: "",
        price: "",
        stock: "0",
        image: null,
        preview: null,
      },
    ]);
  };

  const handleRemoveVariant = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    if (!sellerId) return "Silakan login sebagai penjual terlebih dahulu.";
    if (!name.trim()) return "Nama produk wajib diisi.";
    if (!category.trim()) return "Kategori wajib diisi.";
    if (!price || Number(price) < 0) return "Harga tidak valid.";
    if (!stock || Number.isNaN(Number(stock))) return "Stok tidak valid.";
    if (!mainPhoto) return "Foto utama wajib diunggah.";
    const activeVariants = variants.filter(
      (v) =>
        v.optionGroup.trim() ||
        v.name.trim() ||
        v.price.trim() ||
        v.stock.trim() ||
        v.image
    );
    for (const v of activeVariants) {
      if (!v.optionGroup.trim() || !v.name.trim()) {
        return "Setiap varian yang diisi perlu option group dan nama.";
      }
      if (v.price && Number(v.price) < 0) return "Harga varian tidak valid.";
      if (v.stock && Number.isNaN(Number(v.stock)))
        return "Stok varian tidak valid.";
    }
    return null;
  };

  const handleSubmit = async () => {
    setMessage(null);
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setError("Silakan login sebagai seller untuk mengunggah produk.");
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("sellerId", sellerId as string);
      formData.append("name", name);
      formData.append("category", category);
      if (description) formData.append("description", description);
      formData.append("price", price);
      formData.append("stock", stock);
      formData.append("condition", condition);
      formData.append("specifications", JSON.stringify(specsObject));

      if (mainPhoto) {
        formData.append("mainPhoto", mainPhoto);
      }

      galleryPhotos.forEach((file) => {
        formData.append("galleryPhotos", file);
      });

      const activeVariants = variants.filter(
        (v) =>
          v.optionGroup.trim() ||
          v.name.trim() ||
          v.price.trim() ||
          v.stock.trim() ||
          v.image
      );
      const variantsPayload = activeVariants.map((v, idx) => ({
        option_group: v.optionGroup,
        name: v.name,
        price: v.price ? Number(v.price) : null,
        stock: v.stock ? Number(v.stock) : 0,
        imageKey: `variantImage_${idx}`,
      }));
      if (variantsPayload.length > 0) {
        formData.append("variants", JSON.stringify(variantsPayload));
      }
      activeVariants.forEach((v, idx) => {
        if (v.image) {
          formData.append(`variantImage_${idx}`, v.image);
        }
      });

      const res = await fetch("/api/penjual/products", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah produk");
      }

      setMessage("Produk berhasil diunggah.");
      setName("");
      setCategory("");
      setDescription("");
      setPrice("");
      setStock("0");
      setCondition("BARU");
      setSpecs([{ key: "", value: "" }]);
      setMainPhoto(null);
      setGalleryPhotos([]);
      setMainPreview(null);
      setGalleryPreview([]);
      setVariants([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah produk");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <header className="border-b border-[#2f2f2f] bg-[#121212]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo size="lg" variant="white" showText href="/" />
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span>Upload Produk</span>
            <button
              onClick={() => router.push("/penjual/dashboard")}
              className="rounded-full border border-[#2f2f2f] px-4 py-2 text-xs font-semibold text-white transition hover:border-[#0779FF] hover:text-[#0779FF]"
            >
              Kembali ke Dashboard
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/login");
              }}
              className="rounded-full border border-[#2f2f2f] px-4 py-2 text-xs font-semibold text-white transition hover:border-red-500 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row">
        <section className="w-full lg:w-1/2">
          <div className="rounded-2xl border border-[#2f2f2f] bg-[#1f1f1f] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Preview Produk</h2>
              <span className="rounded-full bg-[#0779FF] px-3 py-1 text-xs font-semibold text-white">
                Realtime
              </span>
            </div>
            <div className="grid gap-4">
              <div className="aspect-square w-full overflow-hidden rounded-xl border border-[#2f2f2f] bg-[#131313]">
                {mainPreview ? (
                  <Image
                    src={mainPreview}
                    alt="Preview utama"
                    width={640}
                    height={640}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    Foto utama belum dipilih
                  </div>
                )}
              </div>
              {galleryPreview.length > 0 && (
                <div className="grid grid-cols-5 gap-3">
                  {galleryPreview.map((src, idx) => (
                    <div
                      key={idx}
                      className="aspect-square overflow-hidden rounded-lg border border-[#2f2f2f] bg-[#131313]"
                    >
                      <Image
                        src={src}
                        alt={`Gallery ${idx + 1}`}
                        width={200}
                        height={200}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2 text-sm text-gray-400">
                <p className="font-semibold text-white">Nama Produk</p>
                <p>{name || "Belum diisi"}</p>
                <p className="font-semibold text-white">Harga</p>
                <p>
                  {price
                    ? `Rp${Number(price).toLocaleString("id-ID")}`
                    : "Belum diisi"}
                </p>
                <p className="font-semibold text-white">Kondisi</p>
                <p>{condition === "BARU" ? "Baru" : "Bekas"}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full lg:w-1/2">
          <div className="rounded-2xl border border-[#2f2f2f] bg-[#1f1f1f] p-6 shadow-2xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Form Upload Produk</h1>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Nama Produk*</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-[#2f2f2f] bg-[#121212] px-4 py-3 text-white focus:border-[#0779FF] focus:outline-none"
                    placeholder="Contoh: Kopi Robusta 500gr"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Kategori*</label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-[#2f2f2f] bg-[#121212] px-4 py-3 text-white focus:border-[#0779FF] focus:outline-none"
                    placeholder="Contoh: Minuman"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Harga (Rp)*</label>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-lg border border-[#2f2f2f] bg-[#121212] px-4 py-3 text-white focus:border-[#0779FF] focus:outline-none"
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Stok*</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full rounded-lg border border-[#2f2f2f] bg-[#121212] px-4 py-3 text-white focus:border-[#0779FF] focus:outline-none"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300">Kondisi*</label>
                <div className="flex gap-3">
                  {CONDITION_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setCondition(opt)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        condition === opt
                          ? "border-[#0779FF] bg-[#0b2b52] text-white"
                          : "border-[#2f2f2f] bg-[#121212] text-gray-300 hover:border-[#0779FF]"
                      }`}
                    >
                      {opt === "BARU" ? "Baru" : "Bekas"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300">Deskripsi</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-[#2f2f2f] bg-[#121212] px-4 py-3 text-white focus:border-[#0779FF] focus:outline-none"
                  placeholder="Ceritakan detail produk..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-gray-300">
                      Spesifikasi (JSON)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="rounded-lg border border-[#2f2f2f] px-3 py-2 text-sm text-white hover:border-[#0779FF]"
                  >
                    Tambah Baris
                  </button>
                </div>
                <div className="space-y-2">
                  {specs.map((row, idx) => (
                    <div key={idx} className="flex gap-3">
                      <input
                        value={row.key}
                        onChange={(e) =>
                          handleSpecChange(idx, "key", e.target.value)
                        }
                        placeholder="Kunci (contoh: Berat)"
                        className="w-1/2 rounded-lg border border-[#2f2f2f] bg-[#121212] px-3 py-2 text-sm text-white focus:border-[#0779FF] focus:outline-none"
                      />
                      <input
                        value={row.value}
                        onChange={(e) =>
                          handleSpecChange(idx, "value", e.target.value)
                        }
                        placeholder="Nilai (contoh: 500gr)"
                        className="w-1/2 rounded-lg border border-[#2f2f2f] bg-[#121212] px-3 py-2 text-sm text-white focus:border-[#0779FF] focus:outline-none"
                      />
                      {specs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSpec(idx)}
                          className="rounded-lg border border-[#2f2f2f] px-3 py-2 text-sm text-gray-400 hover:border-red-500 hover:text-red-400"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm text-gray-300">
                      Varian (opsional)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="rounded-lg border border-[#2f2f2f] px-3 py-2 text-sm text-white hover:border-[#0779FF]"
                  >
                    Tambah Varian
                  </button>
                </div>

                <div className="space-y-4">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-[#2f2f2f] bg-[#161616] p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row">
                        <input
                          value={v.optionGroup}
                          onChange={(e) =>
                            handleVariantChange(
                              idx,
                              "optionGroup",
                              e.target.value
                            )
                          }
                          placeholder="Option group (contoh: warna)"
                          className="w-full rounded-lg border border-[#2f2f2f] bg-[#121212] px-3 py-2 text-sm text-white focus:border-[#0779FF] focus:outline-none"
                        />
                        <input
                          value={v.name}
                          onChange={(e) =>
                            handleVariantChange(idx, "name", e.target.value)
                          }
                          placeholder="Nama varian (contoh: 453 / 50gram)"
                          className="w-full rounded-lg border border-[#2f2f2f] bg-[#121212] px-3 py-2 text-sm text-white focus:border-[#0779FF] focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-3 md:flex-row">
                        <input
                          type="number"
                          min="0"
                          value={v.price}
                          onChange={(e) =>
                            handleVariantChange(idx, "price", e.target.value)
                          }
                          placeholder="Harga varian (opsional)"
                          className="w-full rounded-lg border border-[#2f2f2f] bg-[#121212] px-3 py-2 text-sm text-white focus:border-[#0779FF] focus:outline-none"
                        />
                        <input
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) =>
                            handleVariantChange(idx, "stock", e.target.value)
                          }
                          placeholder="Stok varian"
                          className="w-full rounded-lg border border-[#2f2f2f] bg-[#121212] px-3 py-2 text-sm text-white focus:border-[#0779FF] focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="w-full">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleVariantImage(
                                idx,
                                e.target.files?.[0] ?? null
                              )
                            }
                            className="w-full rounded-lg border border-[#2f2f2f] bg-[#121212] file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#3a3a3a] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-[#0779FF] focus:outline-none"
                          />
                          {v.preview && (
                            <div className="mt-2 h-20 w-20 overflow-hidden rounded-lg border border-[#2f2f2f]">
                              <Image
                                src={v.preview}
                                alt={`Varian ${idx + 1}`}
                                width={80}
                                height={80}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="self-start rounded-lg border border-[#2f2f2f] px-3 py-2 text-sm text-gray-400 hover:border-red-500 hover:text-red-400"
                          >
                            Hapus Varian
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm text-gray-300">Foto Utama*</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleMainPhotoChange(e.target.files?.[0] ?? null)
                  }
                  className="w-full rounded-lg border border-[#2f2f2f] bg-[#121212] file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#0779FF] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-[#0779FF] focus:outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm text-gray-300">
                  Gallery Foto (opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleGalleryChange(e.target.files)}
                  className="w-full rounded-lg border border-[#2f2f2f] bg-[#121212] file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#3a3a3a] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-[#0779FF] focus:outline-none"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}
              {message && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                  {message}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full rounded-lg bg-[#0779FF] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#0669dd] disabled:cursor-not-allowed disabled:bg-[#3a3a3a]"
              >
                {isSubmitting ? "Mengunggah..." : "Unggah Produk"}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer variant="compact" />
    </div>
  );
}
