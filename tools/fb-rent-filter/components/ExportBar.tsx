"use client";

import { Download, Link, FileJson } from "lucide-react";
import type { RentRecord } from "@/lib/schema";

interface ExportBarProps {
  records: RentRecord[];
}

export function ExportBar({ records }: ExportBarProps) {
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

    const escape = (v: unknown) => {
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const csv =
      "\uFEFF" +
      [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");

    downloadFile(csv, "rent-records.csv", "text/csv;charset=utf-8");
  };

  const exportJSON = () => {
    downloadFile(
      JSON.stringify(records, null, 2),
      "rent-records.json",
      "application/json",
    );
  };

  const copyShareLink = async () => {
    const data = btoa(
      unescape(encodeURIComponent(JSON.stringify(records))),
    );
    const url = `${window.location.origin}${window.location.pathname}?data=${data}`;
    await navigator.clipboard.writeText(url);
    alert("分享連結已複製到剪貼簿！");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={exportCSV}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
      >
        <Download className="h-4 w-4" />
        匯出 CSV
      </button>
      <button
        onClick={exportJSON}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
      >
        <FileJson className="h-4 w-4" />
        匯出 JSON
      </button>
      <button
        onClick={copyShareLink}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
      >
        <Link className="h-4 w-4" />
        複製分享連結
      </button>
    </div>
  );
}
