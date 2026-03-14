"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { RentRecord } from "@/lib/schema";

// Leaflet 核心 CSS（inline，確保在地圖初始化前載入）
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
.leaflet-vml-shape{width:1px;height:1px}
.lvml{behavior:url(#default#VML);display:inline-block;position:absolute}
.leaflet-control{position:relative;z-index:800;pointer-events:visiblePainted;pointer-events:auto}
.leaflet-top,.leaflet-bottom{position:absolute;z-index:1000;pointer-events:none}
.leaflet-top{top:0}
.leaflet-right{right:0}
.leaflet-bottom{bottom:0}
.leaflet-left{left:0}
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
.leaflet-zoom-box{width:0;height:0;box-sizing:border-box;z-index:800}
.leaflet-overlay-pane svg,.leaflet-zoom-box{width:inherit}
.leaflet-interactive{cursor:pointer}
.leaflet-grab{cursor:grab}
.leaflet-crosshair,.leaflet-crosshair .leaflet-interactive{cursor:crosshair}
.leaflet-popup-pane,.leaflet-control{cursor:auto}
.leaflet-dragging .leaflet-grab,.leaflet-dragging .leaflet-grab .leaflet-interactive,.leaflet-dragging .leaflet-marker-draggable{cursor:move;cursor:grabbing}
.leaflet-marker-icon,.leaflet-marker-shadow,.leaflet-image-layer,.leaflet-pane>svg path,.leaflet-tile-container{pointer-events:none}
.leaflet-marker-icon.leaflet-interactive,.leaflet-image-layer.leaflet-interactive,.leaflet-pane>svg path.leaflet-interactive,svg.leaflet-image-layer.leaflet-interactive path{pointer-events:visiblePainted;pointer-events:auto}
.leaflet-container{background:#ddd;outline-offset:1px}
.leaflet-container a{color:#0078a8}
.leaflet-zoom-box{border:2px dotted #38f;background:rgba(255,255,255,.5)}
.leaflet-container{font-family:Helvetica Neue,Arial,Helvetica,sans-serif;font-size:.75rem;font-size:12px;line-height:1.5}
.leaflet-bar{box-shadow:0 1px 5px rgba(0,0,0,.65);border-radius:4px}
.leaflet-bar a{background-color:#fff;border-bottom:1px solid #ccc;width:26px;height:26px;line-height:26px;display:block;text-align:center;text-decoration:none;color:black}
.leaflet-bar a,.leaflet-control-layers-toggle{background-position:50% 50%;background-repeat:no-repeat;display:block}
.leaflet-bar a:hover,.leaflet-bar a:focus{background-color:#f4f4f4}
.leaflet-bar a:first-child{border-top-left-radius:4px;border-top-right-radius:4px}
.leaflet-bar a:last-child{border-bottom-left-radius:4px;border-bottom-right-radius:4px;border-bottom:none}
.leaflet-bar a.leaflet-disabled{cursor:default;background-color:#f4f4f4;color:#bbb}
.leaflet-touch .leaflet-bar a{width:30px;height:30px;line-height:30px}
.leaflet-touch .leaflet-bar a:first-child{border-top-left-radius:2px;border-top-right-radius:2px}
.leaflet-touch .leaflet-bar a:last-child{border-bottom-left-radius:2px;border-bottom-right-radius:2px}
.leaflet-control-zoom-in,.leaflet-control-zoom-out{font:bold 18px Lucida Console,Monaco,monospace;text-indent:1px}
.leaflet-touch .leaflet-control-zoom-in{font-size:22px}
.leaflet-touch .leaflet-control-zoom-out{font-size:20px}
.leaflet-control-layers{box-shadow:0 1px 5px rgba(0,0,0,.4);background:#fff;border-radius:5px}
.leaflet-control-layers-toggle{background-image:url(https://unpkg.com/leaflet@1.9.4/dist/images/layers.png);width:36px;height:36px}
.leaflet-retina .leaflet-control-layers-toggle{background-image:url(https://unpkg.com/leaflet@1.9.4/dist/images/layers-2x.png);background-size:26px 26px}
.leaflet-touch .leaflet-control-layers-toggle{width:44px;height:44px}
.leaflet-control-layers .leaflet-control-layers-list,.leaflet-control-layers-expanded .leaflet-control-layers-toggle{display:none}
.leaflet-control-layers-expanded .leaflet-control-layers-list{display:block;position:relative}
.leaflet-control-layers-expanded{padding:6px 10px 6px 6px;color:#333;background:#fff}
.leaflet-control-layers-scrollbar{overflow-y:scroll;overflow-x:hidden;padding-right:5px}
.leaflet-control-layers-selector{margin-top:2px;position:relative;top:1px}
.leaflet-control-layers label{display:block;font-size:13px;font-size:1.08333em}
.leaflet-control-layers-separator{height:0;border-top:1px solid #ddd;margin:5px -10px 5px -6px}
.leaflet-default-icon-path{background-image:url(https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png)}
.leaflet-container .leaflet-control-attribution{background:#fff;background:rgba(255,255,255,.8);margin:0}
.leaflet-control-attribution,.leaflet-control-scale-line{padding:0 5px;color:#333;line-height:1.4}
.leaflet-control-attribution a{text-decoration:none}
.leaflet-control-attribution a:hover,.leaflet-control-attribution a:focus{text-decoration:underline}
.leaflet-attribution-flag{display:inline!important;vertical-align:baseline!important;width:1em;height:.6669em}
.leaflet-left .leaflet-control-scale{margin-left:5px}
.leaflet-bottom .leaflet-control-scale{margin-bottom:5px}
.leaflet-control-scale-line{border:2px solid #777;border-top:none;line-height:1.1;padding:2px 5px 1px;font-size:11px;white-space:nowrap;overflow:hidden;box-sizing:border-box;background:#fff;background:rgba(255,255,255,.5)}
.leaflet-control-scale-line:not(:first-child){border-top:2px solid #777;border-bottom:none;margin-top:-2px}
.leaflet-control-scale-line:not(:first-child):not(:last-child){border-bottom:2px solid #777}
.leaflet-touch .leaflet-control-attribution,.leaflet-touch .leaflet-control-layers,.leaflet-touch .leaflet-bar{box-shadow:none}
.leaflet-touch .leaflet-control-layers,.leaflet-touch .leaflet-bar{border:2px solid rgba(0,0,0,.2);background-clip:padding-box}
.leaflet-popup{position:absolute;text-align:center;margin-bottom:20px}
.leaflet-popup-content-wrapper,.leaflet-popup-tip{background:#fff;color:#333;box-shadow:0 3px 14px rgba(0,0,0,.4)}
.leaflet-popup-content-wrapper{padding:1px;text-align:left;border-radius:12px}
.leaflet-popup-tip-container{width:40px;height:20px;position:absolute;left:50%;margin-left:-20px;overflow:hidden;pointer-events:none}
.leaflet-popup-tip{width:17px;height:17px;padding:1px;margin:-10px auto 0;pointer-events:auto;transform:rotate(45deg)}
.leaflet-popup-content-wrapper a{color:#0078a8}
.leaflet-popup-content{margin:13px 24px 13px 20px;line-height:1.3;font-size:13px;font-size:1.08333em;min-height:1px}
.leaflet-popup-content p{margin:17px 0}
.leaflet-popup-close-button{position:absolute;top:0;right:0;border:none;text-align:center;width:24px;height:24px;font:16px/24px Tahoma,Verdana,sans-serif;color:#757575;text-decoration:none;background:transparent}
.leaflet-popup-close-button:hover,.leaflet-popup-close-button:focus{color:#585858}
.leaflet-popup-scrolled{overflow:auto}
.leaflet-oldie .leaflet-popup-content-wrapper{zoom:1}
.leaflet-oldie .leaflet-popup-tip{width:24px;margin:0 auto}
.leaflet-oldie .leaflet-control-zoom,.leaflet-oldie .leaflet-control-layers,.leaflet-oldie .leaflet-popup-content-wrapper,.leaflet-oldie .leaflet-popup-tip{border:1px solid #999}
.leaflet-div-icon{background:#fff;border:1px solid #666}
.leaflet-tooltip{position:absolute;padding:6px;background-color:#fff;border:1px solid #fff;border-radius:3px;color:#222;white-space:nowrap;-webkit-user-select:none;-moz-user-select:none;user-select:none;pointer-events:none;box-shadow:0 1px 3px rgba(0,0,0,.4)}
.leaflet-tooltip.leaflet-interactive{cursor:pointer;pointer-events:auto}
.leaflet-tooltip-top:before,.leaflet-tooltip-bottom:before,.leaflet-tooltip-left:before,.leaflet-tooltip-right:before{position:absolute;pointer-events:none;border:6px solid transparent;background:transparent;content:""}
.leaflet-tooltip-bottom:before,.leaflet-tooltip-top:before{left:50%;margin-left:-6px}
.leaflet-tooltip-top:before{bottom:0;margin-bottom:-12px;border-top-color:#fff}
.leaflet-tooltip-bottom:before{top:0;margin-top:-12px;margin-left:-6px;border-bottom-color:#fff}
.leaflet-tooltip-left:before{right:0;margin-right:-12px;margin-top:-6px;border-left-color:#fff}
.leaflet-tooltip-right:before{left:0;margin-left:-12px;margin-top:-6px;border-right-color:#fff}
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

export default function MapPage() {
  const params = useParams();
  const id = params.id as string;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInitRef = useRef(false);
  const [records, setRecords] = useState<RentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("載入清單...");
  const [geocoded, setGeocoded] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (mapInitRef.current) return;
    mapInitRef.current = true;

    async function init() {
      // 1. 注入 Leaflet CSS inline
      const style = document.createElement("style");
      style.textContent = LEAFLET_CSS;
      document.head.appendChild(style);

      // 2. 載入清單
      const res = await fetch(`/api/lists/${id}`);
      const data = await res.json();
      if (data.error) { setStatus("載入失敗"); setLoading(false); return; }
      const recs: RentRecord[] = data.records;
      setRecords(recs);
      setTotal(recs.length);

      // 3. 載入 Leaflet JS
      await new Promise<void>((resolve, reject) => {
        if ((window as unknown as Record<string, unknown>).L) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });

      // 4. 等 DOM paint
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 50));

      if (!mapRef.current) { setStatus("地圖初始化失敗"); setLoading(false); return; }

      // 5. 初始化地圖
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as unknown as { L: any }).L;
      const map = L.map(mapRef.current, { zoomControl: true }).setView([25.033, 121.565], 12);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      setTimeout(() => map.invalidateSize(), 200);

      setLoading(false);
      setStatus(`正在定位 ${recs.length} 筆房源...`);

      // 6. 逐一 geocode
      let done = 0;
      const bounds: [number, number][] = [];

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
          L.marker(coords).addTo(map).bindPopup(popup);
        }
        done++;
        setGeocoded(done);
        await new Promise((r) => setTimeout(r, 1100));
      }

      // 自動 fit 所有 marker
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }

      setStatus(`完成！共定位 ${bounds.length} / ${recs.length} 筆`);
    }

    init().catch((err) => {
      console.error("Map init error:", err);
      setStatus("初始化失敗：" + err.message);
      setLoading(false);
    });
  }, [id]);

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
        background: "white",
        borderBottom: "1px solid #E8E6E0",
        fontSize: 12, color: "#888882",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span>{loading ? "⏳" : "📍"}</span>
        <span>{status}</span>
        {total > 0 && (
          <span style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>
            {geocoded} / {total} 定位完成
          </span>
        )}
      </div>

      {/* Map — flex: 1 fills remaining height */}
      <div ref={mapRef} style={{ flex: 1, width: "100%", minHeight: 0 }} />
    </main>
  );
}
