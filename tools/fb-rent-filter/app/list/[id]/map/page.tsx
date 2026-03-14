"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import type { RentRecord } from "@/lib/schema";

const LEAFLET_CSS = `
.leaflet-pane,.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow,.leaflet-tile-container,.leaflet-pane>svg,.leaflet-pane>canvas,.leaflet-zoom-box,.leaflet-image-layer,.leaflet-layer{position:absolute;left:0;top:0}
.leaflet-container{overflow:hidden}
.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow{-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-user-drag:none}
.leaflet-tile::selection{background:transparent}
.leaflet-safari .leaflet-tile{image-rendering:-webkit-optimize-contrast}
.leaflet-safari .leaflet-tile-container{width:1600px;height:1600px;-webkit-transform-origin:0 0}
.leaflet-marker-icon,.leaflet-marker-shadow{display:block}
.leaflet-container .leaflet-overlay-pane svg{max-width:none!important;max-height:none!important}
.leaflet-container.leaflet-touch-zoom{touch-action:pan-x pan-y}
.leaflet-container.leaflet-touch-drag{touch-action:pinch-zoom;touch-action:none}
.leaflet-container.leaflet-touch-drag.leaflet-touch-zoom{touch-action:none}
.leaflet-container{tap-highlight-color:transparent}
.leaflet-tile-container{pointer-events:none}
.leaflet-overlay-pane svg{-moz-user-select:none}
.leaflet-pane{z-index:400}
.leaflet-tile-pane{z-index:200}
.leaflet-overlay-pane{z-index:400}
.leaflet-shadow-pane{z-index:500}
.leaflet-marker-pane{z-index:600}
.leaflet-tooltip-pane{z-index:650}
.leaflet-popup-pane{z-index:700}
.leaflet-map-pane canvas{z-index:100}
.leaflet-map-pane svg{z-index:200}
.leaflet-control{position:relative;z-index:800;pointer-events:visiblePainted;pointer-events:auto}
.leaflet-top,.leaflet-bottom{position:absolute;z-index:1000;pointer-events:none}
.leaflet-top{top:0}.leaflet-right{right:0}.leaflet-bottom{bottom:0}.leaflet-left{left:0}
.leaflet-control{float:left;clear:both}
.leaflet-right .leaflet-control{float:right}
.leaflet-top .leaflet-control{margin-top:10px}
.leaflet-bottom .leaflet-control{margin-bottom:10px}
.leaflet-left .leaflet-control{margin-left:10px}
.leaflet-right .leaflet-control{margin-right:10px}
.leaflet-fade-anim .leaflet-popup{opacity:0;transition:opacity .2s linear}
.leaflet-fade-anim .leaflet-map-pane .leaflet-popup{opacity:1}
.leaflet-zoom-animated{transform-origin:left top}
svg.leaflet-zoom-animated{will-change:transform}
.leaflet-zoom-anim .leaflet-zoom-animated{transition:transform .25s cubic-bezier(0,0,.25,1)}
.leaflet-pan-anim .leaflet-tile,.leaflet-zoom-anim .leaflet-tile{transition:none}
.leaflet-zoom-anim .leaflet-zoom-animated{will-change:transform}
.leaflet-zoom-anim .leaflet-tile-container{transition:none;will-change:transform}
.leaflet-tile{filter:inherit;visibility:hidden}
.leaflet-tile-loaded{visibility:inherit}
.leaflet-tile-container{pointer-events:none}
.leaflet-interactive{cursor:pointer}
.leaflet-grab{cursor:grab}
.leaflet-crosshair,.leaflet-crosshair .leaflet-interactive{cursor:crosshair}
.leaflet-popup-pane,.leaflet-control{cursor:auto}
.leaflet-dragging .leaflet-grab,.leaflet-dragging .leaflet-grab .leaflet-interactive,.leaflet-dragging .leaflet-marker-draggable{cursor:move;cursor:grabbing}
.leaflet-marker-icon,.leaflet-marker-shadow,.leaflet-image-layer,.leaflet-pane>svg path,.leaflet-tile-container{pointer-events:none}
.leaflet-marker-icon.leaflet-interactive,.leaflet-image-layer.leaflet-interactive,.leaflet-pane>svg path.leaflet-interactive,svg.leaflet-image-layer.leaflet-interactive path{pointer-events:visiblePainted;pointer-events:auto}
.leaflet-container{background:#ddd;outline-offset:1px}
.leaflet-container a{color:#0078a8}
.leaflet-container{font-family:Helvetica Neue,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5}
.leaflet-bar{box-shadow:0 1px 5px rgba(0,0,0,.65);border-radius:4px}
.leaflet-bar a{background-color:#fff;border-bottom:1px solid #ccc;width:26px;height:26px;line-height:26px;display:block;text-align:center;text-decoration:none;color:black}
.leaflet-bar a:hover,.leaflet-bar a:focus{background-color:#f4f4f4}
.leaflet-bar a:first-child{border-top-left-radius:4px;border-top-right-radius:4px}
.leaflet-bar a:last-child{border-bottom-left-radius:4px;border-bottom-right-radius:4px;border-bottom:none}
.leaflet-bar a.leaflet-disabled{cursor:default;background-color:#f4f4f4;color:#bbb}
.leaflet-touch .leaflet-bar a{width:30px;height:30px;line-height:30px}
.leaflet-control-zoom-in,.leaflet-control-zoom-out{font:bold 18px Lucida Console,Monaco,monospace;text-indent:1px}
.leaflet-control-layers{box-shadow:0 1px 5px rgba(0,0,0,.4);background:#fff;border-radius:5px}
.leaflet-control-layers-toggle{background-image:url(https://unpkg.com/leaflet@1.9.4/dist/images/layers.png);width:36px;height:36px}
.leaflet-default-icon-path{background-image:url(https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png)}
.leaflet-container .leaflet-control-attribution{background:#fff;background:rgba(255,255,255,.8);margin:0}
.leaflet-control-attribution,.leaflet-control-scale-line{padding:0 5px;color:#333;line-height:1.4}
.leaflet-control-attribution a{text-decoration:none}
.leaflet-popup{position:absolute;text-align:center;margin-bottom:20px}
.leaflet-popup-content-wrapper,.leaflet-popup-tip{background:#fff;color:#333;box-shadow:0 3px 14px rgba(0,0,0,.4)}
.leaflet-popup-content-wrapper{padding:1px;text-align:left;border-radius:12px}
.leaflet-popup-tip-container{width:40px;height:20px;position:absolute;left:50%;margin-left:-20px;overflow:hidden;pointer-events:none}
.leaflet-popup-tip{width:17px;height:17px;padding:1px;margin:-10px auto 0;pointer-events:auto;transform:rotate(45deg)}
.leaflet-popup-content{margin:13px 24px 13px 20px;line-height:1.3;font-size:13px;min-height:1px}
.leaflet-popup-content p{margin:17px 0}
.leaflet-popup-close-button{position:absolute;top:0;right:0;border:none;text-align:center;width:24px;height:24px;font:16px/24px Tahoma,Verdana,sans-serif;color:#757575;text-decoration:none;background:transparent}
.leaflet-popup-close-button:hover{color:#585858}
.leaflet-popup-scrolled{overflow:auto}
.leaflet-div-icon{background:#fff;border:1px solid #666}
.leaflet-tooltip{position:absolute;padding:6px;background-color:#fff;border:1px solid #fff;border-radius:3px;color:#222;white-space:nowrap;user-select:none;pointer-events:none;box-shadow:0 1px 3px rgba(0,0,0,.4)}
.leaflet-control-attribution svg{display:inline!important}
`;

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

