"use client";

import { useState } from "react";
import { Trash2, ArrowUpDown } from "lucide-react";
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

  if (records.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12">
        尚無資料，請貼上租屋貼文並點擊分析
      </p>
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
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">標題</th>
              <th className="px-4 py-3 font-medium">
                <button
                  onClick={() => handleSort("price")}
                  className="inline-flex items-center gap-1 hover:text-gray-900"
                >
                  月租
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 font-medium">地區</th>
              <th className="px-4 py-3 font-medium">房型</th>
              <th className="px-4 py-3 font-medium">
                <button
                  onClick={() => handleSort("size")}
                  className="inline-flex items-center gap-1 hover:text-gray-900"
                >
                  坪數
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 font-medium">樓層</th>
              <th className="px-4 py-3 font-medium">特色</th>
              <th className="px-4 py-3 font-medium">聯絡</th>
              <th className="px-4 py-3 font-medium w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                  {r.title}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {r.price != null ? `$${r.price.toLocaleString()}` : "-"}
                </td>
                <td className="px-4 py-3">{r.district ?? "-"}</td>
                <td className="px-4 py-3">{r.roomType ?? "-"}</td>
                <td className="px-4 py-3">
                  {r.size != null ? `${r.size} 坪` : "-"}
                </td>
                <td className="px-4 py-3">{r.floor ?? "-"}</td>
                <td className="px-4 py-3 max-w-[200px]">
                  <div className="flex flex-wrap gap-1">
                    {r.features.map((f, i) => (
                      <span
                        key={i}
                        className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {r.contact ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onDelete(r.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="刪除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => handleSort("price")}
            className="text-xs rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
          >
            依月租排序 <ArrowUpDown className="inline h-3 w-3" />
          </button>
          <button
            onClick={() => handleSort("size")}
            className="text-xs rounded-lg border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
          >
            依坪數排序 <ArrowUpDown className="inline h-3 w-3" />
          </button>
        </div>
        {sorted.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-gray-200 p-4 space-y-2"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-medium text-sm">{r.title}</h3>
              <button
                onClick={() => onDelete(r.id)}
                className="text-gray-400 hover:text-red-500 transition-colors shrink-0 ml-2"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
              <span>月租</span>
              <span className="font-medium text-gray-900">
                {r.price != null ? `$${r.price.toLocaleString()}` : "-"}
              </span>
              <span>地區</span>
              <span>{r.district ?? "-"}</span>
              <span>房型</span>
              <span>{r.roomType ?? "-"}</span>
              <span>坪數</span>
              <span>{r.size != null ? `${r.size} 坪` : "-"}</span>
              <span>樓層</span>
              <span>{r.floor ?? "-"}</span>
              <span>聯絡</span>
              <span className="text-xs">{r.contact ?? "-"}</span>
            </div>
            {r.features.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {r.features.map((f, i) => (
                  <span
                    key={i}
                    className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
