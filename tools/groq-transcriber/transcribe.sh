#!/bin/bash
set -euo pipefail

# --- 載入 .env ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
  # shellcheck disable=SC1091
  set -o allexport
  source "$SCRIPT_DIR/.env"
  set +o allexport
fi

# --- 必要環境變數檢查 ---
if [ -z "${GROQ_API_KEY:-}" ]; then
  echo "錯誤: GROQ_API_KEY 未設定。"
  echo "請複製 .env.example 為 .env 並填入你的 Groq API 金鑰。"
  exit 1
fi

# --- 配置參數 ---
# 每個音頻片段的時長（秒），預設 10 分鐘
# 如果 20 分鐘音頻仍超過 25MB，請調低此值
SEGMENT_TIME_SECONDS="${SEGMENT_TIME_SECONDS:-600}"
# API 請求間的延遲（秒），避免速率限制
API_REQUEST_DELAY="${API_REQUEST_DELAY:-2}"
# 等待文件生成的最大秒數
MAX_WAIT_TIME=30
WAIT_INTERVAL=2

# --- 參數檢查與路徑設定 ---
if [ -z "${1:-}" ]; then
  echo "使用方式: $0 <輸入音頻或影片文件路徑>"
  echo "範例: $0 \"./my_audio_files/recording.m4a\""
  echo "範例: $0 \"/Users/yourname/Downloads/meeting.mp4\""
  exit 1
fi

INPUT_FILE_FULL_PATH="$(realpath "$1")"

if [ ! -f "$INPUT_FILE_FULL_PATH" ]; then
  echo "錯誤: 輸入文件 '$INPUT_FILE_FULL_PATH' 不存在。"
  exit 1
fi

OUTPUT_DIR="$(dirname "$INPUT_FILE_FULL_PATH")"
INPUT_EXT="${INPUT_FILE_FULL_PATH##*.}"
INPUT_EXT_LOWER="$(echo "$INPUT_EXT" | tr '[:upper:]' '[:lower:]')"
AUDIO_BASE_NAME="$(basename "$INPUT_FILE_FULL_PATH" ".$INPUT_EXT")"

AUDIO_FORMATS="m4a mp3 wav flac ogg aac wma opus"
VIDEO_FORMATS="mp4 mkv avi mov wmv flv webm ts m4v mpg mpeg"

NEED_CLEANUP_TMP=false

IS_AUDIO=false
for fmt in $AUDIO_FORMATS; do
  if [ "$INPUT_EXT_LOWER" = "$fmt" ]; then IS_AUDIO=true; break; fi
done

IS_VIDEO=false
for fmt in $VIDEO_FORMATS; do
  if [ "$INPUT_EXT_LOWER" = "$fmt" ]; then IS_VIDEO=true; break; fi
done

if $IS_AUDIO; then
  INPUT_AUDIO_FULL_PATH="$INPUT_FILE_FULL_PATH"
elif $IS_VIDEO; then
  echo "--- 偵測到影片檔案，使用 ffmpeg 提取音頻 ---"
  TMP_AUDIO_FILE="$OUTPUT_DIR/${AUDIO_BASE_NAME}_tmp_audio.m4a"
  ffmpeg -i "$INPUT_FILE_FULL_PATH" -vn -acodec aac -b:a 128k -y "$TMP_AUDIO_FILE"
  INPUT_AUDIO_FULL_PATH="$TMP_AUDIO_FILE"
  NEED_CLEANUP_TMP=true
  echo "音頻已提取到: $TMP_AUDIO_FILE"
else
  echo "錯誤: 不支援的檔案格式 '.$INPUT_EXT_LOWER'。"
  echo "支援的音頻格式: $AUDIO_FORMATS"
  echo "支援的影片格式: $VIDEO_FORMATS"
  exit 1
fi

echo "--- 腳本開始執行 ---"
echo "輸入音頻文件: $INPUT_AUDIO_FULL_PATH"
echo "所有輸出將保存在: $OUTPUT_DIR"
echo "---"

echo "--- 開始音頻切割 ---"
ffmpeg -i "$INPUT_AUDIO_FULL_PATH" -f segment -segment_time "$SEGMENT_TIME_SECONDS" \
  -c copy "$OUTPUT_DIR/${AUDIO_BASE_NAME}_part_%03d.m4a"

