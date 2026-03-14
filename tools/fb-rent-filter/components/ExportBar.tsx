"use client";

import { Download, FileJson, Cloud } from "lucide-react";
import type { RentRecord } from "@/lib/schema";

interface ExportBarProps {
  records: RentRecord[];
  onToast: (message: string) => void;
  onCloudSave?: () => void;
}

export function ExportBar({ records, onToast, onCloudSave }: ExportBarProps) {
  if (records.length === 0) return null;

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = [
      "標題", "月租", "押金", "地區", "地址", "坪數",
      "房型", "樓層", "特色", "聯絡方式", "可入住時間", "萃取時間",
    ];
    const rows = records.map((r) => [
      r.title, r.price ?? "", r.deposit ?? "", r.district ?? "",
      r.address ?? "", r.size ?? "", r.roomType ?? "", r.floor ?? "",
      r.features.join("、"), r.contact ?? "", r.moveInDate ?? "", r.extractedAt,
    ]);

    const csvEscape = (v: unknown) => {
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const csv =
      "\uFEFF" +
      [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

    downloadFile(csv, "rent-records.csv", "text/csv;charset=utf-8");
    onToast("CSV 已下載");
  };

  const exportJSON = () => {
    downloadFile(
      JSON.stringify(records, null, 2),
      "rent-records.json",
      "application/json",
    );
    onToast("JSON 已下載");
  };

  const iconBtnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius-sm)",
    border: "none",
    background: "transparent",
    color: "var(--c-muted)",
    cursor: "pointer",
    transition: "all 0.15s",
    touchAction: "manipulation",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <button
        onClick={exportCSV}
        style={iconBtnStyle}
        title="下載 CSV"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--c-border)";
          e.currentTarget.style.color = "var(--c-text)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--c-muted)";
        }}
      >
        <Download style={{ width: 16, height: 16 }} />
      </button>
      <button
        onClick={exportJSON}
        style={iconBtnStyle}
        title="下載 JSON"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--c-border)";
          e.currentTarget.style.color = "var(--c-text)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--c-muted)";
        }}
      >
        <FileJson style={{ width: 16, height: 16 }} />
      </button>
      {onCloudSave && <button
        onClick={onCloudSave}
        style={iconBtnStyle}
        title="儲存到雲端"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--c-border)";
          e.currentTarget.style.color = "var(--c-text)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--c-muted)";
        }}
      >
        <Cloud style={{ width: 16, height: 16 }} />
      </button>}
    </div>
  );
}
