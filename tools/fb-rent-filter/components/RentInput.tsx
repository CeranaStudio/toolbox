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
    <div>
      <label className="block text-xs tracking-widest uppercase text-stone-muted font-medium mb-3">
        貼上 FB 租屋貼文
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"在這裡貼上 Facebook 租屋社團的貼文內容...\n\n例如：\n「板橋套房出租，近府中捷運站，月租 12000 含水費...」\n\n可以一次貼入多篇貼文，用空白行隔開即可"}
        className="w-full min-h-[200px] border border-stone-border bg-white p-4 text-sm leading-relaxed placeholder:text-stone-muted/50 focus:border-charcoal focus:outline-none transition-colors resize-y"
        disabled={loading}
      />
      <p className="mt-2 text-xs text-stone-muted">
        可一次貼入多篇貼文，用空白行隔開
      </p>
      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
      <div className="mt-4">
        <button
          onClick={handleAnalyze}
          disabled={loading || !text.trim()}
          className="inline-flex items-center gap-2 bg-charcoal px-8 py-3 text-sm font-medium text-warm-white hover:bg-charcoal-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              分析中...
            </>
          ) : (
            "開始分析"
          )}
        </button>
      </div>
    </div>
  );
}