# 等待第一個分割文件生成
FIRST_SEGMENT_FILE="$OUTPUT_DIR/${AUDIO_BASE_NAME}_part_000.m4a"
echo "等待切割文件 '$FIRST_SEGMENT_FILE' 生成..."
COUNT=0
while [ ! -f "$FIRST_SEGMENT_FILE" ]; do
  if [ $COUNT -ge $MAX_WAIT_TIME ]; then
    echo "錯誤: 等待切割文件超時。"
    exit 1
  fi
  sleep "$WAIT_INTERVAL"
  COUNT=$((COUNT + WAIT_INTERVAL))
  echo "  - 已等待 $COUNT 秒..."
done

echo "--- 音頻切割完成，開始進行語音轉錄 ---"
FULL_TRANSCRIPT=""

AUDIO_SEGMENT_FILES=()
while IFS= read -r -d $'\0' file; do
  AUDIO_SEGMENT_FILES+=("$file")
done < <(find "$OUTPUT_DIR" -maxdepth 1 -name "${AUDIO_BASE_NAME}_part_*.m4a" -print0 | sort -zV)

if [ ${#AUDIO_SEGMENT_FILES[@]} -eq 0 ]; then
  echo "錯誤: 沒有找到任何分割後的音頻文件。"
  exit 1
fi

for FILE_PATH in "${AUDIO_SEGMENT_FILES[@]}"; do
  echo "正在處理文件: $(basename "$FILE_PATH")"

  JSON_OUTPUT_FILE="$OUTPUT_DIR/$(basename "${FILE_PATH%.m4a}.json")"

  curl -s "https://api.groq.com/openai/v1/audio/transcriptions" \
    -H "Authorization: Bearer $GROQ_API_KEY" \
    -F "model=whisper-large-v3" \
    -F "file=@$FILE_PATH" \
    -F "language=zh" \
    -F "response_format=verbose_json" \
    -F "timestamp_granularities[]=word" \
    -X POST > "$JSON_OUTPUT_FILE"

  if [ $? -ne 0 ]; then
    echo "警告: 對文件 $(basename "$FILE_PATH") 的 API 請求失敗。"
    cat "$JSON_OUTPUT_FILE"
    continue
  fi

  TRANSCRIPT_TEXT=$(jq -r '.text' "$JSON_OUTPUT_FILE")

  if [ -z "$TRANSCRIPT_TEXT" ] || [ "$TRANSCRIPT_TEXT" = "null" ]; then
    echo "警告: 未提取到文本，查看 API 回應："
    cat "$JSON_OUTPUT_FILE"
  else
    FULL_TRANSCRIPT+="$TRANSCRIPT_TEXT\n"
    echo "成功轉錄 $(basename "$FILE_PATH")"
  fi

  sleep "$API_REQUEST_DELAY"
done

echo "--- 語音轉錄完成，開始合併文本 ---"
FINAL_TRANSCRIPT_FILE="$OUTPUT_DIR/${AUDIO_BASE_NAME}_full_transcript.txt"
echo -e "$FULL_TRANSCRIPT" > "$FINAL_TRANSCRIPT_FILE"
echo "最終轉錄結果已保存到: $FINAL_TRANSCRIPT_FILE"

# --- 清理中間文件 ---
PART_M4A_COUNT=$(find "$OUTPUT_DIR" -maxdepth 1 -name "${AUDIO_BASE_NAME}_part_*.m4a" | wc -l)
PART_JSON_COUNT=$(find "$OUTPUT_DIR" -maxdepth 1 -name "${AUDIO_BASE_NAME}_part_*.json" | wc -l)
find "$OUTPUT_DIR" -maxdepth 1 -name "${AUDIO_BASE_NAME}_part_*.m4a" -delete
find "$OUTPUT_DIR" -maxdepth 1 -name "${AUDIO_BASE_NAME}_part_*.json" -delete
echo "已清理中間文件: $PART_M4A_COUNT 個音頻片段, $PART_JSON_COUNT 個 JSON 文件"

if $NEED_CLEANUP_TMP && [ -f "${TMP_AUDIO_FILE:-}" ]; then
  rm "$TMP_AUDIO_FILE"
  echo "已清理臨時音頻文件: $TMP_AUDIO_FILE"
fi

echo "--- 腳本執行完畢 ---"
