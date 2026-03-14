import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { analyzeRequestSchema, rentRecordSchema } from "@/lib/schema";

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

  try {
    const results = await Promise.all(
      posts.map(async (post) => {
        const { object } = await generateObject({
          model: openai("gpt-4o"),
          schema: rentRecordSchema.omit({ extractedAt: true }),
          prompt: `你是一個台灣租屋資訊萃取助手。請從以下 Facebook 租屋社團貼文中萃取結構化的租屋資料。
如果某個欄位在貼文中找不到，就設為 null。
features 欄位請萃取所有值得注意的特色，如：近捷運、附冷氣、附家具、可養寵物、有陽台等。
originalText 請截斷到 200 字以內。
所有文字用繁體中文。

貼文內容：
${post}`,
        });

        return {
          ...object,
          extractedAt: new Date().toISOString(),
          id: crypto.randomUUID(),
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
