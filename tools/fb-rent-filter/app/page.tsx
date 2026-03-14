"use client";

import { useEffect, useState, useCallback } from "react";
import { Home } from "lucide-react";
import { RentInput } from "@/components/RentInput";
import { RentTable } from "@/components/RentTable";
import { ExportBar } from "@/components/ExportBar";
import { getRecords, saveRecords, addRecords, deleteRecord } from "@/lib/storage";
import type { RentRecord } from "@/lib/schema";

export default function Page() {
  const [records, setRecords] = useState<RentRecord[]>([]);

  useEffect(() => {
    // Check for shared data in URL
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get("data");

    if (dataParam) {
      try {
        const json = decodeURIComponent(escape(atob(dataParam)));
        const shared = JSON.parse(json) as RentRecord[];
        setRecords(shared);
        // Clean up URL
        window.history.replaceState({}, "", window.location.pathname);
      } catch {
        // Invalid data, fall back to localStorage
        setRecords(getRecords());
      }
    } else {
      setRecords(getRecords());
    }
  }, []);

  const handleResults = useCallback((results: unknown[]) => {
    const merged = addRecords(results as RentRecord[]);
    setRecords(merged);
  }, []);

  const handleDelete = useCallback((id: string) => {
    const updated = deleteRecord(id);
    setRecords(updated);
  }, []);

  const handleClearAll = useCallback(() => {
    saveRecords([]);
    setRecords([]);
  }, []);

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

        {/* Export + Clear */}
        <section className="mb-4 flex items-center justify-between">
          <ExportBar records={records} />
          {records.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              清除全部
            </button>
          )}
        </section>

        {/* Table */}
        <section>
          <RentTable records={records} onDelete={handleDelete} />
        </section>
      </div>
    </main>
  );
}
