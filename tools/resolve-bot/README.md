# resolve-bot

Discord 提醒機器人。建立任務後，bot 會持續 ping 負責人直到任務被標記為完成。

## 技術棧

- Runtime: [Bun](https://bun.sh)
- Language: TypeScript
- DB: PostgreSQL
- Platform: Discord (slash commands)

## 安裝

```bash
bun install
```

## 設定

複製 `.env.example` 為 `.env` 並填入必要的值：

```bash
cp .env.example .env
```

| 變數 | 必填 | 說明 |
|------|------|------|
| `DISCORD_TOKEN` | ✅ | Discord Developer Portal 取得的 Bot Token |
| `DISCORD_CLIENT_ID` | ✅ | Application (Client) ID |
| `DATABASE_URL` | ✅ | PostgreSQL 連線字串，格式：`postgres://user:pass@host:5432/db` |
| `PING_CHECK_INTERVAL_MS` | — | Scheduler tick 間隔（毫秒，預設 60000） |
| `DEFAULT_INTERVAL_MIN` | — | 新任務預設 ping 間隔（分鐘，預設 30） |
| `DEFAULT_MAX_PINGS` | — | 升級前最大 ping 次數（預設 5） |
| `PORT` | — | Health check HTTP port（預設 8080） |

## 使用

```bash
# 啟動 bot
bun run start

# 第一次部署：註冊 slash commands（只需執行一次）
bun run register
```
