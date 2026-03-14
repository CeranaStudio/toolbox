"use client";

import { useState } from "react";
import { Trash2, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import type { RentRecord } from "@/lib/schema";

type SortKey = "price" | "size";
type SortDir = "asc" | "desc";

interface RentTableProps {
  records: RentRecord[];
  onDelete: (id: string) => void;
}

export function RentTable({ records, onDelete }: RentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="font-serif text-2xl text-charcoal/30 italic mb-2">
          還沒有資料
        </p>
        <p className="text-sm text-stone-muted">
          把 FB 租屋貼文貼上來試試看
        </p>
      </div>
    );
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const sorted = [...records].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey] ?? Infinity;
    const bv = b[sortKey] ?? Infinity;
    if (av === bv) return 0;
    const cmp = av < bv ? -1 : 1;
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-charcoal text-left">
              <th className="px-3 py-3 font-medium text-xs tracking-widest uppercase text-stone-muted">標題</th>
              <th className="px-3 py-3 font-medium text-xs tracking-widest uppercase text-stone-muted">
                <button
                  onClick={() => handleSort("price")}
                  className="inline-flex items-center gap-1 hover:text-charcoal transition-colors"
                >
                  月租
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-3 py-3 font-medium text-xs tracking-widest uppercase text-stone-muted">地區</th>
              <th className="px-3 py-3 font-medium text-xs tracking-widest uppercase text-stone-muted">房型</th>
              <th className="px-3 py-3 font-medium text-xs tracking-widest uppercase text-stone-muted">
                <button
                  onClick={() => handleSort("size")}
                  className="inline-flex items-center gap-1 hover:text-charcoal transition-colors"
                >
                  坪數
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-3 py-3 font-medium text-xs tracking-widest uppercase text-stone-muted">樓層</th>
              <th className="px-3 py-3 font-medium text-xs tracking-widest uppercase text-stone-muted">特色</th>
              <th className="px-3 py-3 font-medium text-xs tracking-widest uppercase text-stone-muted">聯絡</th>
              <th className="px-3 py-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <>
                <tr
                  key={r.id}
                  className="border-b border-stone-border hover:bg-stone-light transition-colors"
                >
                  <td className="px-3 py-3.5 font-medium max-w-[200px] truncate text-charcoal">
                    {r.title}
                  </td>
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    {r.price != null ? (
                      <span className="font-bold text-accent tabular-nums text-base">
                        ${r.price.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-stone-muted/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-charcoal/70">{r.district ?? <span className="text-stone-muted/40">—</span>}</td>
                  <td className="px-3 py-3.5 text-charcoal/70">{r.roomType ?? <span className="text-stone-muted/40">—</span>}</td>
                  <td className="px-3 py-3.5 text-charcoal/70 tabular-nums">
                    {r.size != null ? `${r.size} 坪` : <span className="text-stone-muted/40">—</span>}
                  </td>
                  <td className="px-3 py-3.5 text-charcoal/70">{r.floor ?? <span className="text-stone-muted/40">—</span>}</td>
                  <td className="px-3 py-3.5 max-w-[240px]">
                    <span className="text-charcoal/60 text-xs">
                      {r.features.join(" · ")}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-charcoal/50">
                    {r.contact ?? <span className="text-stone-muted/40">—</span>}
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleExpand(r.id)}
                        className="text-stone-muted hover:text-charcoal transition-colors p-1"
                        title="查看原文"
                      >
                        {expandedId === r.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => onDelete(r.id)}
                        className="text-stone-muted hover:text-red-600 transition-colors p-1"
                        title="刪除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === r.id && r.originalText && (
                  <tr key={`${r.id}-expanded`} className="border-b border-stone-border">
                    <td colSpan={9} className="px-6 py-4 bg-stone-light">
                      <div className="text-xs text-charcoal/50 leading-relaxed max-w-3xl">
                        <span className="font-medium text-charcoal/70">原始貼文：</span>
                        <p className="mt-1 whitespace-pre-wrap">{r.originalText}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden divide-y divide-stone-border">
        <div className="flex gap-2 py-4">
          <button
            onClick={() => handleSort("price")}
            className="text-xs border border-stone-border bg-white px-3 py-1.5 hover:bg-stone-light font-medium text-charcoal/70 transition-colors"
          >
            依月租排序 <ArrowUpDown className="inline h-3 w-3" />
          </button>
          <button
            onClick={() => handleSort("size")}
            className="text-xs border border-stone-border bg-white px-3 py-1.5 hover:bg-stone-light font-medium text-charcoal/70 transition-colors"
          >
            依坪數排序 <ArrowUpDown className="inline h-3 w-3" />
          </button>
        </div>
        {sorted.map((r) => (
          <div key={r.id} className="py-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-charcoal truncate">{r.title}</h3>
                {r.price != null && (
                  <p className="text-xl font-bold text-accent mt-1 tabular-nums">
                    ${r.price.toLocaleString()}<span className="text-xs font-light text-stone-muted"> /月</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => onDelete(r.id)}
                className="text-stone-muted hover:text-red-600 transition-colors shrink-0 ml-2 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {r.district && (
                <>
                  <span className="text-stone-muted">地區</span>
                  <span className="text-charcoal/80">{r.district}</span>
                </>
              )}
              {r.roomType && (
                <>
                  <span className="text-stone-muted">房型</span>
                  <span className="text-charcoal/80">{r.roomType}</span>
                </>
              )}
              {r.size != null && (
                <>
                  <span className="text-stone-muted">坪數</span>
                  <span className="text-charcoal/80">{r.size} 坪</span>
                </>
              )}
              {r.floor && (
                <>
                  <span className="text-stone-muted">樓層</span>
                  <span className="text-charcoal/80">{r.floor}</span>
                </>
              )}
              {r.deposit && (
                <>
                  <span className="text-stone-muted">押金</span>
                  <span className="text-charcoal/80">{r.deposit}</span>
                </>
              )}
              {r.contact && (
                <>
                  <span className="text-stone-muted">聯絡</span>
                  <span className="text-charcoal/80 text-xs">{r.contact}</span>
                </>
              )}
              {r.moveInDate && (
                <>
                  <span className="text-stone-muted">入住</span>
                  <span className="text-charcoal/80">{r.moveInDate}</span>
                </>
              )}
            </div>
            {r.features.length > 0 && (
              <p className="text-xs text-charcoal/50">
                {r.features.join(" · ")}
              </p>
            )}
            {r.originalText && (
              <button
                onClick={() => toggleExpand(r.id)}
                className="text-xs text-stone-muted hover:text-charcoal transition-colors"
              >
                {expandedId === r.id ? "收合原文" : "查看原文"}
              </button>
            )}
            {expandedId === r.id && r.originalText && (
              <p className="text-xs text-charcoal/50 border-l-2 border-stone-border pl-3 leading-relaxed whitespace-pre-wrap">
                {r.originalText}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
