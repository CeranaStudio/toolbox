"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";

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
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="貼上 Facebook 租屋社團的貼文...&#10;&#10;可一次貼多篇，用空白行分隔"
        className="w-full min-h-[200px] rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-y"
        disabled={loading}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <button
        onClick={handleAnalyze}
        disabled={loading || !text.trim()}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        {loading ? "分析中..." : "分析"}
      </button>
    </div>
  );
}
