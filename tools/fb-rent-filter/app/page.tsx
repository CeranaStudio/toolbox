"use client";

import { useState, useCallback, useEffect } from "react";
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
    <section style={{ marginTop: 12 }}>
      <p style={{
        fontSize: 11, fontWeight: 600, color: "var(--c-muted)",
        textTransform: "uppercase", letterSpacing: "0.06em",
        marginBottom: 8,
      }}>
        最近的清單
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {lists.map((list) => (
          <a
            key={list.id}
            href={`/list/${list.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
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

function OpenListInput() {
  const [val, setVal] = useState("");
  const [error, setError] = useState("");

  const handleOpen = () => {
    const trimmed = val.trim();
    if (!trimmed) return;
    const uuidMatch = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uuidMatch) {
      window.location.href = `/list/${uuidMatch[0]}`;
    } else {
      setError("找不到清單 ID，請確認連結格式正確");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <section style={{ marginTop: 12 }}>
      <p style={{
        fontSize: 11, fontWeight: 600, color: "var(--c-muted)",
        textTransform: "uppercase", letterSpacing: "0.06em",
        marginBottom: 8,
      }}>
        開啟朋友的清單
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleOpen()}
          placeholder="貼上清單連結或 ID…"
          style={{
            flex: 1, padding: "10px 14px",
            border: "1px solid var(--c-border)", borderRadius: 10,
            fontSize: 14, fontFamily: "inherit",
            background: "var(--c-surface)", color: "var(--c-text)", outline: "none",
          }}
        />
        <button
          onClick={handleOpen}
          style={{
            padding: "10px 16px", background: "var(--c-text)", color: "white",
            border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 5,
            touchAction: "manipulation", whiteSpace: "nowrap",
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

  useEffect(() => {
    // 處理 Share Target
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get("share_url") || params.get("url");
    const sharedText = params.get("share_text") || params.get("text") || "";
    const uuidMatch = (sharedUrl || sharedText).match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
    if (uuidMatch) window.location.href = `/list/${uuidMatch[0]}`;
  }, []);

  const handleResults = useCallback(async (results: unknown[]) => {
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
  }, []);

  return (
    <main style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "var(--c-bg)",
    }}>
      {/* === Hero: vertically centered upper half === */}
      <div style={{
        flex: "0 0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingTop: "max(48px, env(safe-area-inset-top, 0px))",
        paddingBottom: 32,
        paddingLeft: "max(24px, env(safe-area-inset-left))",
        paddingRight: "max(24px, env(safe-area-inset-right))",
        textAlign: "center",
      }}>
        <img
          src="/logo.svg"
          alt=""
          style={{ width: 56, height: 56, marginBottom: 14 }}
        />
        <h1 style={{
          fontSize: "clamp(26px, 7vw, 40px)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "var(--c-text)",
          lineHeight: 1.1,
          margin: 0,
        }}>
          有室再說
        </h1>
        <p style={{
          marginTop: 8,
          fontSize: 14,
          color: "var(--c-muted)",
          maxWidth: 280,
          lineHeight: 1.5,
        }}>
          把社群租屋貼文整理成<br />一目了然的比較清單
        </p>
      </div>

      {/* === Input area === */}
      <div style={{
        flex: "0 0 auto",
        maxWidth: 640,
        width: "100%",
        margin: "0 auto",
        padding: "0 max(20px, env(safe-area-inset-left))",
      }}>
        {creating ? (
          <div>
            <div className="skeleton" style={{ width: "100%", height: 180, borderRadius: 12, marginBottom: 12 }} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div className="skeleton" style={{ width: 140, height: 40, borderRadius: 20 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, color: "var(--c-muted)", fontSize: 13 }}>
              <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite", flexShrink: 0 }} />
              AI 分析中，建立清單...
            </div>
          </div>
        ) : (
          <>
            <RentInput onResults={handleResults} loadingText="AI 分析中..." />
            <p style={{ marginTop: 8, fontSize: 11, color: "var(--c-muted)", textAlign: "center" }}>
              分析後自動建立清單・可分享給朋友共同編輯
            </p>
          </>
        )}
      </div>

      {/* === Below-fold: recent lists + open friend's list === */}
      <div style={{
        flex: "1 0 auto",
        maxWidth: 640,
        width: "100%",
        margin: "0 auto",
        padding: "24px max(20px, env(safe-area-inset-left)) max(32px, env(safe-area-inset-bottom))",
      }}>
        <OpenListInput />
        <RecentLists />
      </div>
    </main>
  );
}