interface GeocodedItem {
  record: RentRecord;
  coords: [number, number];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  marker: any;
}

export default function MapPage() {
  const params = useParams();
  const id = params.id as string;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInitRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const [total, setTotal] = useState(0);
  const [geocodedCount, setGeocodedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("載入清單...");
  const [geocodedItems, setGeocodedItems] = useState<GeocodedItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Navigate to a specific item
  const goTo = useCallback((index: number) => {
    const items = geocodedItems;
    if (!mapInstanceRef.current || items.length === 0) return;
    const item = items[index];
    if (!item) return;
    setSelectedIndex(index);
    mapInstanceRef.current.setView(item.coords, 16, { animate: true });
    setTimeout(() => item.marker.openPopup(), 300);
  }, [geocodedItems]);

  useEffect(() => {
    if (mapInitRef.current) return;
    mapInitRef.current = true;

    async function init() {
      const style = document.createElement("style");
      style.textContent = LEAFLET_CSS;
      document.head.appendChild(style);

      const res = await fetch(`/api/lists/${id}`);
      const data = await res.json();
      if (data.error) { setStatus("載入失敗"); setLoading(false); return; }
      const recs: RentRecord[] = data.records;
      setTotal(recs.length);

      await new Promise<void>((resolve, reject) => {
        if ((window as unknown as Record<string, unknown>).L) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        s.onload = () => resolve();
        s.onerror = reject;
        document.head.appendChild(s);
      });

      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 50));

      if (!mapRef.current) { setStatus("地圖初始化失敗"); setLoading(false); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as unknown as { L: any }).L;
      const map = L.map(mapRef.current, { zoomControl: true }).setView([25.033, 121.565], 12);
      mapInstanceRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      setTimeout(() => map.invalidateSize(), 200);
      setLoading(false);
      setStatus(`正在定位 ${recs.length} 筆房源...`);

      let done = 0;
      const bounds: [number, number][] = [];
      const collected: GeocodedItem[] = [];

      for (const r of recs) {
        const query = [r.address, r.district, "台灣"].filter(Boolean).join(" ");
        const coords = await geocode(query);
        if (coords) {
          bounds.push(coords);
          const priceText = r.price ? `NT$${r.price.toLocaleString()}/月` : "價格未知";
          const popup = `<div style="font-family:sans-serif;min-width:150px;line-height:1.4">
            <div style="font-weight:700;font-size:15px;color:#E8572A;margin-bottom:3px">${priceText}</div>
            <div style="font-size:13px;color:#333">${r.title || ""}</div>
            ${r.district ? `<div style="font-size:11px;color:#888;margin-top:2px">${r.district}</div>` : ""}
            ${r.subsidyEligible ? `<div style="font-size:11px;color:#065F46;margin-top:4px;font-weight:600">✓ 可租補</div>` : ""}
          </div>`;
          const marker = L.marker(coords).addTo(map).bindPopup(popup);
          collected.push({ record: r, coords, marker });
          setGeocodedItems([...collected]);
        }
        done++;
        setGeocodedCount(done);
        await new Promise((r) => setTimeout(r, 1100));
      }

      if (bounds.length > 0) map.fitBounds(bounds, { padding: [40, 40] });
      setStatus(`完成！共定位 ${bounds.length} / ${recs.length} 筆`);
    }

    init().catch((err) => {
      console.error("Map init error:", err);
      setStatus("初始化失敗：" + err.message);
      setLoading(false);
    });
  }, [id]);

  const currentItem = selectedIndex !== null ? geocodedItems[selectedIndex] : null;
  const hasItems = geocodedItems.length > 0;

  return (
    <main style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Navbar */}
      <nav style={{
        flexShrink: 0,
        background: "#FAFAF8", borderBottom: "1px solid #E8E6E0",
        padding: "0 16px", height: 52,
        display: "flex", alignItems: "center", gap: 12,
        zIndex: 1000,
      }}>
        <a href={`/list/${id}`} style={{
          fontSize: 13, fontWeight: 500, color: "#888882",
          textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
        }}>
          ← 回清單
        </a>
        <span style={{ fontSize: 13, color: "#1A1A18", fontWeight: 600 }}>地圖總覽</span>
      </nav>

      {/* Status bar */}
      <div style={{
        flexShrink: 0,
        padding: "7px 16px",
        background: "white", borderBottom: "1px solid #E8E6E0",
        fontSize: 12, color: "#888882",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        {loading
          ? <Loader2 style={{ width: 13, height: 13, animation: "spin 1s linear infinite", flexShrink: 0 }} />
          : <MapPin style={{ width: 13, height: 13, flexShrink: 0 }} />
        }
        <span>{status}</span>
        {total > 0 && (
          <span style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>
            {geocodedCount} / {total} 定位完成
          </span>
        )}
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ flex: 1, width: "100%", minHeight: 0 }} />

      {/* Bottom navigation card */}
      {hasItems && (
        <div style={{
          flexShrink: 0,
          background: "white",
          borderTop: "1px solid #E8E6E0",
          padding: "12px 16px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          display: "flex",
          alignItems: "center",
          gap: 10,
          zIndex: 1000,
        }}>
          {/* Prev */}
          <button
            onClick={() => goTo(Math.max(0, (selectedIndex ?? 0) - 1))}
            disabled={selectedIndex === null || selectedIndex === 0}
            style={{
              width: 36, height: 36, borderRadius: 18,
              border: "1px solid #E8E6E0",
              background: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: selectedIndex === null || selectedIndex === 0 ? "not-allowed" : "pointer",
              opacity: selectedIndex === null || selectedIndex === 0 ? 0.35 : 1,
              flexShrink: 0, touchAction: "manipulation",
            }}
          >
            <ChevronLeft style={{ width: 18, height: 18, color: "#1A1A18" }} />
          </button>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {currentItem ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#E8572A" }}>
                    {currentItem.record.price
                      ? `NT$${currentItem.record.price.toLocaleString()}/月`
                      : "價格未知"}
                  </span>
                  <span style={{ fontSize: 11, color: "#888882" }}>
                    {(selectedIndex ?? 0) + 1} / {geocodedItems.length}
                  </span>
                </div>
                <div style={{
                  fontSize: 13, color: "#1A1A18", marginTop: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {currentItem.record.title || currentItem.record.district || "未命名"}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "#888882" }}>
                按左右按鈕逐一瀏覽 · 共 {geocodedItems.length} 筆定位
              </div>
            )}
          </div>

          {/* Next */}
          <button
            onClick={() => goTo(Math.min(geocodedItems.length - 1, (selectedIndex ?? -1) + 1))}
            disabled={selectedIndex !== null && selectedIndex >= geocodedItems.length - 1}
            style={{
              width: 36, height: 36, borderRadius: 18,
              border: "1px solid #E8E6E0",
              background: selectedIndex === null ? "#E8572A" : "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: selectedIndex !== null && selectedIndex >= geocodedItems.length - 1
                ? "not-allowed" : "pointer",
              opacity: selectedIndex !== null && selectedIndex >= geocodedItems.length - 1 ? 0.35 : 1,
              flexShrink: 0, touchAction: "manipulation",
            }}
          >
            <ChevronRight style={{
              width: 18, height: 18,
              color: selectedIndex === null ? "white" : "#1A1A18",
            }} />
          </button>
        </div>
      )}
    </main>
  );
}
