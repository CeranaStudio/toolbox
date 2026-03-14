'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Check, Link as LinkIcon } from 'lucide-react';
import { RentInput } from '@/components/RentInput';
import { RentTable } from '@/components/RentTable';
import { ExportBar } from '@/components/ExportBar';
import type { RentRecord } from '@/lib/schema';

const RECORD_LIMIT = 30;

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
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(`/api/lists/${id}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setList(data);
        setNameValue(data.name);
      }
    } catch {
      setError('載入失敗');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const handleSaveName = useCallback(async () => {
    setEditingName(false);
    const trimmed = nameValue.trim();
    if (!trimmed || !list || trimmed === list.name) {
      setNameValue(list?.name || '');
      return;
    }
    setList((prev) => prev ? { ...prev, name: trimmed } : prev);
    try {
      await fetch(`/api/lists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
    } catch {
      setList((prev) => prev ? { ...prev, name: list.name } : prev);
      setNameValue(list.name);
    }
  }, [id, list, nameValue]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    showToast('連結已複製！');
  }, [showToast]);

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
        await fetchList();
      } else {
        showToast('新增失敗，請再試一次');
      }
    } catch {
      showToast('網路錯誤');
    }
  }, [id, fetchList, showToast]);

  const handleDelete = useCallback(async (recordId: string) => {
    setList((prev) =>
      prev ? { ...prev, records: prev.records.filter((r) => r.id !== recordId) } : prev
    );
  }, []);

  const handleStatusChange = useCallback(async (recordId: string, status: string) => {
    setList((prev) =>
      prev
        ? { ...prev, records: prev.records.map((r) => (r.id === recordId ? { ...r, status: status as RentRecord["status"] } : r)) }
        : prev
    );
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

  const recordCount = list.records.length;
  const atLimit = recordCount >= RECORD_LIMIT;
  const nearLimit = recordCount >= 20;

  const countColor = atLimit
    ? '#dc2626'
    : nearLimit
      ? '#d97706'
      : 'var(--c-muted)';

  return (
    <main style={{ minHeight: '100vh', background: 'var(--c-bg)' }}>
      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--c-bg)',
        borderBottom: '1px solid var(--c-border)',
        padding: '0 max(16px, env(safe-area-inset-left))', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <img src="/logo.svg" alt="" style={{ width: '24px', height: '24px' }} />
          <span style={{ fontSize: '13px', color: 'var(--c-muted)', fontWeight: 500 }}>FB 租屋過濾器</span>
        </a>
        <button
          onClick={handleCopyLink}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: '1px solid var(--c-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--c-text)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            touchAction: 'manipulation',
          }}
        >
          <LinkIcon style={{ width: 14, height: 14 }} />
          <span className="desktop-only">複製分享連結</span>
        </button>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(16px, 4vw, 40px) clamp(16px, 4vw, 24px) 80px' }}>
        {/* List header */}
        <div style={{ marginBottom: '28px' }}>
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') {
                  setNameValue(list.name);
                  setEditingName(false);
                }
              }}
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--c-text)',
                background: 'transparent',
                border: 'none',
                borderBottom: '2px solid var(--c-accent)',
                outline: 'none',
                width: '100%',
                padding: '0 0 4px 0',
                fontFamily: 'inherit',
                marginBottom: '6px',
              }}
            />
          ) : (
            <h1
              onClick={() => setEditingName(true)}
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--c-text)',
                marginBottom: '6px',
                cursor: 'pointer',
                borderBottom: '2px solid transparent',
                paddingBottom: '4px',
              }}
              title="點擊編輯名稱"
            >
              {list.name}
            </h1>
          )}
          <p style={{ fontSize: '12px', color: 'var(--c-muted)' }}>
            {new Date(list.created_at).toLocaleDateString('zh-TW')}
          </p>
        </div>

        {/* Append input */}
        {atLimit ? (
          <div style={{
            borderLeft: '3px solid var(--c-accent)',
            paddingLeft: 12,
            marginBottom: '20px',
          }}>
            <p style={{ fontSize: 14, color: 'var(--c-text)', fontWeight: 600, marginBottom: 4 }}>
              已達上限（{recordCount}/{RECORD_LIMIT}）
            </p>
            <p style={{ fontSize: 13, color: 'var(--c-muted)' }}>
              升級解鎖更多空間 →
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', color: 'var(--c-muted)', marginBottom: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              繼續新增
            </p>
            <RentInput onResults={handleResults} />
          </div>
        )}

        {/* Record count */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <span style={{
            fontSize: 13,
            fontWeight: 500,
            color: countColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            已儲存 {recordCount} / {RECORD_LIMIT} 筆
          </span>
          {recordCount > 0 && (
            <ExportBar records={list.records} onToast={showToast} />
          )}
        </div>

        {/* Records */}
        {recordCount > 0 ? (
          <RentTable records={list.records} onDelete={handleDelete} onStatusChange={handleStatusChange} onNotesChange={handleNotesChange} />
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--c-muted)',
            fontSize: 15,
          }}>
            還沒有租屋資料，在上方貼入貼文開始分析
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 50,
          animation: 'slideUp 0.2s ease-out',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--c-text)', color: 'var(--c-bg)',
            padding: '10px 20px', borderRadius: 'var(--radius-sm)',
            fontSize: 13,
          }}>
            <Check style={{ width: 16, height: 16, color: 'var(--c-accent)', flexShrink: 0 }} />
            {toast}
          </div>
        </div>
      )}
    </main>
  );
}
