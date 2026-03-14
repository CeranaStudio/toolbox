# fb-rent-filter

從 Facebook 租屋社團貼文萃取結構化租屋資料的 Next.js 應用程式。

## 功能

- 貼上 FB 租屋貼文，用 AI（GPT-4o）萃取租金、地區、坪數、房型等欄位
- 支援一次貼多篇（空白行分隔）
- 結果以表格呈現，支援排序、刪除
- localStorage 持久化儲存
- 匯出 CSV / JSON / 分享連結

## 設定

1. 安裝依賴：

```bash
bun install
```

2. 設定環境變數：

```bash
cp .env.example .env
```

編輯 `.env`，填入你的 OpenAI API Key：

```
OPENAI_API_KEY=sk-...
```

3. 啟動開發伺服器：

```bash
bun run dev
```

開啟 http://localhost:3000 即可使用。

## 技術棧

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Vercel AI SDK + OpenAI
- Zod
