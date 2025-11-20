"use client";

import { useState } from "react";
import Logo from "@/components/ui/Logo";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboardPage() {
  // ----------------- Dummy Data -----------------
  const productCategoryData = [
    { name: "Sembako", value: 120 },
    { name: "Minuman", value: 80 },
    { name: "ATK", value: 40 },
    { name: "Peralatan Rumah", value: 60 },
  ];

  const provinceStoreData = [
    { province: "DKI Jakarta", count: 40 },
    { province: "Jawa Barat", count: 55 },
    { province: "Jawa Tengah", count: 22 },
    { province: "Jawa Timur", count: 30 },
  ];

  const COLORS = ["#0779FF", "#4ade80", "#facc15", "#f87171"];

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <header className="bg-[#2a2a2a] text-white p-6 shadow-2xl border-b border-[#3a3a3a]">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="lg" variant="white" showText={true} href="/" />
            <div className="h-8 w-px bg-[#3a3a3a]"></div>
            <div>
              <h1 className="text-2xl font-bold">Admin Platform</h1>
              <p className="text-sm text-gray-400">
                Dashboard Statistik Warungpedia
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="container mx-auto p-8 flex-grow">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Dashboard Platform
          </h2>
          <p className="text-gray-400">
            Visualisasi statistik produk, toko, dan pengguna
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-6 shadow-2xl">
            <p className="text-gray-400 text-sm">Total Pengguna</p>
            <h3 className="text-3xl text-white font-bold mt-2">12.903</h3>
          </div>
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-6 shadow-2xl">
            <p className="text-gray-400 text-sm">Total Produk</p>
            <h3 className="text-3xl text-white font-bold mt-2">4.388</h3>
          </div>
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-6 shadow-2xl">
            <p className="text-gray-400 text-sm">Total Toko</p>
            <h3 className="text-3xl text-white font-bold mt-2">933</h3>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Produk Per Kategori */}
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl text-white font-bold mb-6">
              Sebaran Produk per Kategori
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productCategoryData}
                    nameKey="name"
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {productCategoryData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Toko Per Provinsi */}
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl text-white font-bold mb-6">
              Sebaran Toko per Provinsi
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={provinceStoreData}>
                  <XAxis dataKey="province" stroke="#aaa" />
                  <YAxis stroke="#aaa" />
                  <Tooltip />
                  <Bar dataKey="count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] border-t border-[#3a3a3a] py-6 px-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo size="sm" variant="white" showText={true} href="/" />
          <div className="text-gray-400 text-sm text-center md:text-right">
            <p>© 2025 Warungpedia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
