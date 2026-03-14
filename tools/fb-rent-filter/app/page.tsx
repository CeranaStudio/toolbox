"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Cloud, Check, Loader2, X } from "lucide-react";
import { RentInput } from "@/components/RentInput";
import { RentTable } from "@/components/RentTable";
import { ExportBar } from "@/components/ExportBar";
import { getRecords, saveRecords, addRecords, deleteRecord } from "@/lib/storage";
import type { RentRecord } from "@/lib/schema";

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_0.3s_ease-out]">
      <div className="flex items-center gap-2 bg-charcoal text-warm-white text-sm px-5 py-3">
        <Check className="h-4 w-4 text-accent shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}

export default function Page() {
  const [records, setRecords] = useState<RentRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showCloudPanel, setShowCloudPanel] = useState(false);
  const [cloudName, setCloudName] = useState('我的租屋清單');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const cloudInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get("data");

    if (dataParam) {
      try {
        const json = decodeURIComponent(atob(dataParam));
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

  useEffect(() => {
    if (showCloudPanel && cloudInputRef.current) {
      cloudInputRef.current.focus();
      cloudInputRef.current.select();
    }
  }, [showCloudPanel]);

  const handleResults = useCallback((results: unknown[]) => {
    const merged = addRecords(results as RentRecord[]);
    setRecords(merged);
    setSavedUrl('');
    showToast(`成功分析 ${results.length} 筆租屋資料`);
  }, [showToast]);

  const handleDelete = useCallback((id: string) => {
    const updated = deleteRecord(id);
    setRecords(updated);
    setSavedUrl('');
  }, []);

  const handleClearAll = useCallback(() => {
    saveRecords([]);
    setRecords([]);
    setSavedUrl('');
    setShowClearConfirm(false);
    showToast('已清除全部資料');
  }, [showToast]);

  const handleSaveToCloud = useCallback(async () => {
    if (!records.length || !cloudName.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cloudName.trim(), records }),
      });
      const data = await res.json();
      if (data.id) {
        const url = `${window.location.origin}/list/${data.id}`;
        setSavedUrl(url);
        setShowCloudPanel(false);
        showToast('已儲存到雲端！');
      }
    } catch (e) {
      showToast('儲存失敗，請稍後再試');
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [records, cloudName, showToast]);

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(savedUrl);
    setCopied(true);
    showToast('連結已複製！');
    setTimeout(() => setCopied(false), 2000);
  }, [savedUrl, showToast]);

  return (
    <main className="min-h-screen">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8 lg:px-12">
        {/* Header */}
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.svg" alt="" className="h-8 w-8" />
            <span className="text-xs tracking-widest uppercase text-stone-muted font-medium">
              FB Rent Filter
            </span>
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-charcoal leading-tight">
            租屋過濾器
          </h1>
          <p className="mt-4 text-lg text-stone-muted font-light max-w-md">
            把雜亂的 FB 租屋貼文，變成清晰的比較表格
          </p>
          <div className="mt-6 w-16 h-px bg-accent" />
        </header>

        {/* Input */}
        <section className="mb-12">
          <RentInput onResults={handleResults} />
        </section>

        {/* Actions bar */}
        {records.length > 0 && (
          <section className="mb-6 flex flex-wrap items-center gap-3 justify-between border-b border-stone-border pb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <ExportBar records={records} onToast={showToast} />
              <button
                onClick={() => setShowCloudPanel(true)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-sm bg-charcoal text-warm-white px-4 py-2 hover:bg-charcoal-light disabled:opacity-50 transition-colors font-medium"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Cloud className="h-3.5 w-3.5" />
                )}
                儲存到雲端
              </button>
            </div>
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-sm text-stone-muted hover:text-red-600 transition-colors"
              >
                清除全部
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">確定要清除？</span>
                <button
                  onClick={handleClearAll}
                  className="text-sm text-white bg-red-600 px-3 py-1 hover:bg-red-700 transition-colors"
                >
                  確定
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-sm text-stone-muted hover:text-charcoal transition-colors"
                >
                  取消
                </button>
              </div>
            )}
          </section>
        )}

        {/* Cloud save panel */}
        {showCloudPanel && (
          <div className="mb-6 border border-stone-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-charcoal">儲存到雲端並分享</h3>
              <button
                onClick={() => setShowCloudPanel(false)}
                className="text-stone-muted hover:text-charcoal transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                ref={cloudInputRef}
                type="text"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                placeholder="清單名稱"
                className="flex-1 border border-stone-border bg-white px-4 py-2.5 text-sm focus:border-charcoal focus:outline-none transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveToCloud();
                }}
              />
              <button
                onClick={handleSaveToCloud}
                disabled={saving || !cloudName.trim()}
                className="inline-flex items-center gap-1.5 bg-charcoal px-5 py-2.5 text-sm font-medium text-warm-white hover:bg-charcoal-light disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Cloud className="h-3.5 w-3.5" />
                )}
                儲存
              </button>
            </div>
          </div>
        )}

        {/* Saved URL */}
        {savedUrl && (
          <div className="mb-6 flex items-center gap-2 border border-accent/30 bg-accent/5 px-5 py-3.5">
            <Check className="h-4 w-4 text-accent shrink-0" />
            <span className="text-sm text-charcoal truncate flex-1">{savedUrl}</span>
            <button
              onClick={handleCopyUrl}
              className="text-sm text-accent hover:text-accent-hover font-medium shrink-0 transition-colors"
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

      {/* Toast */}
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}
    </main>
  );
}
