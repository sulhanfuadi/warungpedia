"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { INDONESIA_PROVINCES } from "@/lib/constants/indonesiaProvinces";

export type ProductFeedbackSectionProps = {
  productId: string;
};

export type FeedbackForm = {
  name: string;
  phone: string;
  email: string;
  province: string;
  comment: string;
  rating: number;
};

export type Feedback = {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  province: string;
  comment: string;
  rating: number;
  created_at: string;
};

const defaultForm: FeedbackForm = {
  name: "",
  phone: "",
  email: "",
  province: "",
  comment: "",
  rating: 5,
};

export default function ProductFeedbackSection({ productId }: ProductFeedbackSectionProps) {
  const [form, setForm] = useState<FeedbackForm>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    setServerError(null);
    try {
      const res = await fetch(`/api/products/${productId}/comments`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal memuat komentar");
      }
      setFeedbacks(json.data ?? []);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Gagal memuat komentar");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const averageRating = useMemo(() => {
    if (!feedbacks.length) return 0;
    const total = feedbacks.reduce((sum, item) => sum + item.rating, 0);
    return Math.round((total / feedbacks.length) * 10) / 10;
  }, [feedbacks]);

  const handleChange = (field: keyof FeedbackForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/products/${productId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.fields) {
          setErrors(json.fields);
        }
        throw new Error(json.error || "Gagal mengirim feedback");
      }

      setForm(defaultForm);
      setSuccessMessage("Terima kasih! Feedback Anda sudah tersimpan.");
      await fetchFeedbacks();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Gagal mengirim feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[#2f2f2f] bg-[#141414] p-6 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Tulis Komentar & Rating</h3>
            <p className="text-sm text-gray-400">Semua kolom wajib diisi</p>
          </div>
          <span className="rounded-full bg-[#0b2b52] px-4 py-1 text-sm font-semibold text-[#7cc0ff]">
            Rating Anda: {form.rating}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-gray-300">Nama Lengkap</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#2f2f2f] bg-[#1c1c1c] px-3 py-2 text-sm text-white focus:border-[#0779FF] focus:outline-none"
              placeholder="Contoh: Rani Putri"
              required
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-300">Nomor HP</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#2f2f2f] bg-[#1c1c1c] px-3 py-2 text-sm text-white focus:border-[#0779FF] focus:outline-none"
              placeholder="Contoh: +62813xxxx"
              required
            />
            {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#2f2f2f] bg-[#1c1c1c] px-3 py-2 text-sm text-white focus:border-[#0779FF] focus:outline-none"
              placeholder="nama@domain.com"
              required
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-300">Provinsi</label>
            <select
              value={form.province}
              onChange={(e) => handleChange("province", e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#2f2f2f] bg-[#1c1c1c] px-3 py-2 text-sm text-white focus:border-[#0779FF] focus:outline-none"
              required
            >
              <option value="" disabled>
                Pilih provinsi
              </option>
              {INDONESIA_PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
            {errors.province && <p className="mt-1 text-xs text-red-400">{errors.province}</p>}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-gray-300">Komentar</label>
          <textarea
            value={form.comment}
            onChange={(e) => handleChange("comment", e.target.value)}
            className="mt-1 h-28 w-full rounded-xl border border-[#2f2f2f] bg-[#1c1c1c] px-3 py-2 text-sm text-white focus:border-[#0779FF] focus:outline-none"
            placeholder="Tulis pengalaman Anda menggunakan produk ini"
            required
          />
          {errors.comment && <p className="mt-1 text-xs text-red-400">{errors.comment}</p>}
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-300">Pilih Rating</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <label key={star} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="rating"
                  value={star}
                  checked={form.rating === star}
                  onChange={() => handleChange("rating", star)}
                  className="accent-[#0779FF]"
                />
                <span className="text-sm text-gray-300">{star} Bintang</span>
              </label>
            ))}
          </div>
          {errors.rating && <p className="mt-1 text-xs text-red-400">{errors.rating}</p>}
        </div>

        {serverError && <p className="mt-4 text-sm text-red-400">{serverError}</p>}
        {successMessage && <p className="mt-4 text-sm text-emerald-400">{successMessage}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-2xl bg-[#0779FF] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#0d6ad6] disabled:cursor-not-allowed disabled:bg-[#1d3654]"
        >
          {submitting ? "Mengirim..." : "Kirim Komentar"}
        </button>
      </form>

      <div className="rounded-2xl border border-[#2f2f2f] bg-[#141414] p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Ulasan Terbaru</h3>
            <p className="text-sm text-gray-400">
              {feedbacks.length} komentar • Rata-rata {averageRating.toFixed(1)}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-gray-400">Memuat komentar...</p>
        ) : feedbacks.length === 0 ? (
          <p className="mt-6 text-sm text-gray-400">Belum ada komentar untuk produk ini.</p>
        ) : (
          <div className="mt-6 space-y-4 max-h-[440px] overflow-y-auto pr-2">
            {feedbacks.map((fb) => (
              <article key={fb.id} className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-semibold text-white">{fb.customer_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(fb.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })} • {fb.province}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#0b2b52] px-3 py-1 text-xs font-semibold text-[#7cc0ff]">
                    ⭐ {fb.rating}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-200">{fb.comment}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
