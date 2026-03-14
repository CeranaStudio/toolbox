"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface RentInputProps {
  onResults: (results: unknown[]) => void;
}

export function RentInput({ onResults }: RentInputProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim()) return;

    const posts = text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (posts.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "分析失敗");
      }

      const data = await res.json();
      onResults(data.results);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生未知錯誤");
    } finally {
      setLoading(false);
    }
  };

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
        placeholder={"貼上 Facebook 租屋社團的貼文...\n\n可以一次貼入多篇，用空白行隔開"}
        disabled={loading}
        style={{
          width: "100%",
          minHeight: 180,
          border: "none",
          borderBottom: `2px solid ${focused ? "var(--c-accent)" : "var(--c-border)"}`,
          background: "transparent",
          padding: "16px 0",
          paddingRight: 120,
          fontSize: 15,
          lineHeight: 1.7,
          outline: "none",
          resize: "none",
          transition: "border-color 0.2s",
          color: "var(--c-text)",
          fontFamily: "inherit",
        }}
      />
      <button
        onClick={handleAnalyze}
        disabled={loading || !text.trim()}
        style={{
          position: "absolute",
          bottom: 12,
          right: 0,
          background: loading || !text.trim() ? "var(--c-muted)" : "var(--c-accent)",
          color: "white",
          padding: "8px 20px",
          borderRadius: 20,
          fontSize: 14,
          fontWeight: 500,
          border: "none",
          cursor: loading || !text.trim() ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          opacity: loading || !text.trim() ? 0.5 : 1,
          transition: "all 0.2s",
          fontFamily: "inherit",
        }}
      >
        {loading ? (
          <>
            <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
            分析中
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
