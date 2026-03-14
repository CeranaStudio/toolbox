'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';
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
      <div className="min-h-screen flex flex-col items-center justify-center text-stone-muted bg-warm-white">
        <Loader2 className="h-6 w-6 animate-spin text-accent mb-3" />
        <p className="text-sm">載入中...</p>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-warm-white">
        <p className="font-serif text-2xl text-charcoal/30 italic mb-2">
          {error || '找不到清單'}
        </p>
        <a
          href="/"
          className="mt-4 text-sm text-accent hover:text-accent-hover transition-colors"
        >
          回到首頁
        </a>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-warm-white py-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.svg" alt="" className="h-7 w-7" />
            <span className="text-xs tracking-widest uppercase text-stone-muted font-medium">
              FB Rent Filter
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-charcoal leading-tight">
            {list.name}
          </h1>
          <p className="text-sm text-stone-muted mt-3">
            {list.records.length} 筆 · 分享於{' '}
            {new Date(list.created_at).toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <div className="mt-6 w-16 h-px bg-accent" />
        </header>

        {/* Records */}
        <div className="divide-y divide-stone-border">
          {list.records.map((r) => (
            <article
              key={r.id}
              className="py-6 first:pt-0"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-medium text-charcoal text-base">
                  {r.title || '（無標題）'}
                </h2>
                {r.price != null && (
                  <span className="text-accent font-bold text-lg whitespace-nowrap tabular-nums">
                    ${r.price.toLocaleString()}
                    <span className="text-xs font-light text-stone-muted"> /月</span>
                  </span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                {r.district && (
                  <div>
                    <span className="text-stone-muted text-xs">地區</span>
                    <p className="text-charcoal/80">{r.district}</p>
                  </div>
                )}
                {r.address && (
                  <div>
                    <span className="text-stone-muted text-xs">地址</span>
                    <p className="text-charcoal/80">{r.address}</p>
                  </div>
                )}
                {r.size != null && (
                  <div>
                    <span className="text-stone-muted text-xs">坪數</span>
                    <p className="text-charcoal/80">{r.size} 坪</p>
                  </div>
                )}
                {r.roomType && (
                  <div>
                    <span className="text-stone-muted text-xs">房型</span>
                    <p className="text-charcoal/80">{r.roomType}</p>
                  </div>
                )}
                {r.floor && (
                  <div>
                    <span className="text-stone-muted text-xs">樓層</span>
                    <p className="text-charcoal/80">{r.floor}</p>
                  </div>
                )}
                {r.moveInDate && (
                  <div>
                    <span className="text-stone-muted text-xs">入住時間</span>
                    <p className="text-charcoal/80">{r.moveInDate}</p>
                  </div>
                )}
                {r.contact && (
                  <div>
                    <span className="text-stone-muted text-xs">聯絡</span>
                    <p className="text-charcoal/80">{r.contact}</p>
                  </div>
                )}
                {r.deposit && (
                  <div>
                    <span className="text-stone-muted text-xs">押金</span>
                    <p className="text-charcoal/80">{r.deposit}</p>
                  </div>
                )}
              </div>

              {r.features && r.features.length > 0 && (
                <p className="mt-3 text-xs text-charcoal/50">
                  {r.features.join(" · ")}
                </p>
              )}

              {r.originalText && (
                <p className="mt-3 text-xs text-stone-muted/70 line-clamp-2 leading-relaxed">
                  {r.originalText}
                </p>
              )}
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 pt-8 border-t border-stone-border">
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-charcoal px-6 py-3 text-sm font-medium text-warm-white hover:bg-charcoal-light transition-colors"
          >
            用 FB 租屋過濾器分析你的貼文
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </main>
  );
}
