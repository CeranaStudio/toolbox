"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

import { RentInput } from "@/components/RentInput";

export default function Page() {
  const [creating, setCreating] = useState(false);

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
        const { id } = await res.json();
        window.location.href = `/list/${id}`;
      } catch {
        setCreating(false);
      }
    },
    [],
  );

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
            租多好室
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 max(16px, env(safe-area-inset-left))" }}>
        {/* Hero */}
        <section style={{ paddingTop: "min(60px, 8vh)", paddingBottom: 32 }}>
          <h1
            style={{
              fontSize: "clamp(32px, 8vw, 56px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "var(--c-text)",
            }}
          >
            AI 幫你
            <br />
            <span style={{ color: "var(--c-accent)" }}>找到好室</span>
          </h1>
          <p style={{ marginTop: 14, fontSize: 16, color: "var(--c-muted)", maxWidth: 340 }}>
            從社群貼文整理、比較、分享，找房不再頭痛
          </p>
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            {["📋 AI 自動整理", "🔗 一鍵分享", "👥 多人協作"].map((hint) => (
              <span key={hint} style={{ fontSize: 12, color: "var(--c-muted)" }}>{hint}</span>
            ))}
          </div>
        </section>

        {/* Input */}
        <section style={{ paddingBottom: 48 }}>
          {creating ? (
            <div style={{ padding: "8px 0 40px" }}>
              {/* Skeleton textarea */}
              <div className="skeleton" style={{ width: '100%', height: 140, borderRadius: 12, marginBottom: 12 }} />
              {/* Skeleton button */}
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
              <p style={{ marginTop: 10, fontSize: 12, color: "var(--c-muted)" }}>
                分析後會自動建立清單，可分享給朋友一起整理
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
