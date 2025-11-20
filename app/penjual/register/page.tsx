"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { testSupabaseConnection } from "@/lib/testSupabase";
import Logo from "@/components/ui/Logo";
import Link from "next/dist/client/link";

interface PasswordStrength {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);

  const [formData, setFormData] = useState({
    picEmail: "",
    password: "",
    passwordConfirmation: "",
    storeName: "",
    storeDescription: "",
    picName: "",
    picPhone: "",
    picStreet: "",
    picRT: "",
    picRW: "",
    picVillage: "",
    picCity: "",
    picProvince: "",
    picKtpNumber: "",
  });

  const [files, setFiles] = useState<{
    picPhoto: File | null;
    picKtp: File | null;
  }>({
    picPhoto: null,
    picKtp: null,
  });

  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    hasMinLength: false,
    hasUpperCase: false,
    hasNumber: false,
    hasSymbol: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsClient(true);

    const timer = setTimeout(() => {
      testSupabaseConnection().then(() => {
        setConnectionTested(true);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [connectionTested]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    if (name === "password") {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files: selectedFiles } = e.target;

    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];
    const maxSize = name === "picPhoto" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;

    if (file.size > maxSize) {
      const sizeMB = maxSize / (1024 * 1024);
      setErrors({
        ...errors,
        [name]: `Ukuran file maksimal ${sizeMB}MB`,
      });
      return;
    }

    const allowedTypes =
      name === "picPhoto"
        ? ["image/jpeg", "image/png"]
        : ["image/jpeg", "image/png", "application/pdf"];

    if (!allowedTypes.includes(file.type)) {
      setErrors({
        ...errors,
        [name]:
          name === "picPhoto"
            ? "Format file harus JPG atau PNG"
            : "Format file harus JPG, PNG, atau PDF",
      });
      return;
    }

    setFiles({ ...files, [name]: file });
    setErrors({ ...errors, [name]: "" });
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.picEmail)) {
      newErrors.picEmail = "Format email tidak valid";
    }

    if (formData.password.length < 8) {
      newErrors.password = "Password minimal 8 karakter";
    }
    if (!passwordStrength.hasUpperCase) {
      newErrors.password = "Password harus mengandung huruf besar";
    }
    if (!passwordStrength.hasNumber) {
      newErrors.password = "Password harus mengandung angka";
    }
    if (!passwordStrength.hasSymbol) {
      newErrors.password = "Password harus mengandung simbol";
    }

    if (formData.password !== formData.passwordConfirmation) {
      newErrors.passwordConfirmation = "Password tidak cocok";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(formData.picPhone)) {
      newErrors.picPhone = "Nomor HP harus 10-15 digit angka";
    }

    if (formData.picKtpNumber.length !== 16) {
      newErrors.picKtpNumber = "Nomor KTP harus 16 digit";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) {
      alert("Mohon perbaiki kesalahan pada form");
      return;
    }

    setIsLoading(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      if (files.picPhoto) data.append("picPhotoPath", files.picPhoto);
      if (files.picKtp) data.append("picKtpFilePath", files.picKtp);

      const response = await fetch("/api/penjual/register", {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          "✅ Registrasi berhasil!\n\nSilakan cek email Anda untuk aktivasi akun."
        );
        window.location.href = "/";
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Terjadi kesalahan saat registrasi. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#0779FF] mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#1a1a1a] flex flex-col"
      suppressHydrationWarning
    >
      <div className="flex-grow py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header dengan Logo - Tampil di Step 1 */}
          {currentStep === 1 && (
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Logo size="xl" variant="white" showText={true} href="/" />
              </div>
              <div className="mt-4">
                <h1 className="text-4xl font-bold text-white mb-2">
                  Daftar Sebagai Penjual
                </h1>
                <p className="text-gray-400 text-lg">
                  Bergabunglah dengan ribuan UMKM di Warungpedia
                </p>
              </div>
            </div>
          )}

          {/* Card Utama */}
          <div className="bg-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden">
            {/* Progress Bar */}
            <div className="bg-[#1a1a1a] p-6">
              <div className="flex justify-between max-w-md mx-auto">
                <div
                  className={`flex-1 text-center py-3 rounded-lg font-semibold transition-all ${
                    currentStep === 1
                      ? "bg-[#0779FF] text-white shadow-lg shadow-blue-500/50"
                      : "bg-[#3a3a3a] text-gray-400"
                  }`}
                >
                  <div className="text-xs mb-1">STEP 1</div>
                  <div className="text-sm">Akun</div>
                </div>
                <div className="w-4"></div>
                <div
                  className={`flex-1 text-center py-3 rounded-lg font-semibold transition-all ${
                    currentStep === 2
                      ? "bg-[#0779FF] text-white shadow-lg shadow-blue-500/50"
                      : "bg-[#3a3a3a] text-gray-400"
                  }`}
                >
                  <div className="text-xs mb-1">STEP 2</div>
                  <div className="text-sm">Data Toko</div>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8">
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
                suppressHydrationWarning
              >
                {/* STEP 1: Akun */}
                {currentStep === 1 && (
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2">
                        Buat Akun Login
                      </h2>
                      <p className="text-gray-400">
                        Email ini akan digunakan untuk masuk ke dashboard
                        penjual Anda
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Email */}
                      <div>
                        <label className="block mb-2 font-medium text-white">
                          Email PIC (untuk Login)*
                        </label>
                        <input
                          type="email"
                          name="picEmail"
                          value={formData.picEmail}
                          onChange={handleChange}
                          required
                          className={`w-full p-4 bg-[#1a1a1a] border-2 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent transition-all ${
                            errors.picEmail
                              ? "border-red-500"
                              : "border-[#3a3a3a]"
                          }`}
                          placeholder="contoh@email.com"
                        />
                        {errors.picEmail && (
                          <p className="text-red-400 text-sm mt-2">
                            {errors.picEmail}
                          </p>
                        )}
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block mb-2 font-medium text-white">
                          Password*
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          className={`w-full p-4 bg-[#1a1a1a] border-2 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent transition-all ${
                            errors.password
                              ? "border-red-500"
                              : "border-[#3a3a3a]"
                          }`}
                          placeholder="Masukkan password"
                        />
                        {errors.password && (
                          <p className="text-red-400 text-sm mt-2">
                            {errors.password}
                          </p>
                        )}

                        {/* Password Strength Checker */}
                        <div className="mt-4 bg-[#1a1a1a] p-4 rounded-lg border border-[#3a3a3a]">
                          <p className="text-sm font-medium mb-3 text-white">
                            Kekuatan Password:
                          </p>
                          <ul className="space-y-2 text-sm">
                            <li
                              className={`flex items-center gap-2 ${
                                passwordStrength.hasMinLength
                                  ? "text-[#0779FF]"
                                  : "text-gray-500"
                              }`}
                            >
                              <span className="text-lg">
                                {passwordStrength.hasMinLength ? "✓" : "○"}
                              </span>
                              Minimal 8 karakter
                            </li>
                            <li
                              className={`flex items-center gap-2 ${
                                passwordStrength.hasUpperCase
                                  ? "text-[#0779FF]"
                                  : "text-gray-500"
                              }`}
                            >
                              <span className="text-lg">
                                {passwordStrength.hasUpperCase ? "✓" : "○"}
                              </span>
                              Huruf besar (A-Z)
                            </li>
                            <li
                              className={`flex items-center gap-2 ${
                                passwordStrength.hasNumber
                                  ? "text-[#0779FF]"
                                  : "text-gray-500"
                              }`}
                            >
                              <span className="text-lg">
                                {passwordStrength.hasNumber ? "✓" : "○"}
                              </span>
                              Angka (0-9)
                            </li>
                            <li
                              className={`flex items-center gap-2 ${
                                passwordStrength.hasSymbol
                                  ? "text-[#0779FF]"
                                  : "text-gray-500"
                              }`}
                            >
                              <span className="text-lg">
                                {passwordStrength.hasSymbol ? "✓" : "○"}
                              </span>
                              Simbol (!@#$)
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Konfirmasi Password */}
                      <div>
                        <label className="block mb-2 font-medium text-white">
                          Konfirmasi Password*
                        </label>
                        <input
                          type="password"
                          name="passwordConfirmation"
                          value={formData.passwordConfirmation}
                          onChange={handleChange}
                          required
                          className={`w-full p-4 bg-[#1a1a1a] border-2 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent transition-all ${
                            errors.passwordConfirmation
                              ? "border-red-500"
                              : "border-[#3a3a3a]"
                          }`}
                          placeholder="Ketik ulang password"
                        />
                        {errors.passwordConfirmation && (
                          <p className="text-red-400 text-sm mt-2">
                            {errors.passwordConfirmation}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Button Next */}
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full bg-[#0779FF] hover:bg-[#0669dd] text-white px-8 py-4 rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                    >
                      Lanjut ke Data Toko →
                    </button>
                    <div className="mt-6 text-center">
                      <p className="text-gray-400 text-sm">
                        Sudah punya akun?{" "}
                        <Link
                          href="/login" // ✅ Ganti dari /penjual/login jadi /login
                          className="text-[#0779FF] hover:underline font-semibold"
                        >
                          Login Sekarang
                        </Link>
                      </p>
                    </div>
                  </div>
                )}

                {/* STEP 2: Data Toko */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-white">
                        Lengkapi Data Toko Anda
                      </h2>
                    </div>

                    {/* Informasi Toko */}
                    <fieldset className="border border-[#3a3a3a] p-6 rounded-lg bg-[#1a1a1a]">
                      <legend className="font-bold text-lg px-3 text-white">
                        Informasi Toko
                      </legend>
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="block mb-2 font-medium text-white">
                            Nama Toko*
                          </label>
                          <input
                            type="text"
                            name="storeName"
                            value={formData.storeName}
                            onChange={handleChange}
                            required
                            className="w-full p-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent"
                            placeholder="Contoh: Warung Berkah"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 font-medium text-white">
                            Deskripsi Singkat
                          </label>
                          <input
                            type="text"
                            name="storeDescription"
                            value={formData.storeDescription}
                            onChange={handleChange}
                            className="w-full p-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent"
                            placeholder="Contoh: Menjual kebutuhan sehari-hari"
                          />
                        </div>
                      </div>
                    </fieldset>

                    {/* Identitas PIC */}
                    <fieldset className="border border-[#3a3a3a] p-6 rounded-lg bg-[#1a1a1a]">
                      <legend className="font-bold text-lg px-3 text-white">
                        Identitas PIC
                      </legend>
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="block mb-2 font-medium text-white">
                            Nama Lengkap PIC*
                          </label>
                          <input
                            type="text"
                            name="picName"
                            value={formData.picName}
                            onChange={handleChange}
                            required
                            className="w-full p-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent"
                            placeholder="Nama lengkap"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 font-medium text-white">
                            No HP PIC (WhatsApp)*
                          </label>
                          <input
                            type="tel"
                            name="picPhone"
                            value={formData.picPhone}
                            onChange={handleChange}
                            required
                            className={`w-full p-3 bg-[#2a2a2a] border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent ${
                              errors.picPhone
                                ? "border-red-500"
                                : "border-[#3a3a3a]"
                            }`}
                            placeholder="08123456789"
                          />
                          {errors.picPhone && (
                            <p className="text-red-400 text-sm mt-1">
                              {errors.picPhone}
                            </p>
                          )}
                        </div>
                      </div>
                    </fieldset>

                    {/* Alamat Lengkap */}
                    <fieldset className="border border-[#3a3a3a] p-6 rounded-lg bg-[#1a1a1a]">
                      <legend className="font-bold text-lg px-3 text-white">
                        Alamat Lengkap
                      </legend>
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="block mb-2 font-medium text-white">
                            Jalan / Alamat*
                          </label>
                          <input
                            type="text"
                            name="picStreet"
                            value={formData.picStreet}
                            onChange={handleChange}
                            required
                            className="w-full p-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent"
                            placeholder="Nama jalan dan nomor rumah"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-2 font-medium text-white">
                              RT*
                            </label>
                            <input
                              type="text"
                              name="picRT"
                              value={formData.picRT}
                              onChange={handleChange}
                              required
                              className="w-full p-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent"
                              placeholder="001"
                            />
                          </div>
                          <div>
                            <label className="block mb-2 font-medium text-white">
                              RW*
                            </label>
                            <input
                              type="text"
                              name="picRW"
                              value={formData.picRW}
                              onChange={handleChange}
                              required
                              className="w-full p-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent"
                              placeholder="001"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block mb-2 font-medium text-white">
                            Kelurahan*
                          </label>
                          <input
                            type="text"
                            name="picVillage"
                            value={formData.picVillage}
                            onChange={handleChange}
                            required
                            className="w-full p-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 font-medium text-white">
                            Kab/Kota*
                          </label>
                          <input
                            type="text"
                            name="picCity"
                            value={formData.picCity}
                            onChange={handleChange}
                            required
                            className="w-full p-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 font-medium text-white">
                            Provinsi*
                          </label>
                          <input
                            type="text"
                            name="picProvince"
                            value={formData.picProvince}
                            onChange={handleChange}
                            required
                            className="w-full p-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </fieldset>

                    {/* Dokumen Legalitas */}
                    <fieldset className="border border-[#3a3a3a] p-6 rounded-lg bg-[#1a1a1a]">
                      <legend className="font-bold text-lg px-3 text-white">
                        Dokumen Legalitas
                      </legend>
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="block mb-2 font-medium text-white">
                            Nomor KTP (NIK)*
                          </label>
                          <input
                            type="text"
                            name="picKtpNumber"
                            value={formData.picKtpNumber}
                            onChange={handleChange}
                            required
                            maxLength={16}
                            className={`w-full p-3 bg-[#2a2a2a] border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[#0779FF] focus:border-transparent ${
                              errors.picKtpNumber
                                ? "border-red-500"
                                : "border-[#3a3a3a]"
                            }`}
                            placeholder="16 digit nomor KTP"
                          />
                          {errors.picKtpNumber && (
                            <p className="text-red-400 text-sm mt-1">
                              {errors.picKtpNumber}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block mb-2 font-medium text-white">
                            Foto PIC (Selfie) [JPG/PNG, Max 2MB]*
                          </label>
                          <input
                            type="file"
                            name="picPhoto"
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png"
                            className="w-full p-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#0779FF] file:text-white hover:file:bg-[#0669dd] file:cursor-pointer"
                          />
                          {errors.picPhoto && (
                            <p className="text-red-400 text-sm mt-1">
                              {errors.picPhoto}
                            </p>
                          )}
                          {files.picPhoto && (
                            <p className="text-[#0779FF] text-sm mt-2 flex items-center gap-2">
                              <span>✓</span> File terpilih:{" "}
                              {files.picPhoto.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block mb-2 font-medium text-white">
                            Scan KTP [JPG/PDF, Max 5MB]*
                          </label>
                          <input
                            type="file"
                            name="picKtp"
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,application/pdf"
                            className="w-full p-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#0779FF] file:text-white hover:file:bg-[#0669dd] file:cursor-pointer"
                          />
                          {errors.picKtp && (
                            <p className="text-red-400 text-sm mt-1">
                              {errors.picKtp}
                            </p>
                          )}
                          {files.picKtp && (
                            <p className="text-[#0779FF] text-sm mt-2 flex items-center gap-2">
                              <span>✓</span> File terpilih: {files.picKtp.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </fieldset>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                      <button
                        type="button"
                        onClick={handlePrevious}
                        disabled={isLoading}
                        className="flex-1 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white px-6 py-4 rounded-lg font-semibold disabled:cursor-not-allowed transition-all"
                      >
                        ← Kembali
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-[#0779FF] hover:bg-[#0669dd] text-white px-6 py-4 rounded-lg font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
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
                            Memproses...
                          </span>
                        ) : (
                          "Daftar Sekarang"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] border-t border-[#3a3a3a] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <Logo size="sm" variant="white" showText={true} href="/" />
              </div>
              <p className="text-gray-400 text-sm">
                Platform Marketplace untuk UMKM Indonesia
              </p>
            </div>
            <div className="text-gray-400 text-sm text-center md:text-right">
              <p>© 2025 Warungpedia. All rights reserved.</p>
              <p className="mt-1">
                Butuh bantuan?{" "}
                <a
                  href="mailto:support@warungpedia.id"
                  className="text-[#0779FF] hover:underline"
                >
                  support@warungpedia.id
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
