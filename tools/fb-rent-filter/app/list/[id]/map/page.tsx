"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { RentRecord } from "@/lib/schema";

// 用 Nominatim 查 lat/lng
async function geocode(query: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=zh-TW`,
      { headers: { "User-Agent": "fb-rent-filter/1.0 (ceranastudio)" } }
    );
    const data = await res.json();
    if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {}
  return null;
}

export default function MapPage() {
  const params = useParams();
  const id = params.id as string;
  const mapRef = useRef<HTMLDivElement>(null);
  const [records, setRecords] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("載入清單...");
  const [geocoded, setGeocoded] = useState(0);

  useEffect(() => {
    async function init() {
      // 1. 載入清單資料
      const res = await fetch(`/api/lists/${id}`);
      const data = await res.json();
      if (data.error) { setStatus("載入失敗"); return; }
      const recs: RentRecord[] = data.records;
      setRecords(recs);

      // 2. 載入 Leaflet CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      // 3. 載入 Leaflet JS
      await new Promise<void>((resolve) => {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => resolve();
        document.head.appendChild(script);
      });

      // 4. 初始化地圖（以台北為中心）
      const L = (window as unknown as { L: unknown }).L as LeafletStatic;
      if (!mapRef.current) return;

      const map = L.map(mapRef.current).setView([25.033, 121.565], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      setStatus(`正在定位 ${recs.length} 筆房源...`);
      setLoading(false);

      // 5. 逐一 geocode（Nominatim 1 req/sec）
      let done = 0;
      for (const r of recs) {
        const query = [r.address, r.district, "台灣"].filter(Boolean).join(" ");
        const coords = await geocode(query);
        if (coords) {
          const priceText = r.price ? `NT$${r.price.toLocaleString()}/月` : "價格未知";
          const popup = `
            <div style="font-family:sans-serif;min-width:140px">
              <div style="font-weight:700;font-size:15px;color:#E8572A">${priceText}</div>
              <div style="font-size:12px;color:#555;margin-top:3px">${r.title}</div>
              ${r.district ? `<div style="font-size:11px;color:#888;margin-top:2px">${r.district}</div>` : ""}
              ${r.subsidyEligible ? `<div style="font-size:11px;color:#065F46;margin-top:3px;font-weight:600">✓ 可租補</div>` : ""}
            </div>
          `;
          L.marker(coords).addTo(map).bindPopup(popup);
        }
        done++;
        setGeocoded(done);
        // Nominatim rate limit: 1 req/s
        await new Promise((r) => setTimeout(r, 1100));
      }
      setStatus(`完成！共標示 ${recs.length} 筆`);
    }
    init();
  }, [id]);

  return (
    <main style={{ minHeight: "100vh", background: "#FAFAF8", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 1000,
        background: "#FAFAF8", borderBottom: "1px solid #E8E6E0",
        padding: "0 16px", height: 52,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <a
          href={`/list/${id}`}
          style={{
            fontSize: 13, fontWeight: 500, color: "#888882",
            textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
          }}
        >
          ← 回清單
        </a>
        <span style={{ fontSize: 13, color: "#1A1A18", fontWeight: 600 }}>
          地圖總覽
        </span>
      </nav>

      {/* Status bar */}
      <div style={{
        padding: "8px 16px",
        background: "white",
        borderBottom: "1px solid #E8E6E0",
        fontSize: 12, color: "#888882",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        {loading ? "⏳" : "📍"} {status}
        {!loading && records.length > 0 && (
          <span style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>
            {geocoded} / {records.length} 定位完成
          </span>
        )}
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        style={{ flex: 1, minHeight: "calc(100vh - 100px)" }}
      />
    </main>
  );
}

// Minimal types for Leaflet
interface LeafletStatic {
  map(el: HTMLElement): LeafletMap;
  tileLayer(url: string, opts: object): { addTo(map: LeafletMap): void };
  marker(coords: [number, number]): LeafletMarker;
}
interface LeafletMap {
  setView(coords: [number, number], zoom: number): LeafletMap;
}
interface LeafletMarker {
  addTo(map: LeafletMap): LeafletMarker;
  bindPopup(html: string): LeafletMarker;
}
