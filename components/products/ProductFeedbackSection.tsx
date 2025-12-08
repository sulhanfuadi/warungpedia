"use client";

import { useEffect, useMemo, useState } from "react";
import { INDONESIA_PROVINCES } from "@/lib/constants/indonesiaProvinces";
import type { ProductFeedback } from "@/lib/models/productFeedback";

type FeedbackFormState = {
  name: string;
  email: string;
  phone: string;
  province: string;
  rating: number;
  comment: string;
};

type Props = {
  productId: string;
  productName: string;
};

const INITIAL_FORM: FeedbackFormState = {
  name: "",
  email: "",
  phone: "",
  province: "",
  rating: 5,
  comment: "",
};

export function ProductFeedbackSection({ productId, productName }: Props) {
  const [feedbacks, setFeedbacks] = useState<ProductFeedback[]>([]);
  const [form, setForm] = useState<FeedbackFormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/products/${productId}/comments`);
        const payload = await res.json();
        if (!mounted) return;
        if (!res.ok) {
          throw new Error(payload.error || "Gagal memuat ulasan");
        }
        setFeedbacks(payload.data ?? []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Gagal memuat ulasan");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [productId]);

  const averageRating = useMemo(() => {
    if (!feedbacks.length) return 0;
    const total = feedbacks.reduce((sum, item) => sum + item.rating, 0);
    return Number((total / feedbacks.length).toFixed(2));
  }, [feedbacks]);

  const ratingDistribution = useMemo(() => {
    const base = [5, 4, 3, 2, 1].map((rating) => ({ rating, total: 0 }));
    feedbacks.forEach((item) => {
      const bucket = base.find((entry) => entry.rating === item.rating);
      if (bucket) bucket.total += 1;
    });
    return base;
  }, [feedbacks]);

  const provinceDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    feedbacks.forEach((item) => {
      const key = item.province || "Tidak diketahui";
      map[key] = (map[key] ?? 0) + 1;
    });
    return Object.entries(map)
      .map(([province, total]) => ({ province, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  }, [feedbacks]);

  const handleChange = (field: keyof FeedbackFormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          province: form.province,
          rating: form.rating,
          comment: form.comment,
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Gagal mengirim ulasan");
      }
      setMessage("Terima kasih! Ulasan berhasil dikirim.");
      setForm({ ...INITIAL_FORM });
      setFeedbacks((prev) => [payload.data, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim ulasan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#2f2f2f] bg-[#121212] p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Bagikan Pengalamanmu</h3>
          <p className="text-sm text-gray-400">
            Kami akan mengirim ucapan terima kasih setelah ulasan terkirim.
          </p>
        </div>
        <div className="rounded-2xl border border-[#2f2f2f] bg-[#0d0d0d] px-4 py-2 text-center">
          <p className="text-xs text-gray-400">Rata-rata rating</p>
          <p className="text-2xl font-semibold text-[#facc15]">{averageRating.toFixed(2)} ★</p>
          <p className="text-xs text-gray-500">{feedbacks.length} ulasan</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-gray-400">Nama*</label>
              <input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-[#2f2f2f] bg-[#1a1a1a] px-4 py-3 text-sm text-white focus:border-[#0779FF] focus:outline-none"
                placeholder="Nama lengkap"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Email*</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-[#2f2f2f] bg-[#1a1a1a] px-4 py-3 text-sm text-white focus:border-[#0779FF] focus:outline-none"
                placeholder="email@domain.com"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-gray-400">Nomor HP*</label>
              <input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-[#2f2f2f] bg-[#1a1a1a] px-4 py-3 text-sm text-white focus:border-[#0779FF] focus:outline-none"
                placeholder="08xxxxxxxx"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Provinsi*</label>
              <select
                value={form.province}
                onChange={(e) => handleChange("province", e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-[#2f2f2f] bg-[#1a1a1a] px-4 py-3 text-sm text-white focus:border-[#0779FF] focus:outline-none"
              >
                <option value="" disabled>
                  Pilih provinsi
                </option>
                {INDONESIA_PROVINCES.map((prov) => (
                  <option key={prov} value={prov} className="bg-[#1a1a1a]">
                    {prov}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400">Rating*</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {[5, 4, 3, 2, 1].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => handleChange("rating", score)}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    form.rating === score
                      ? "border-[#facc15] bg-[#facc151a] text-[#facc15]"
                      : "border-[#2f2f2f] text-gray-400 hover:border-[#facc15]"
                  }`}
                >
                  {score} ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400">Komentar *</label>
            <textarea
              value={form.comment}
              onChange={(e) => handleChange("comment", e.target.value)}
              required
              rows={4}
              className="mt-1 w-full rounded-xl border border-[#2f2f2f] bg-[#1a1a1a] px-4 py-3 text-sm text-white focus:border-[#0779FF] focus:outline-none"
              placeholder={`Ceritakan pengalamanmu dengan ${productName}`}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#0779FF] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1f8bff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Mengirim..." : "Kirim Ulasan"}
            </button>
            {message && <p className="text-sm text-green-400">{message}</p>}
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        </form>

        <div className="space-y-5">
          <div className="rounded-2xl border border-[#2f2f2f] bg-[#1a1a1a] p-4">
            <p className="text-sm font-semibold text-white">Ringkasan Rating</p>
            <div className="mt-4 space-y-3">
              {ratingDistribution.map((entry) => (
                <div key={entry.rating} className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="w-10 text-white">{entry.rating}★</span>
                  <div className="h-2 flex-1 rounded-full bg-[#2a2a2a]">
                    <div
                      className="h-2 rounded-full bg-[#facc15]"
                      style={{
                        width: `${feedbacks.length ? (entry.total / feedbacks.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right">{entry.total}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#2f2f2f] bg-[#1a1a1a] p-4">
            <p className="text-sm font-semibold text-white">Provinsi Pengulas</p>
            {provinceDistribution.length ? (
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                {provinceDistribution.map((entry) => (
                  <li key={entry.province} className="flex items-center justify-between">
                    <span>{entry.province}</span>
                    <span className="font-semibold text-white">{entry.total}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Belum ada data provinsi.</p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">Ulasan Terbaru</p>
            {loading ? (
              <p className="text-sm text-gray-500">Memuat ulasan...</p>
            ) : feedbacks.length ? (
              feedbacks.slice(0, 4).map((feedback) => (
                <article key={feedback.id} className="rounded-2xl border border-[#2f2f2f] bg-[#1a1a1a] p-4">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-semibold text-white">{feedback.customer_name || "Anonim"}</p>
                    <span className="text-[#facc15]">{feedback.rating} ★</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-300">{feedback.comment}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    {feedback.province || "Provinsi tidak diketahui"}
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-gray-500">Belum ada ulasan untuk produk ini.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
