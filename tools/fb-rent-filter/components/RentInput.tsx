"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface RentInputProps {
  onResults: (results: unknown[]) => void | Promise<void>;
  loadingText?: string;
}

export function RentInput({ onResults, loadingText }: RentInputProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const handleAnalyze = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: [trimmed] }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "分析失敗");
      }

      const data = await res.json();
      await onResults(data.results);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生未知錯誤");
    } finally {
      setLoading(false);
    }
  };

  const displayLoadingText = loadingText || "分析中";

  return (
    <div style={{ position: "relative" }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAnalyze();
          }
        }}
        placeholder={"貼上一篇 Facebook 租屋社團的貼文..."}
        disabled={loading}
        style={{
          width: "100%",
          minHeight: 120,
          border: `1px solid ${focused ? "var(--c-accent)" : "var(--c-border)"}`,
          borderRadius: "var(--radius-lg)",
          background: "var(--c-surface)",
          padding: "16px",
          paddingBottom: 56,
          fontSize: 15,
          lineHeight: 1.7,
          outline: "none",
          resize: "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          color: "var(--c-text)",
          fontFamily: "inherit",
          boxShadow: focused ? "0 0 0 3px var(--c-accent-light)" : "none",
        }}
      />
      <button
        onClick={handleAnalyze}
        disabled={loading || !text.trim()}
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          height: 40,
          minWidth: 80,
          background: loading || !text.trim() ? "var(--c-muted)" : "var(--c-accent)",
          color: "white",
          padding: "0 20px",
          borderRadius: 20,
          fontSize: 14,
          fontWeight: 500,
          border: "none",
          cursor: loading || !text.trim() ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          opacity: loading || !text.trim() ? 0.5 : 1,
          transition: "all 0.2s",
          fontFamily: "inherit",
          touchAction: "manipulation",
        }}
      >
        {loading ? (
          <>
            <span style={{ display: 'inline-flex', gap: 3 }}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 4, height: 4, borderRadius: '50%', background: 'currentColor',
                    animation: 'dotPulse 1.2s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`,
                    display: 'inline-block',
                  }}
                />
              ))}
            </span>
            {displayLoadingText}
          </>
        ) : (
          "開始分析"
        )}
      </button>
      {error && (
        <p style={{ marginTop: 12, fontSize: 14, color: "#dc2626" }}>{error}</p>
      )}
    </div>
  );
}
