import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { analyzeRequestSchema, rentRecordSchema } from "@/lib/schema";
import { createHash } from "crypto";

export const runtime = 'nodejs';

function hashPost(text: string): string {
  // 正規化：去掉多餘空白、換行，讓相同貼文有相同 hash
  const normalized = text.trim().replace(/\s+/g, " ");
  return createHash("sha256").update(normalized).digest("hex");
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = analyzeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "請提供至少一篇貼文", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { posts } = parsed.data;
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as unknown as CloudflareEnv).fb_rent_filter_db;

  try {
    const results = await Promise.all(
      posts.map(async (post) => {
        const hash = hashPost(post);

        // 查快取
        const cached = await db
          .prepare("SELECT structured_result FROM post_cache WHERE hash = ?")
          .bind(hash)
          .first<{ structured_result: string }>();

        if (cached) {
          // 命中：更新 hit_count，直接回傳
          await db
            .prepare("UPDATE post_cache SET hit_count = hit_count + 1 WHERE hash = ?")
            .bind(hash)
            .run();

          const obj = JSON.parse(cached.structured_result);
          return { ...obj, id: crypto.randomUUID(), extractedAt: new Date().toISOString(), status: "interested" as const, notes: null };
        }

        // 未命中：呼叫 OpenAI
        const { object } = await generateObject({
          model: openai("gpt-5-mini"),
          schema: rentRecordSchema.omit({ extractedAt: true, status: true, notes: true }),
          prompt: `你是一個台灣租屋資訊萃取助手。請從以下 Facebook 租屋社團貼文中萃取結構化的租屋資料。
如果某個欄位在貼文中找不到，就設為 null。
features 欄位請萃取所有值得注意的特色，如：近捷運、附冷氣、附家具、可養寵物、有陽台等。
originalText 請截斷到 200 字以內。
所有文字用繁體中文。

貼文內容：
${post}`,
        });

        // 存快取
        await db
          .prepare(
            "INSERT INTO post_cache (hash, structured_result) VALUES (?, ?) ON CONFLICT(hash) DO NOTHING"
          )
          .bind(hash, JSON.stringify(object))
          .run();

        return {
          ...object,
          extractedAt: new Date().toISOString(),
          id: crypto.randomUUID(),
          status: "interested" as const,
          notes: null,
        };
      }),
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "分析過程中發生錯誤，請確認 API Key 是否正確" },
      { status: 500 },
    );
  }
}
