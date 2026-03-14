import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'nodejs';

// GET /api/lists/[id] — 取得清單及其 records
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getRequestContext();
  const db = env.fb_rent_filter_db;
  const { id } = await params;

  const list = await db
    .prepare('SELECT * FROM lists WHERE id = ?')
    .bind(id)
    .first<{ id: string; name: string; created_at: string }>();

  if (!list) {
    return NextResponse.json({ error: '找不到這個清單' }, { status: 404 });
  }

  const { results: rows } = await db
    .prepare('SELECT * FROM records WHERE list_id = ? ORDER BY created_at ASC')
    .bind(id)
    .all();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records = rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    price: r.price,
    deposit: r.deposit,
    district: r.district,
    address: r.address,
    size: r.size,
    roomType: r.room_type,
    floor: r.floor,
    features: r.features ? JSON.parse(r.features as string) : [],
    contact: r.contact,
    moveInDate: r.move_in_date,
    originalText: r.original_text,
    extractedAt: r.extracted_at,
  }));

  return NextResponse.json({ ...list, records });
}

// DELETE /api/lists/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getRequestContext();
  const db = env.fb_rent_filter_db;
  const { id } = await params;

  await db.prepare('DELETE FROM lists WHERE id = ?').bind(id).run();
  return NextResponse.json({ ok: true });
}
