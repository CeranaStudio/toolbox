"use client";

import { Download, Link, FileJson } from "lucide-react";
import type { RentRecord } from "@/lib/schema";

interface ExportBarProps {
  records: RentRecord[];
  onToast: (message: string) => void;
}

export function ExportBar({ records, onToast }: ExportBarProps) {
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
      "標題",
      "月租",
      "押金",
      "地區",
      "地址",
      "坪數",
      "房型",
      "樓層",
      "特色",
      "聯絡方式",
      "可入住時間",
      "萃取時間",
    ];
    const rows = records.map((r) => [
      r.title,
      r.price ?? "",
      r.deposit ?? "",
      r.district ?? "",
      r.address ?? "",
      r.size ?? "",
      r.roomType ?? "",
      r.floor ?? "",
      r.features.join("、"),
      r.contact ?? "",
      r.moveInDate ?? "",
      r.extractedAt,
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

  const copyShareLink = async () => {
    const data = btoa(encodeURIComponent(JSON.stringify(records)));
    const url = `${window.location.origin}${window.location.pathname}?data=${data}`;
    await navigator.clipboard.writeText(url);
    onToast("分享連結已複製到剪貼簿！");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-stone-muted tabular-nums">
        {records.length} 筆
      </span>
      <span className="text-stone-border">|</span>
      <button
        onClick={exportCSV}
        className="inline-flex items-center gap-1.5 text-sm text-stone-muted hover:text-charcoal transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        CSV
      </button>
      <button
        onClick={exportJSON}
        className="inline-flex items-center gap-1.5 text-sm text-stone-muted hover:text-charcoal transition-colors"
      >
        <FileJson className="h-3.5 w-3.5" />
        JSON
      </button>
      <button
        onClick={copyShareLink}
        className="inline-flex items-center gap-1.5 text-sm text-stone-muted hover:text-charcoal transition-colors"
      >
        <Link className="h-3.5 w-3.5" />
        複製連結
      </button>
    </div>
  );
}
