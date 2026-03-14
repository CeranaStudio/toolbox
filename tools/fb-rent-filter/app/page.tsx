"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Check, Loader2, X } from "lucide-react";
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
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        animation: "slideUp 0.3s ease-out",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--c-text)",
          color: "var(--c-bg)",
          fontSize: 14,
          padding: "10px 20px",
          borderRadius: 8,
        }}
      >
        <Check style={{ width: 16, height: 16, color: "var(--c-accent)", flexShrink: 0 }} />
        <span>{message}</span>
      </div>
    </div>
  );
}

export default function Page() {
  const [records, setRecords] = useState<RentRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showCloudPanel, setShowCloudPanel] = useState(false);
  const [cloudName, setCloudName] = useState("我的租屋清單");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const cloudInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    setRecords(getRecords());
  }, []);

  useEffect(() => {
    if (showCloudPanel && cloudInputRef.current) {
      cloudInputRef.current.focus();
      cloudInputRef.current.select();
    }
  }, [showCloudPanel]);

  const handleResults = useCallback(
    (results: unknown[]) => {
      const merged = addRecords(results as RentRecord[]);
      setRecords(merged);
      setSavedUrl("");
      showToast(`成功分析 ${results.length} 筆租屋資料`);
    },
    [showToast],
  );

  const handleDelete = useCallback((id: string) => {
    const updated = deleteRecord(id);
    setRecords(updated);
    setSavedUrl("");
  }, []);

  const handleClearAll = useCallback(() => {
    saveRecords([]);
    setRecords([]);
    setSavedUrl("");
    setShowClearConfirm(false);
    showToast("已清除全部資料");
  }, [showToast]);

  const handleSaveToCloud = useCallback(async () => {
    if (!records.length || !cloudName.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cloudName.trim(), records }),
      });
      const data = await res.json();
      if (data.id) {
        const url = `${window.location.origin}/list/${data.id}`;
        setSavedUrl(url);
        setShowCloudPanel(false);
        showToast("已儲存到雲端！");
      }
    } catch (e) {
      showToast("儲存失敗，請稍後再試");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [records, cloudName, showToast]);

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(savedUrl);
    setCopied(true);
    showToast("連結已複製！");
    setTimeout(() => setCopied(false), 2000);
  }, [savedUrl, showToast]);

  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Sticky header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "var(--c-bg)",
          borderBottom: "1px solid var(--c-border)",
          height: 56,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 960,
            width: "100%",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <img src="/logo.svg" alt="" style={{ width: 24, height: 24 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)", letterSpacing: "-0.01em" }}>
            FB 租屋過濾器
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px" }}>
        {/* Hero */}
        <section style={{ paddingTop: 56, paddingBottom: 40 }}>
          <h1
            style={{
              fontSize: "clamp(36px, 6vw, 52px)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "var(--c-text)",
            }}
          >
            從 FB 貼文
            <br />
            <span style={{ color: "var(--c-accent)" }}>找到你的家</span>
          </h1>
          <p style={{ marginTop: 14, fontSize: 16, color: "var(--c-muted)", maxWidth: 360 }}>
            貼上貼文，AI 幫你整理重點
          </p>
        </section>

        {/* Input — directly under hero */}
        <section style={{ paddingBottom: 48 }}>
          <RentInput onResults={handleResults} />
        </section>

        {/* Actions bar */}
        {records.length > 0 && (
          <section
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: "1px solid var(--c-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--c-text)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {records.length} 筆結果
              </span>
              <ExportBar records={records} onToast={showToast} onCloudSave={() => setShowCloudPanel(true)} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  style={{
                    fontSize: 12,
                    color: "var(--c-muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  清除全部
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#dc2626" }}>確定？</span>
                  <button
                    onClick={handleClearAll}
                    style={{
                      fontSize: 12,
                      color: "white",
                      background: "#dc2626",
                      border: "none",
                      padding: "4px 12px",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    確定
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    style={{
                      fontSize: 12,
                      color: "var(--c-muted)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Cloud save panel */}
        {showCloudPanel && (
          <div
            style={{
              marginBottom: 20,
              border: "1px solid var(--c-border)",
              borderRadius: 12,
              padding: 20,
              background: "var(--c-surface)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>儲存到雲端</h3>
              <button
                onClick={() => setShowCloudPanel(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-muted)", padding: 4 }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                ref={cloudInputRef}
                type="text"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                placeholder="清單名稱"
                style={{
                  flex: 1,
                  border: "1px solid var(--c-border)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 14,
                  outline: "none",
                  background: "var(--c-bg)",
                  fontFamily: "inherit",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveToCloud();
                }}
              />
              <button
                onClick={handleSaveToCloud}
                disabled={saving || !cloudName.trim()}
                style={{
                  background: "var(--c-accent)",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: saving || !cloudName.trim() ? "not-allowed" : "pointer",
                  opacity: saving || !cloudName.trim() ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "inherit",
                }}
              >
                {saving ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : null}
                儲存
              </button>
            </div>
          </div>
        )}

        {/* Saved URL */}
        {savedUrl && (
          <div
            style={{
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--c-accent-light)",
              border: "1px solid rgba(232,87,42,0.15)",
              borderRadius: 8,
              padding: "12px 16px",
            }}
          >
            <Check style={{ width: 16, height: 16, color: "var(--c-accent)", flexShrink: 0 }} />
            <span
              style={{
                fontSize: 13,
                color: "var(--c-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {savedUrl}
            </span>
            <button
              onClick={handleCopyUrl}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--c-accent)",
                background: "none",
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
                fontFamily: "inherit",
              }}
            >
              {copied ? "已複製！" : "複製連結"}
            </button>
          </div>
        )}

        {/* Cards */}
        <section style={{ paddingBottom: 80 }}>
          <RentTable records={records} onDelete={handleDelete} />
        </section>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </main>
  );
}
