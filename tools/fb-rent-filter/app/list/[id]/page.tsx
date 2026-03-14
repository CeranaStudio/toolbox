'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { RentInput } from '@/components/RentInput';
import { RentTable } from '@/components/RentTable';
import { ExportBar } from '@/components/ExportBar';
import type { RentRecord } from '@/lib/schema';

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
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(`/api/lists/${id}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else setList(data);
    } catch {
      setError('載入失敗');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // 新分析的結果 append 進 D1 同一個 list
  const handleResults = useCallback(async (results: unknown[]) => {
    const newRecords = results as RentRecord[];
    try {
      const res = await fetch(`/api/lists/${id}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: newRecords }),
      });
      if (res.ok) {
        showToast(`新增 ${newRecords.length} 筆，已加入清單`);
        // 重新 fetch 最新資料
        await fetchList();
      } else {
        showToast('新增失敗，請再試一次');
      }
    } catch {
      showToast('網路錯誤');
    }
  }, [id, fetchList, showToast]);

  const handleDelete = useCallback(async (recordId: string) => {
    // 從本地 state 移除（樂觀更新）
    setList((prev) =>
      prev ? { ...prev, records: prev.records.filter((r) => r.id !== recordId) } : prev
    );
  }, []);

  const handleStatusChange = useCallback(async (recordId: string, status: string) => {
    // 樂觀更新
    setList((prev) =>
      prev
        ? { ...prev, records: prev.records.map((r) => (r.id === recordId ? { ...r, status: status as RentRecord["status"] } : r)) }
        : prev
    );
    // 背景 sync 到 D1
    fetch(`/api/lists/${id}/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  }, [id]);

  const handleNotesChange = useCallback(async (recordId: string, notes: string) => {
    setList((prev) =>
      prev
        ? { ...prev, records: prev.records.map((r) => (r.id === recordId ? { ...r, notes } : r)) }
        : prev
    );
    fetch(`/api/lists/${id}/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    }).catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--c-muted)', fontSize: '14px' }}>載入中...</div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#e53e3e', fontSize: '14px' }}>{error || '找不到清單'}</div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--c-bg)' }}>
      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--c-bg)',
        borderBottom: '1px solid var(--c-border)',
        padding: '0 24px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <img src="/logo.svg" alt="" style={{ width: '24px', height: '24px' }} />
          <span style={{ fontSize: '13px', color: 'var(--c-muted)', fontWeight: 500 }}>FB 租屋過濾器</span>
        </a>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* List header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--c-text)', marginBottom: '6px' }}>
            {list.name}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--c-muted)' }}>
            共 {list.records.length} 筆 · {new Date(list.created_at).toLocaleDateString('zh-TW')}
          </p>
        </div>

        {/* Append input */}
        <div style={{
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px',
        }}>
          <p style={{ fontSize: '12px', color: 'var(--c-muted)', marginBottom: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            繼續新增貼文到這個清單
          </p>
          <RentInput onResults={handleResults} />
        </div>

        {/* Records */}
        {list.records.length > 0 && (
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--c-muted)' }}>{list.records.length} 筆租屋資料</span>
            <ExportBar records={list.records} onToast={showToast} />
          </div>
        )}

        <RentTable records={list.records} onDelete={handleDelete} onStatusChange={handleStatusChange} onNotesChange={handleNotesChange} />
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--c-text)', color: 'white',
          padding: '10px 20px', borderRadius: '8px',
          fontSize: '13px', zIndex: 50,
          animation: 'slideUp 0.2s ease-out',
        }}>
          {toast}
        </div>
      )}
    </main>
  );
}
