"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css"; // Wajib import CSS ini

// Gunakan file lokal yang sudah diunduh ke folder public
const GEO_URL = "/indonesia-province-simple.json";

interface MapData {
  province: string;
  count: number;
}

interface IndonesiaMapChartProps {
  data: MapData[];
  label?: string;
}

export default function IndonesiaMapChart({
  data,
  label = "Jumlah",
}: IndonesiaMapChartProps) {
  const [geoData, setGeoData] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch data peta secara manual untuk memastikan loaded
  useEffect(() => {
    fetch(GEO_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat data peta");
        return res.json();
      })
      .then((data) => {
        setGeoData(data);
        setIsLoaded(true);
      })
      .catch((err) => console.error("Map Error:", err));
  }, []);

  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => {
      if (d.province) {
        map.set(d.province.toUpperCase().trim(), d.count);
      }
    });
    return map;
  }, [data]);

  const maxValue = Math.max(...data.map((d) => d.count), 1);

  const colorScale = scaleLinear<string>()
    .domain([0, maxValue])
    .range(["#2a2a2a", "#0779FF"]);

  if (!isLoaded) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-[#1a1a1a] rounded-xl border border-[#3a3a3a] text-gray-500">
        Memuat Peta Indonesia...
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] relative bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#3a3a3a]">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1050, // Sesuaikan zoom
          center: [118, -2], // Koordinat tengah Indonesia
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={4}>
          <Geographies geography={geoData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const provinceName =
                  geo.properties.PROP_NAME ||
                  geo.properties.NAME_1 ||
                  geo.properties.name ||
                  geo.properties.Propinsi || // Tambahkan baris ini
                  "Unknown";

                let value = dataMap.get(provinceName.toUpperCase());

                // Fallback matching
                if (value === undefined) {
                  const key = Array.from(dataMap.keys()).find(
                    (k) =>
                      k.includes(provinceName.toUpperCase()) ||
                      provinceName.toUpperCase().includes(k)
                  );
                  if (key) value = dataMap.get(key);
                }

                const count = value || 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={count > 0 ? colorScale(count) : "#333333"}
                    stroke="#555555"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        fill: "#F53",
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: { outline: "none" },
                    }}
                    data-tooltip-id="map-tooltip"
                    data-tooltip-content={`${provinceName}: ${count} ${label}`}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      <Tooltip
        id="map-tooltip"
        style={{ backgroundColor: "#000", color: "#fff", zIndex: 50 }}
      />

      <div className="absolute bottom-4 left-4 bg-black/50 p-2 rounded text-xs text-white backdrop-blur-sm pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 bg-[#0779FF]"></span>
          <span>Tinggi ({maxValue})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#333333]"></span>
          <span>Rendah (0)</span>
        </div>
      </div>
    </div>
  );
}
