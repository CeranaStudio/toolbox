import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { checkRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';

// POST /api/lists — 建立新清單並存入 records
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as unknown as CloudflareEnv).fb_rent_filter_db;

  // Rate limit: 20 list creations per minute per IP (looser than analyze)
  const rateLimitResponse = await checkRateLimit(db, req, 20);
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json();
  const { name, records } = body as {
    name: string;
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

  if (!name || !records?.length) {
    return NextResponse.json({ error: '需要 name 和 records' }, { status: 400 });
  }

  const listId = crypto.randomUUID();

  await db
    .prepare('INSERT INTO lists (id, name) VALUES (?, ?)')
    .bind(listId, name)
    .run();

  const stmt = db.prepare(
    `INSERT INTO records
      (id, list_id, title, price, deposit, district, address, size, room_type, floor, features, contact, move_in_date, original_text, extracted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  await db.batch(
    records.map((r) =>
      stmt.bind(
        r.id ?? crypto.randomUUID(),
        listId,
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

  return NextResponse.json({ id: listId, name });
}
