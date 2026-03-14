import { NextRequest, NextResponse } from "next/server";

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
  first<T>(): Promise<T | null>;
}

/**
 * Simple IP-based rate limiter using D1.
 * Window: per-minute sliding window.
 *
 * @param db   D1 binding
 * @param req  NextRequest (to read CF-Connecting-IP)
 * @param max  Max requests allowed per minute (default: 5)
 * @returns NextResponse(429) if over limit, null if OK
 */
export async function checkRateLimit(
  db: D1Database,
  req: NextRequest,
  max = 5
): Promise<NextResponse | null> {
  const ip =
    req.headers.get("CF-Connecting-IP") ||
    req.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown";

  // Per-minute window key: "2026-03-14T21:30"
  const windowKey = new Date().toISOString().slice(0, 16);

  try {
    // Upsert: increment count, get new count
    const result = await db
      .prepare(
        `INSERT INTO rate_limits (ip, window_key, count)
         VALUES (?, ?, 1)
         ON CONFLICT(ip, window_key)
         DO UPDATE SET count = count + 1
         RETURNING count`
      )
      .bind(ip, windowKey)
      .first<{ count: number }>();

    const count = result?.count ?? 1;

    if (count > max) {
      return NextResponse.json(
        { error: "請求太頻繁，請稍後再試（每分鐘最多 5 次分析）" },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(max),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // Best-effort cleanup: delete windows older than 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16);
    db.prepare("DELETE FROM rate_limits WHERE window_key < ?")
      .bind(twoHoursAgo)
      .run()
      .catch(() => {}); // fire and forget

    return null; // OK
  } catch (err) {
    // If rate limit check fails, fail open (don't block legitimate requests)
    console.error("Rate limit check failed:", err);
    return null;
  }
}
