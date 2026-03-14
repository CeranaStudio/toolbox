"use client";

import { useState } from "react";
import { Trash2, ChevronDown, ChevronUp, ArrowUpDown, Phone } from "lucide-react";
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
      <div
        style={{
          height: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 64, lineHeight: 1 }}>🏠</span>
        <p
          style={{
            marginTop: 20,
            fontSize: 16,
            color: "var(--c-muted)",
            textAlign: "center",
          }}
        >
          貼上租屋貼文就能開始 ↑
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
      {/* Sort controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => handleSort("price")}
          style={{
            fontSize: 12,
            color: sortKey === "price" ? "var(--c-accent)" : "var(--c-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontFamily: "inherit",
            fontWeight: sortKey === "price" ? 600 : 400,
          }}
        >
          月租 <ArrowUpDown style={{ width: 12, height: 12 }} />
        </button>
        <button
          onClick={() => handleSort("size")}
          style={{
            fontSize: 12,
            color: sortKey === "size" ? "var(--c-accent)" : "var(--c-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontFamily: "inherit",
            fontWeight: sortKey === "size" ? 600 : 400,
          }}
        >
          坪數 <ArrowUpDown style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {/* Card grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        {sorted.map((r, i) => (
          <div
            key={r.id}
            style={{
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              borderRadius: 12,
              padding: 20,
              position: "relative",
              overflow: "hidden",
              animation: `fadeIn 0.3s ease-out ${i * 0.04}s both`,
            }}
            className="rent-card"
          >
            {/* Delete button — top right */}
            <button
              onClick={() => onDelete(r.id)}
              className="rent-card-delete"
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color: "var(--c-muted)",
                cursor: "pointer",
                opacity: 0,
                transition: "all 0.15s",
              }}
              title="刪除"
            >
              <Trash2 style={{ width: 14, height: 14 }} />
            </button>

            {/* Top: Price + District */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, paddingRight: 32 }}>
              <div>
                {r.price != null ? (
                  <span style={{ fontSize: 22, fontWeight: 700, color: "var(--c-accent)", fontVariantNumeric: "tabular-nums" }}>
                    ${r.price.toLocaleString()}
                    <span style={{ fontSize: 13, fontWeight: 400, color: "var(--c-muted)", marginLeft: 2 }}>/月</span>
                  </span>
                ) : (
                  <span style={{ fontSize: 18, color: "var(--c-muted)" }}>價格未知</span>
                )}
              </div>
              {r.district && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--c-accent)",
                    background: "var(--c-accent-light)",
                    padding: "3px 10px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.district}
                </span>
              )}
            </div>

            {/* Title */}
            <p
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--c-text)",
                marginBottom: 10,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.title}
            </p>

            {/* Pill list: roomType · size · floor */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 14 }}>
              {[r.roomType, r.size != null ? `${r.size} 坪` : null, r.floor].filter(Boolean).map((item, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: 12,
                    color: "var(--c-muted)",
                    padding: "2px 0",
                  }}
                >
                  {idx > 0 && <span style={{ margin: "0 6px", opacity: 0.4 }}>·</span>}
                  {item}
                </span>
              ))}
            </div>

            {/* Feature tags */}
            {r.features.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {r.features.slice(0, 3).map((f, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: 11,
                      color: "var(--c-text)",
                      background: "var(--c-bg)",
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontWeight: 400,
                    }}
                  >
                    {f}
                  </span>
                ))}
                {r.features.length > 3 && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--c-muted)",
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: "var(--c-bg)",
                    }}
                  >
                    +{r.features.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Contact + expand */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {r.contact ? (
                <span style={{ fontSize: 12, color: "var(--c-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Phone style={{ width: 12, height: 12 }} />
                  {r.contact}
                </span>
              ) : (
                <span />
              )}
              {r.originalText && (
                <button
                  onClick={() => toggleExpand(r.id)}
                  style={{
                    fontSize: 12,
                    color: "var(--c-muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    fontFamily: "inherit",
                    padding: 0,
                  }}
                >
                  {expandedId === r.id ? (
                    <>收合 <ChevronUp style={{ width: 14, height: 14 }} /></>
                  ) : (
                    <>原文 <ChevronDown style={{ width: 14, height: 14 }} /></>
                  )}
                </button>
              )}
            </div>

            {/* Expanded original text */}
            {expandedId === r.id && r.originalText && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: "1px solid var(--c-border)",
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: "var(--c-muted)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {r.originalText}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hover styles via CSS */}
      <style>{`
        .rent-card:hover .rent-card-delete {
          opacity: 1 !important;
        }
        .rent-card-delete:hover {
          color: #dc2626 !important;
          background: rgba(220,38,38,0.08) !important;
        }
      `}</style>
    </div>
  );
}
