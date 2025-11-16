"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    storeName: "",
    storeDescription: "",
    picEmail: "",
    password: "",
    passwordConfirmation: "",
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles({ ...files, [e.target.name]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi password
    if (formData.password !== formData.passwordConfirmation) {
      alert("Password dan konfirmasi password tidak cocok!");
      return;
    }

    // Buat FormData
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (files.picPhoto) data.append("picPhotoPath", files.picPhoto);
    if (files.picKtp) data.append("picKtpFilePath", files.picKtp);

    try {
      const response = await fetch("/api/penjual/register", {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        alert("Registrasi berhasil! Silakan cek email untuk aktivasi.");
        window.location.href = "/";
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert("Terjadi kesalahan saat registrasi");
      console.error(error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">
        Formulir Registrasi Data Penjual (Toko)
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data Toko */}
        <fieldset className="border p-4 rounded-lg">
          <legend className="font-bold px-2">Data Toko</legend>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Nama Toko*</label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Deskripsi Singkat</label>
              <input
                type="text"
                name="storeDescription"
                value={formData.storeDescription}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </fieldset>

        {/* Data Akun & PIC */}
        <fieldset className="border p-4 rounded-lg">
          <legend className="font-bold px-2">Data Akun & PIC</legend>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Email PIC (untuk Login)*</label>
              <input
                type="email"
                name="picEmail"
                value={formData.picEmail}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Password*</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <ul className="list-disc list-inside space-y-1">
                <li>Minimal 8 karakter</li>
                <li>Gunakan huruf besar (A-Z)</li>
                <li>Gunakan angka (0-9)</li>
                <li>Gunakan simbol (!@#$)</li>
              </ul>
            </div>
            <div>
              <label className="block mb-1">Konfirmasi Password*</label>
              <input
                type="password"
                name="passwordConfirmation"
                value={formData.passwordConfirmation}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Nama PIC*</label>
              <input
                type="text"
                name="picName"
                value={formData.picName}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">No HP PIC*</label>
              <input
                type="tel"
                name="picPhone"
                value={formData.picPhone}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </fieldset>

        {/* Alamat PIC */}
        <fieldset className="border p-4 rounded-lg">
          <legend className="font-bold px-2">Alamat PIC</legend>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block mb-1">Jalan*</label>
              <input
                type="text"
                name="picStreet"
                value={formData.picStreet}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">RT*</label>
              <input
                type="text"
                name="picRT"
                value={formData.picRT}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">RW*</label>
              <input
                type="text"
                name="picRW"
                value={formData.picRW}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Kelurahan*</label>
              <input
                type="text"
                name="picVillage"
                value={formData.picVillage}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Kab/Kota*</label>
              <input
                type="text"
                name="picCity"
                value={formData.picCity}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="block mb-1">Provinsi*</label>
              <input
                type="text"
                name="picProvince"
                value={formData.picProvince}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </fieldset>

        {/* Dokumen Identitas */}
        <fieldset className="border p-4 rounded-lg">
          <legend className="font-bold px-2">Dokumen Identitas PIC</legend>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">No. KTP PIC*</label>
              <input
                type="text"
                name="picKtpNumber"
                value={formData.picKtpNumber}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Foto PIC (jpg/png, ≤2MB)</label>
              <input
                type="file"
                name="picPhoto"
                onChange={handleFileChange}
                accept="image/jpeg,image/png"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">File KTP (jpg/png/pdf, ≤5MB)</label>
              <input
                type="file"
                name="picKtp"
                onChange={handleFileChange}
                accept="image/jpeg,image/png,application/pdf"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </fieldset>

        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Registrasi Penjual
          </button>
          <button
            type="reset"
            className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
