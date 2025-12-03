"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export type SellerDashboardChartsProps = {
  sellerId: string;
};

export type SellerDashboardResponse = {
  stockDistribution: { label: string; stock: number }[];
  ratingDistribution: { rating: number; total: number }[];
  provinceDistribution: { province: string; total: number }[];
};

export default function SellerDashboardCharts({ sellerId }: SellerDashboardChartsProps) {
  const [data, setData] = useState<SellerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/penjual/dashboard/insights?sellerId=${sellerId}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal memuat data dashboard");
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    if (sellerId) {
      load();
    }
  }, [load, sellerId]);

  const stockChart = useMemo(() => {
    if (!data?.stockDistribution?.length) return null;
    return {
      labels: data.stockDistribution.map((item) => item.label),
      datasets: [
        {
          label: "Stok",
          data: data.stockDistribution.map((item) => item.stock),
          backgroundColor: "rgba(7, 121, 255, 0.6)",
          borderColor: "#0779FF",
          borderWidth: 1,
        },
      ],
    };
  }, [data]);

  const ratingChart = useMemo(() => {
    if (!data?.ratingDistribution?.length) return null;
    const palette = ["#00c48c", "#3dd598", "#ffc542", "#ff8f6b", "#ff5f56"].reverse();
    const sorted = [...data.ratingDistribution].sort((a, b) => a.rating - b.rating);
    return {
      labels: sorted.map((item) => `${item.rating} Bintang`),
      datasets: [
        {
          label: "Jumlah Ulasan",
          data: sorted.map((item) => item.total),
          backgroundColor: palette.slice(0, sorted.length),
          borderWidth: 0,
        },
      ],
    };
  }, [data]);

  const provinceChart = useMemo(() => {
    if (!data?.provinceDistribution?.length) return null;
    const sorted = [...data.provinceDistribution].sort((a, b) => b.total - a.total).slice(0, 8);
    return {
      labels: sorted.map((item) => item.province),
      datasets: [
        {
          label: "Total Reviewer",
          data: sorted.map((item) => item.total),
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          borderColor: "rgba(255, 255, 255, 0.8)",
          borderWidth: 1,
        },
      ],
    };
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#2f2f2f] bg-[#121212] p-6 text-sm text-gray-400">
        Memuat dashboard penjual...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[#3f1f1f] bg-[#201515] p-6 text-sm text-red-300">
        {error}
        <button onClick={load} className="ml-4 text-[#77b6ff] underline">
          Coba lagi
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <SummaryCard title="Total Produk" value={data.stockDistribution.length.toString()} />
        <SummaryCard
          title="Total Reviewer"
          value={data.provinceDistribution.reduce((sum, item) => sum + item.total, 0).toString()}
        />
        <SummaryCard
          title="Nilai Rating Terekam"
          value={
            data.ratingDistribution.reduce((sum, item) => sum + item.rating * item.total, 0) /
            Math.max(1, data.ratingDistribution.reduce((sum, item) => sum + item.total, 0))
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Sebaran Stok Produk" subtitle="Bar chart stok per produk">
          {stockChart ? (
            <Bar
              data={stockChart}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  x: {
                    ticks: { color: "#b3c2ff" },
                  },
                  y: {
                    ticks: { color: "#b3c2ff" },
                  },
                },
              }}
            />
          ) : (
            <EmptyState message="Belum ada stok terdaftar" />
          )}
        </ChartCard>

        <ChartCard title="Sebaran Rating" subtitle="Donut chart 1-5 bintang">
          {ratingChart ? (
            <Doughnut
              data={ratingChart}
              options={{
                plugins: {
                  legend: { position: "bottom", labels: { color: "#e2e8ff" } },
                },
              }}
            />
          ) : (
            <EmptyState message="Belum ada rating" />
          )}
        </ChartCard>
      </div>

      <ChartCard title="Sebaran Provinsi Perating" subtitle="Top 8 provinsi">
        {provinceChart ? (
          <Bar
            data={provinceChart}
            options={{
              indexAxis: "y",
              responsive: true,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: {
                  ticks: { color: "#b3c2ff" },
                },
                y: {
                  ticks: { color: "#b3c2ff" },
                },
              },
            }}
          />
        ) : (
          <EmptyState message="Belum ada data provinsi" />
        )}
      </ChartCard>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-[#2f2f2f] bg-[#151515] p-5">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">
        {typeof value === "number" ? value.toFixed(1) : value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#2f2f2f] bg-[#151515] p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-gray-500">{message}</p>;
}
