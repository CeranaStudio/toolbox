"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Trash2, ChevronDown, ChevronUp, ArrowUpDown, Phone, Car, MapPin } from "lucide-react";
import type { RentRecord, RecordStatus } from "@/lib/schema";
import { STATUS_CONFIG } from "@/lib/schema";

type SortKey = "price" | "size";
type SortDir = "asc" | "desc";

const STATUS_ORDER: RecordStatus[] = ["interested", "contacted", "visited", "rejected"];

interface RentTableProps {
  records: RentRecord[];
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onNotesChange: (id: string, notes: string) => void;
}

export function RentTable({ records, onDelete, onStatusChange, onNotesChange }: RentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<RecordStatus | "all">("all");

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

  const cycleStatus = (record: RentRecord) => {
    const current = (record.status ?? "interested") as RecordStatus;
    const idx = STATUS_ORDER.indexOf(current);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    onStatusChange(record.id, next);
  };

  const filtered = filterStatus === "all"
    ? records
    : records.filter((r) => (r.status ?? "interested") === filterStatus);

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey] ?? Infinity;
    const bv = b[sortKey] ?? Infinity;
    if (av === bv) return 0;
    const cmp = av < bv ? -1 : 1;
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div>
      {/* Filter bar + Sort controls merged */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        gap: 12,
      }}>
        {/* Filter pills - scrollable */}
        <div style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          flexShrink: 1,
          minWidth: 0,
          scrollbarWidth: "none",
        }}>
          {(["all", ...STATUS_ORDER] as const).map((key) => {
            const isActive = filterStatus === key;
            const label = key === "all" ? "全部" : STATUS_CONFIG[key].label;
            return (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  height: 32,
                  padding: "0 14px",
                  borderRadius: 16,
                  border: "1px solid var(--c-border)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: isActive ? "var(--c-text)" : "transparent",
                  color: isActive ? "white" : "var(--c-muted)",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  touchAction: "manipulation",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Sort controls */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
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
              gap: 3,
              fontFamily: "inherit",
              fontWeight: sortKey === "price" ? 600 : 400,
              whiteSpace: "nowrap",
              touchAction: "manipulation",
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
              gap: 3,
              fontFamily: "inherit",
              fontWeight: sortKey === "size" ? 600 : 400,
              whiteSpace: "nowrap",
              touchAction: "manipulation",
            }}
          >
            坪數 <ArrowUpDown style={{ width: 12, height: 12 }} />
          </button>
        </div>
      </div>

      {/* Card grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
          gap: 12,
        }}
      >
        {sorted.map((r, i) => {
          const status = (r.status ?? "interested") as RecordStatus;
          const cfg = STATUS_CONFIG[status];
          return (
            <div
              key={r.id}
              style={{
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
                borderRadius: "var(--radius-md)",
                padding: 16,
                animation: `fadeSlide 0.25s ease-out ${i * 0.04}s both`,
              }}
              className="rent-card"
            >
              {/* Row 1: status badge + delete */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}>
                <button
                  onClick={() => cycleStatus(r)}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    height: 24,
                    padding: "0 10px",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    background: cfg.color,
                    color: "white",
                    fontFamily: "inherit",
                    lineHeight: 1,
                    touchAction: "manipulation",
                  }}
                  title="點擊切換狀態"
                >
                  {cfg.label}
                </button>
                {r.subsidyEligible === true && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 8px",
                    borderRadius: 12, background: "#D1FAE5", color: "#065F46",
                    border: "1px solid #6EE7B7",
                  }}>
                    ✓ 可租補
                  </span>
                )}
                <button
                  onClick={() => onDelete(r.id)}
                  className="rent-card-delete"
                  style={{
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: "transparent",
                    color: "var(--c-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    touchAction: "manipulation",
                  }}
                  title="刪除"
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>

              {/* Row 2: Price + District */}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  {r.price != null ? (
                    <span style={{ fontSize: 20, fontWeight: 700, color: "var(--c-accent)", fontVariantNumeric: "tabular-nums" }}>
                      ${r.price.toLocaleString()}
                      <span style={{ fontSize: 12, fontWeight: 400, color: "var(--c-muted)", marginLeft: 2 }}>/月</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: 18, color: "var(--c-muted)" }}>價格未知</span>
                  )}
                </div>
                {r.district && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--c-accent)",
                      background: "var(--c-accent-light)",
                      padding: "3px 10px",
                      borderRadius: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.district}
                  </span>
                )}
              </div>

              {/* Row 3: Title */}
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--c-text)",
                  marginBottom: 6,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {r.title}
              </p>

              {/* Row 4: roomType · size · floor */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
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
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {r.features.slice(0, 3).map((f, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: 11,
                        color: "var(--c-text)",
                        background: "var(--c-bg)",
                        padding: "3px 10px",
                        borderRadius: 12,
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
                        borderRadius: 12,
                        background: "var(--c-bg)",
                      }}
                    >
                      +{r.features.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Parking */}
              {r.parking && (
                <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 8 }}>
                  <Car style={{ width: 12, height: 12, display: "inline", verticalAlign: "middle" }} /> {r.parking}
                </p>
              )}

              {/* Contact + map + expand */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {r.contact ? (
                    <span style={{ fontSize: 12, color: "var(--c-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                      <Phone style={{ width: 12, height: 12 }} />
                      {r.contact}
                    </span>
                  ) : (
                    <span />
                  )}
                  {(r.address || r.district) && (
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent([r.address, r.district].filter(Boolean).join(" ") + " 台灣")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="在 Google Maps 開啟"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28, height: 28,
                        borderRadius: 6,
                        border: "1px solid var(--c-border)",
                        color: "var(--c-muted)",
                        textDecoration: "none",
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      <MapPin style={{ width: 14, height: 14 }} />
                    </a>
                  )}
                </div>
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
                      padding: "4px 0",
                      minHeight: 36,
                      touchAction: "manipulation",
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
                    marginTop: 12,
                    paddingTop: 12,
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

              {/* Notes section */}
              <NotesField
                recordId={r.id}
                notes={r.notes ?? null}
                isEditing={editingNotesId === r.id}
                onStartEdit={() => setEditingNotesId(r.id)}
                onSave={(notes) => {
                  onNotesChange(r.id, notes);
                  setEditingNotesId(null);
                }}
                onCancel={() => setEditingNotesId(null)}
              />
            </div>
          );
        })}
      </div>

      {/* Mobile: delete always visible. Desktop: hover only */}
      <style>{`
        @media (min-width: 769px) {
          .rent-card .rent-card-delete {
            opacity: 0;
          }
          .rent-card:hover .rent-card-delete {
            opacity: 1 !important;
          }
        }
        .rent-card-delete:hover {
          color: #dc2626 !important;
          background: rgba(220,38,38,0.08) !important;
        }
      `}</style>
    </div>
  );
}

