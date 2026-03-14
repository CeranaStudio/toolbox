# fb-rent-filter 🏠

把 Facebook 租屋社團貼文丟進來，用 AI 洗出結構化租房資料。

## 功能

- 貼入 FB 租屋貼文（支援一次多篇）
- GPT-4o 萃取：月租金、地區、地址、坪數、房型、特色 tags、聯絡方式等
- 結果以表格顯示，支援排序、刪除
- localStorage 儲存（重整不掉）
- 匯出 CSV / JSON
- **雲端清單**：儲存到 Cloudflare D1，產生分享連結給朋友看

## 技術

- Next.js 15 App Router
- Vercel AI SDK + OpenAI gpt-4o（structured output）
- Cloudflare Workers（`@opennextjs/cloudflare`）
- Cloudflare D1（SQLite，存共享清單）

## 本地開發

```bash
cp .env.example .env.local
# 填入 OPENAI_API_KEY
npm install
npm run dev
```

## 部署到 Cloudflare Workers

### 1. 設定 API Key（一次性）

```bash
npx wrangler secret put OPENAI_API_KEY
# 貼上你的 OpenAI API Key，Enter 送出
```

### 2. Build + Deploy

```bash
npm install
npm run worker:deploy
```

### 3. D1 Migration（第一次部署前）

```bash
npx wrangler d1 execute fb-rent-filter-db --remote --file=migrations/0001_init.sql
```

## 環境變數

| 變數 | 說明 |
|------|------|
| `OPENAI_API_KEY` | OpenAI API Key（存在 Worker Secret，不會外洩） |

## D1 Database

- Database: `fb-rent-filter-db`
- ID: `ae874d9d-584a-475c-a99f-1c50b93ff171`
- Tables: `lists`, `records`

## 安全性

`OPENAI_API_KEY` 只存在 Cloudflare Worker Secret，永遠不會傳到 client（瀏覽器）。
前端只呼叫 `/api/analyze`，key 只在 Worker 裡使用。
