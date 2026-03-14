"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2, ClipboardList, ExternalLink } from "lucide-react";

import { RentInput } from "@/components/RentInput";

const LISTS_KEY = "recent_lists";

function RecentLists() {
  const [lists, setLists] = useState<Array<{ id: string; name: string; createdAt: string }>>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LISTS_KEY) || "[]");
      setLists(stored.slice(0, 5));
    } catch {}
  }, []);

  if (lists.length === 0) return null;

  return (
    <section style={{ marginTop: 24, paddingBottom: 24 }}>
      <p style={{
        fontSize: 11, fontWeight: 600, color: "var(--c-muted)",
        textTransform: "uppercase", letterSpacing: "0.06em",
        marginBottom: 10,
      }}>
        最近的清單
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {lists.map((list) => (
          <a
            key={list.id}
            href={`/list/${list.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              borderRadius: 10,
              textDecoration: "none",
              color: "var(--c-text)",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ClipboardList style={{ width: 14, height: 14, flexShrink: 0, color: "var(--c-muted)" }} />
              <span>{list.name}</span>
            </span>
            <span style={{ fontSize: 12, color: "var(--c-muted)" }}>
              {new Date(list.createdAt).toLocaleDateString("zh-TW")} →
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

// 貼上清單連結開啟
function OpenListInput() {
  const [val, setVal] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    const trimmed = val.trim();
    if (!trimmed) return;

    // 支援：完整 URL / 只有 UUID / /list/uuid
    const uuidMatch = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uuidMatch) {
      window.location.href = `/list/${uuidMatch[0]}`;
    } else {
      setError("找不到清單 ID，請確認連結格式正確");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <section style={{ marginTop: 8, paddingBottom: 24 }}>
      <p style={{
        fontSize: 11, fontWeight: 600, color: "var(--c-muted)",
        textTransform: "uppercase", letterSpacing: "0.06em",
        marginBottom: 10,
      }}>
        開啟朋友的清單
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          ref={inputRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleOpen()}
          placeholder="貼上清單連結或 ID…"
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "1px solid var(--c-border)",
            borderRadius: 10,
            fontSize: 14,
            fontFamily: "inherit",
            background: "var(--c-surface)",
            color: "var(--c-text)",
            outline: "none",
          }}
        />
        <button
          onClick={handleOpen}
          style={{
            padding: "10px 16px",
            background: "var(--c-text)",
            color: "white",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 5,
            touchAction: "manipulation",
            whiteSpace: "nowrap",
          }}
        >
          <ExternalLink style={{ width: 14, height: 14 }} />
          開啟
        </button>
      </div>
      {error && <p style={{ marginTop: 6, fontSize: 12, color: "#dc2626" }}>{error}</p>}
    </section>
  );
}

export default function Page() {
  const [creating, setCreating] = useState(false);
  const [backUrl, setBackUrl] = useState<string | null>(null);

  useEffect(() => {
    // 處理 Share Target：朋友分享連結給 PWA
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get("share_url") || params.get("url");
    const sharedText = params.get("share_text") || params.get("text") || "";

    const uuidFromUrl = (sharedUrl || sharedText).match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
    if (uuidFromUrl) {
      window.location.href = `/list/${uuidFromUrl[0]}`;
      return;
    }

    if (document.referrer.includes("/list/")) {
      setBackUrl(document.referrer);
    }
  }, []);

  const handleResults = useCallback(
    async (results: unknown[]) => {
      setCreating(true);
      try {
        const res = await fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `租屋清單 ${new Date().toLocaleDateString("zh-TW")}`,
            records: results,
          }),
        });
        const { id, name } = await res.json();

        // 存入最近清單
        try {
          const stored = JSON.parse(localStorage.getItem("recent_lists") || "[]");
          const updated = [
            { id, name, createdAt: new Date().toISOString() },
            ...stored.filter((l: { id: string }) => l.id !== id),
          ].slice(0, 10);
          localStorage.setItem("recent_lists", JSON.stringify(updated));
        } catch {}

        window.location.href = `/list/${id}`;
      } catch {
        setCreating(false);
      }
    },
    [],
  );

  return (
    <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* Sticky header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          background: "var(--c-bg)",
          borderBottom: "1px solid var(--c-border)",
          height: 56,
          padding: "0 max(16px, env(safe-area-inset-left))",
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
            有室再說
          </span>
          <div style={{ flex: 1 }} />
          {backUrl && (
            <a href={backUrl} style={{
              fontSize: 13, color: "var(--c-muted)", textDecoration: "none",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              ← 返回清單
            </a>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 max(16px, env(safe-area-inset-left))", flex: 1 }}>
        {/* Hero */}
        <section style={{ paddingTop: "max(24px, env(safe-area-inset-top, 0px))" }}>
          <h1
            style={{
              fontSize: "clamp(32px, 8vw, 56px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "var(--c-text)",
            }}
          >
            找房不頭痛
          </h1>
          <p style={{ marginTop: 10, fontSize: 14, color: "var(--c-muted)", maxWidth: 340 }}>
            「有室再說」幫你把社群租屋貼文整理成一目了然的比較清單
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
            {["貼上貼文", "AI 整理", "清單建好"].map((step, i) => (
              <span key={step} style={{ fontSize: 12, color: "var(--c-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                {i > 0 && <span style={{ color: "var(--c-border)" }}>·</span>}
                {step}
              </span>
            ))}
          </div>
        </section>

        {/* Input */}
        <section style={{ marginTop: 16, paddingBottom: 8 }}>
          {creating ? (
            <div style={{ padding: "8px 0 40px" }}>
              <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 12, marginBottom: 12 }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div className="skeleton" style={{ width: 140, height: 40, borderRadius: 20 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, color: 'var(--c-muted)', fontSize: 13 }}>
                <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite", flexShrink: 0 }} />
                AI 分析中，建立清單...
              </div>
            </div>
          ) : (
            <>
              <RentInput onResults={handleResults} loadingText="AI 分析中，建立清單..." />
              <p style={{ marginTop: 8, fontSize: 11, color: "var(--c-muted)", textAlign: "right" }}>
                貼文分析完自動建立清單・可分享給朋友共同編輯
              </p>
            </>
          )}
        </section>

        {/* 開啟朋友的清單 */}
        <OpenListInput />

        {/* 最近的清單 */}
        <RecentLists />
      </div>
    </main>
  );
}