/* ---------- Notes inline editor ---------- */

function NotesField({
  recordId,
  notes,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
}: {
  recordId: string;
  notes: string | null;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (notes: string) => void;
  onCancel: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(notes ?? "");

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      autoResize(textareaRef.current);
    }
  }, [isEditing]);

  useEffect(() => {
    setDraft(notes ?? "");
  }, [notes]);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const handleSave = useCallback(() => {
    onSave(draft);
  }, [draft, onSave]);

  if (isEditing) {
    return (
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--c-border)" }}>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            autoResize(e.target);
          }}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSave();
            }
          }}
          style={{
            width: "100%",
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--c-text)",
            background: "var(--c-bg)",
            border: "1px solid var(--c-border)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            resize: "none",
            overflow: "hidden",
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
          placeholder="輸入備註…"
          rows={1}
        />
      </div>
    );
  }

  return (
    <div
      style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--c-border)", cursor: "pointer" }}
      onClick={onStartEdit}
    >
      {notes ? (
        <p style={{ fontSize: 13, color: "var(--c-muted)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
          {notes}
        </p>
      ) : (
        <p
          style={{
            fontSize: 13,
            color: "var(--c-muted)",
            margin: 0,
            padding: "6px 12px",
            border: "1px dashed var(--c-border)",
            borderRadius: "var(--radius-sm)",
            textAlign: "center",
            opacity: 0.6,
          }}
        >
          + 新增備註
        </p>
      )}
    </div>
  );
}
