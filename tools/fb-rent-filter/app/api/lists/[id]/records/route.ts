import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const runtime = 'nodejs';

// POST /api/lists/[id]/records — 把新的 records append 進已有的 list
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as unknown as CloudflareEnv).fb_rent_filter_db;
  const { id } = await params;

  // 確認 list 存在
  const list = await db
    .prepare('SELECT id FROM lists WHERE id = ?')
    .bind(id)
    .first<{ id: string }>();

  if (!list) {
    return NextResponse.json({ error: '找不到這個清單' }, { status: 404 });
  }

  const body = await req.json();
  const { records } = body as {
    records: Array<{
      id: string;
      title?: string;
      price?: number | null;
      deposit?: string;
      district?: string;
      address?: string;
      size?: number | null;
      roomType?: string;
      floor?: string;
      features?: string[];
      contact?: string;
      moveInDate?: string;
      originalText?: string;
      extractedAt?: string;
    }>;
  };

  if (!records?.length) {
    return NextResponse.json({ error: '沒有 records' }, { status: 400 });
  }

  const stmt = db.prepare(
    `INSERT OR IGNORE INTO records
      (id, list_id, title, price, deposit, district, address, size, room_type, floor, features, contact, move_in_date, original_text, extracted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  await db.batch(
    records.map((r) =>
      stmt.bind(
        r.id ?? crypto.randomUUID(),
        id,
        r.title ?? null,
        r.price ?? null,
        r.deposit ?? null,
        r.district ?? null,
        r.address ?? null,
        r.size ?? null,
        r.roomType ?? null,
        r.floor ?? null,
        r.features ? JSON.stringify(r.features) : null,
        r.contact ?? null,
        r.moveInDate ?? null,
        r.originalText ?? null,
        r.extractedAt ?? null
      )
    )
  );

  return NextResponse.json({ ok: true, appended: records.length });
}
