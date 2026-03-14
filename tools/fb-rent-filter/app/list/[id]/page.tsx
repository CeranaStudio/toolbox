'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RentRecord } from '@/lib/schema';

interface SharedList {
  id: string;
  name: string;
  created_at: string;
  records: RentRecord[];
}

export default function SharedListPage() {
  const params = useParams();
  const id = params.id as string;
  const [list, setList] = useState<SharedList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/lists/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setList(data);
      })
      .catch(() => setError('載入失敗'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        載入中...
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error || '找不到清單'}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{list.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {list.records.length} 筆 ·{' '}
            {new Date(list.created_at).toLocaleDateString('zh-TW')}
          </p>
        </div>

        <div className="space-y-4">
          {list.records.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-gray-900">{r.title || '（無標題）'}</h2>
                {r.price && (
                  <span className="text-blue-600 font-bold whitespace-nowrap">
                    ${r.price.toLocaleString()} / 月
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                {r.district && <span>📍 {r.district}</span>}
                {r.address && <span>🏠 {r.address}</span>}
                {r.size && <span>📐 {r.size} 坪</span>}
                {r.roomType && <span>🛋 {r.roomType}</span>}
                {r.floor && <span>🏢 {r.floor}</span>}
                {r.moveInDate && <span>📅 {r.moveInDate}</span>}
                {r.contact && <span>📞 {r.contact}</span>}
                {r.deposit && <span>💰 押金 {r.deposit}</span>}
              </div>

              {r.features && r.features.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.features.map((f, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {r.originalText && (
                <p className="mt-2 text-xs text-gray-400 line-clamp-2">{r.originalText}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-sm text-blue-500 hover:underline">
            ← 用 FB 租屋過濾器分析你的貼文
          </a>
        </div>
      </div>
    </main>
  );
}
