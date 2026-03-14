"use client";

import { useEffect, useState, useCallback } from "react";
import { Home, Cloud, Check, Loader2 } from "lucide-react";
import { RentInput } from "@/components/RentInput";
import { RentTable } from "@/components/RentTable";
import { ExportBar } from "@/components/ExportBar";
import { getRecords, saveRecords, addRecords, deleteRecord } from "@/lib/storage";
import type { RentRecord } from "@/lib/schema";

export default function Page() {
  const [records, setRecords] = useState<RentRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get("data");

    if (dataParam) {
      try {
        const json = decodeURIComponent(escape(atob(dataParam)));
        const shared = JSON.parse(json) as RentRecord[];
        setRecords(shared);
        window.history.replaceState({}, "", window.location.pathname);
      } catch {
        setRecords(getRecords());
      }
    } else {
      setRecords(getRecords());
    }
  }, []);

  const handleResults = useCallback((results: unknown[]) => {
    const merged = addRecords(results as RentRecord[]);
    setRecords(merged);
    setSavedUrl('');
  }, []);

  const handleDelete = useCallback((id: string) => {
    const updated = deleteRecord(id);
    setRecords(updated);
    setSavedUrl('');
  }, []);

  const handleClearAll = useCallback(() => {
    saveRecords([]);
    setRecords([]);
    setSavedUrl('');
  }, []);

  const handleSaveToCloud = useCallback(async () => {
    if (!records.length) return;
    const name = prompt('幫這個清單取個名字（方便識別）：', '我的租屋清單');
    if (!name) return;

    setSaving(true);
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, records }),
      });
      const data = await res.json();
      if (data.id) {
        const url = `${window.location.origin}/list/${data.id}`;
        setSavedUrl(url);
      }
    } catch (e) {
      alert('儲存失敗，請稍後再試');
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [records]);

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(savedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [savedUrl]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Home className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              FB 租屋過濾器
            </h1>
          </div>
          <p className="text-gray-500 text-sm">
            貼上 Facebook 租屋社團的貼文，用 AI 萃取結構化的租屋資料
          </p>
        </div>

        {/* Input */}
        <section className="mb-8">
          <RentInput onResults={handleResults} />
        </section>

        {/* Actions bar */}
        {records.length > 0 && (
          <section className="mb-4 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <ExportBar records={records} />
              <button
                onClick={handleSaveToCloud}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Cloud className="h-3.5 w-3.5" />
                )}
                儲存到雲端並分享
              </button>
            </div>
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              清除全部
            </button>
          </section>
        )}

        {/* Saved URL */}
        {savedUrl && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <Check className="h-4 w-4 text-green-600 shrink-0" />
            <span className="text-sm text-green-800 truncate flex-1">{savedUrl}</span>
            <button
              onClick={handleCopyUrl}
              className="text-sm text-green-700 hover:text-green-900 font-medium shrink-0"
            >
              {copied ? '已複製！' : '複製連結'}
            </button>
          </div>
        )}

        {/* Table */}
        <section>
          <RentTable records={records} onDelete={handleDelete} />
        </section>
      </div>
    </main>
  );
}
