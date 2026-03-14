import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const runtime = 'nodejs';

// PATCH /api/lists/[id]/records/[recordId] — 更新 status / notes
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as unknown as CloudflareEnv).fb_rent_filter_db;
  const { id, recordId } = await params;

  const body = await req.json() as { status?: string; notes?: string };
  const sets: string[] = [];
  const values: unknown[] = [];

  if (body.status !== undefined) {
    sets.push('status = ?');
    values.push(body.status);
  }
  if (body.notes !== undefined) {
    sets.push('notes = ?');
    values.push(body.notes);
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: '沒有要更新的欄位' }, { status: 400 });
  }

  values.push(recordId, id);
  await db
    .prepare(`UPDATE records SET ${sets.join(', ')} WHERE id = ? AND list_id = ?`)
    .bind(...values)
    .run();

  return NextResponse.json({ ok: true });
}
