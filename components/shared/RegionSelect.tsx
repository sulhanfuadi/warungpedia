"use client";

import { useState, useEffect } from "react";
import {
  Region,
  getProvinces,
  getRegencies,
  getDistricts,
  getVillages,
} from "@/lib/constants/indonesiaRegions";

interface RegionSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string, selectedOption?: Region) => void;
  options: Region[];
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  error?: string;
}

export function RegionSelect({
  label,
  name,
  value,
  onChange,
  options,
  loading = false,
  disabled = false,
  required = false,
  placeholder = "Pilih...",
  error,
}: RegionSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const selectedOption = options.find((opt) => opt.name === selectedValue);
    onChange(name, selectedValue, selectedOption);
  };

  return (
    <div>
      <label className="block mb-2 font-medium text-white">
        {label}
        {required && "*"}
      </label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={handleChange}
          disabled={disabled || loading}
          required={required}
          className={`w-full p-3 bg-[#2a2a2a] border rounded-lg text-white focus:ring-2 focus:ring-[#0779FF] focus:border-transparent appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? "border-red-500" : "border-[#3a3a3a]"
          } ${!value ? "text-gray-500" : "text-white"}`}
        >
          <option value="" className="text-gray-500">
            {loading ? "Memuat..." : placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.id}
              value={option.name}
              className="text-white bg-[#2a2a2a]"
            >
              {option.name}
            </option>
          ))}
        </select>
        {/* Dropdown Arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
}

// Hook untuk mengelola state wilayah secara cascade
interface UseRegionSelectOptions {
  onProvinceChange?: (province: string) => void;
  onCityChange?: (city: string) => void;
  onDistrictChange?: (district: string) => void;
  onVillageChange?: (village: string) => void;
}

interface RegionState {
  provinces: Region[];
  regencies: Region[];
  districts: Region[];
  villages: Region[];
  loadingProvinces: boolean;
  loadingRegencies: boolean;
  loadingDistricts: boolean;
  loadingVillages: boolean;
  selectedProvinceId: string;
  selectedRegencyId: string;
  selectedDistrictId: string;
}

export function useRegionSelect(options?: UseRegionSelectOptions) {
  const [state, setState] = useState<RegionState>({
    provinces: [],
    regencies: [],
    districts: [],
    villages: [],
    loadingProvinces: true,
    loadingRegencies: false,
    loadingDistricts: false,
    loadingVillages: false,
    selectedProvinceId: "",
    selectedRegencyId: "",
    selectedDistrictId: "",
  });

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      setState((prev) => ({ ...prev, loadingProvinces: true }));
      const provinces = await getProvinces();
      setState((prev) => ({
        ...prev,
        provinces,
        loadingProvinces: false,
      }));
    };
    loadProvinces();
  }, []);

  // Handle province selection
  const handleProvinceChange = async (
    name: string,
    value: string,
    selectedOption?: Region
  ) => {
    options?.onProvinceChange?.(value);

    if (!selectedOption) {
      setState((prev) => ({
        ...prev,
        selectedProvinceId: "",
        regencies: [],
        districts: [],
        villages: [],
        selectedRegencyId: "",
        selectedDistrictId: "",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      selectedProvinceId: selectedOption.id,
      loadingRegencies: true,
      regencies: [],
      districts: [],
      villages: [],
      selectedRegencyId: "",
      selectedDistrictId: "",
    }));

    const regencies = await getRegencies(selectedOption.id);
    setState((prev) => ({
      ...prev,
      regencies,
      loadingRegencies: false,
    }));
  };

  // Handle regency/city selection
  const handleRegencyChange = async (
    name: string,
    value: string,
    selectedOption?: Region
  ) => {
    options?.onCityChange?.(value);

    if (!selectedOption) {
      setState((prev) => ({
        ...prev,
        selectedRegencyId: "",
        districts: [],
        villages: [],
        selectedDistrictId: "",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      selectedRegencyId: selectedOption.id,
      loadingDistricts: true,
      districts: [],
      villages: [],
      selectedDistrictId: "",
    }));

    const districts = await getDistricts(selectedOption.id);
    setState((prev) => ({
      ...prev,
      districts,
      loadingDistricts: false,
    }));
  };

  // Handle district selection
  const handleDistrictChange = async (
    name: string,
    value: string,
    selectedOption?: Region
  ) => {
    options?.onDistrictChange?.(value);

    if (!selectedOption) {
      setState((prev) => ({
        ...prev,
        selectedDistrictId: "",
        villages: [],
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      selectedDistrictId: selectedOption.id,
      loadingVillages: true,
      villages: [],
    }));

    const villages = await getVillages(selectedOption.id);
    setState((prev) => ({
      ...prev,
      villages,
      loadingVillages: false,
    }));
  };

  // Handle village selection
  const handleVillageChange = (
    name: string,
    value: string,
    selectedOption?: Region
  ) => {
    options?.onVillageChange?.(value);
  };

  return {
    ...state,
    handleProvinceChange,
    handleRegencyChange,
    handleDistrictChange,
    handleVillageChange,
  };
}
