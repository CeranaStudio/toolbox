# toolbox

CeranaStudio 的內部工具箱 — 包含各種語言寫的 utilities、腳本和小工具。

## 工具列表

| 工具 | 語言 | 說明 |
|------|------|------|
| [resolve-bot](./tools/resolve-bot/) | TypeScript (Bun) | Discord 提醒機器人，持續 ping 直到任務完成 |
| [groq-transcriber](./tools/groq-transcriber/) | Bash | 使用 Groq Whisper API 將音頻/影片轉成文字稿 |
| [auto-subtitle](./tools/auto-subtitle/) | TypeScript (Next.js) | 將音訊轉成字幕並嵌入影片，使用 Whisper + FFmpeg |

## 結構

```
cerana-toolbox/
├── tools/
│   ├── resolve-bot/        # TypeScript / Bun
│   ├── groq-transcriber/   # Bash
│   └── auto-subtitle/      # TypeScript / Next.js
└── README.md
```

## 貢獻新工具

每個工具放在 `tools/<tool-name>/` 資料夾下，需包含：
- `README.md` — 說明用途、安裝與使用方式
- `.env.example` — 如有環境變數，列出所有 key（值留空）
- `.gitignore` — 不要 commit `.env`、`node_modules` 等

語言不限：TypeScript、Python、Go、Bash、Rust... 都歡迎。
