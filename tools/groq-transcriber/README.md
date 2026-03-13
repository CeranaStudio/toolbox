# groq-transcriber

使用 [Groq](https://groq.com) 的 Whisper Large V3 API，將音頻或影片檔自動切段、轉錄，並合併成完整文字稿。

## 需求

- `bash`
- [`ffmpeg`](https://ffmpeg.org) — 音頻切割 & 影片音頻提取
- [`jq`](https://jqlang.github.io/jq/) — 解析 API JSON 回應
- `curl`

```bash
# macOS
brew install ffmpeg jq

# Ubuntu/Debian
sudo apt install ffmpeg jq
```

## 設定

```bash
cp .env.example .env
# 編輯 .env，填入 GROQ_API_KEY
```

Groq API 金鑰在 [console.groq.com](https://console.groq.com) 取得（免費方案即可）。

## 使用

```bash
chmod +x transcribe.sh

# 音頻檔
./transcribe.sh ./meeting.m4a

# 影片檔（自動提取音頻）
./transcribe.sh ./recording.mp4
```

轉錄完成後，文字稿會輸出在與輸入檔案**同一個目錄**下，命名為 `<原始檔名>_full_transcript.txt`。

## 支援格式

| 類型 | 格式 |
|------|------|
| 音頻 | m4a, mp3, wav, flac, ogg, aac, wma, opus |
| 影片 | mp4, mkv, avi, mov, wmv, flv, webm, ts, m4v, mpg, mpeg |

## 運作原理

1. 用 ffmpeg 把音頻切成多個片段（預設每段 10 分鐘），避免超過 Groq API 的 25MB 限制
2. 逐段呼叫 Groq `/audio/transcriptions`（Whisper Large V3，繁體中文）
3. 合併所有片段的文字，輸出完整文字稿
4. 清理中間產生的暫存檔

## 環境變數

| 變數 | 必填 | 說明 |
|------|------|------|
| `GROQ_API_KEY` | ✅ | Groq API 金鑰 |
| `SEGMENT_TIME_SECONDS` | — | 每段秒數（預設 600） |
| `API_REQUEST_DELAY` | — | 請求間隔秒數（預設 2） |
