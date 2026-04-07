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

# --- 時間戳格式化函數 ---
# 將秒數轉換為 [HH:MM:SS.mmm] 格式
format_timestamp() {
  local seconds="$1"
  local hours=$((${seconds%.*} / 3600))
  local minutes=$(((${seconds%.*} % 3600) / 60))
  local secs=$((${seconds%.*} % 60))

  # 提取毫秒部分
  local millis="000"
  if [[ "$seconds" == *.* ]]; then
    millis=$(printf "%.3f" "$seconds" | awk -F. '{print $2}' | head -c 3)
    millis="${millis}000"  # 補足位數
    millis="${millis:0:3}"
  fi

  printf "[%02d:%02d:%02d.%s]" "$hours" "$minutes" "$secs" "$millis"
}

# --- 參數檢查與路徑設定 ---
if [ $# -eq 0 ]; then
  echo "使用方式: $0 <音頻/影片檔案...>"
  echo "範例: $0 file1.m4a file2.mp4 file3.wav"
  echo "範例: $0 \"含 空格 的檔名.m4a\" video.mov"
  exit 1
fi

# 初始化批次統計
SUCCESS_FILES=0
FAILED_FILES=0
FILE_INDEX=0

# 批次處理循環
for INPUT_FILE in "$@"; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📂 處理檔案 $((++FILE_INDEX))/$#: $(basename "$INPUT_FILE")"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  INPUT_FILE_FULL_PATH="$(realpath "$INPUT_FILE")"

  if [ ! -f "$INPUT_FILE_FULL_PATH" ]; then
    echo "⚠️  跳過不存在的文件: $INPUT_FILE"
    ((FAILED_FILES++))
    continue
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
  echo "⚠️  不支援的檔案格式 '.$INPUT_EXT_LOWER': $INPUT_FILE"
  echo "   支援的音頻格式: $AUDIO_FORMATS"
  echo "   支援的影片格式: $VIDEO_FORMATS"
  ((FAILED_FILES++))
  continue
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
FULL_TRANSCRIPT_WITH_TIMESTAMPS=""  # 時間軸版本的轉錄文本
CUMULATIVE_OFFSET=0  # 累積音頻片段的時間偏移（秒）

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

  # 驗證 API 回應和 JSON 結構
  if [ $? -ne 0 ] || ! jq -e '.text' "$JSON_OUTPUT_FILE" > /dev/null 2>&1; then
    echo "⚠️  API 失敗或回應異常: $(basename "$FILE_PATH")"
    echo "   回應預覽: $(cat "$JSON_OUTPUT_FILE" 2>/dev/null | head -c 200)"
    continue
  fi

  # 檢查 words 數組存在性（時間軸功能必需）
  if ! jq -e '.words' "$JSON_OUTPUT_FILE" > /dev/null 2>&1; then
    echo "⚠️  無時間軸數據: $(basename "$FILE_PATH") - API 未返回 words 數組"
    continue
  fi

  TRANSCRIPT_TEXT=$(jq -r '.text' "$JSON_OUTPUT_FILE")

  if [ -z "$TRANSCRIPT_TEXT" ] || [ "$TRANSCRIPT_TEXT" = "null" ]; then
    echo "警告: 未提取到文本，查看 API 回應："
    cat "$JSON_OUTPUT_FILE"
  else
    # 提取 words 數組並應用累積偏移
    TIMELINE_SEGMENT=$(jq -r --argjson offset "$CUMULATIVE_OFFSET" \
      '.words[]? | "\($offset + .start)|\(.word)"' "$JSON_OUTPUT_FILE")

    # 按句子分組處理時間軸
    CURRENT_SENTENCE=""
    SENTENCE_START_TIME=""

    while IFS='|' read -r timestamp word; do
      if [ -n "$timestamp" ] && [ -n "$word" ]; then
        # 如果是句子的第一個字，記錄開始時間
        if [ -z "$SENTENCE_START_TIME" ]; then
          SENTENCE_START_TIME="$timestamp"
        fi

        # 累積當前句子
        CURRENT_SENTENCE+="$word"

        # 檢查是否為句子結束標點（中文：。！？；/ 英文：.!?;）
        if [[ "$word" =~ [。！？；\.\!\?]$ ]] || [[ "$word" == *";" ]]; then
          # 輸出完整句子
          FORMATTED_TS=$(format_timestamp "$SENTENCE_START_TIME")
          FULL_TRANSCRIPT_WITH_TIMESTAMPS+="$FORMATTED_TS $CURRENT_SENTENCE\n"

          # 重置句子狀態
          CURRENT_SENTENCE=""
          SENTENCE_START_TIME=""
        fi
      fi
    done <<< "$TIMELINE_SEGMENT"

    # 處理最後一個未結束的句子（如果有）
    if [ -n "$CURRENT_SENTENCE" ]; then
      FORMATTED_TS=$(format_timestamp "$SENTENCE_START_TIME")
      FULL_TRANSCRIPT_WITH_TIMESTAMPS+="$FORMATTED_TS $CURRENT_SENTENCE\n"
    fi

    # 更新累積偏移（準備下一個片段）
    SEGMENT_DURATION=$(jq -r '.duration // 0' "$JSON_OUTPUT_FILE")
    CUMULATIVE_OFFSET=$(awk "BEGIN {print $CUMULATIVE_OFFSET + $SEGMENT_DURATION}")

    echo "成功轉錄 $(basename "$FILE_PATH")"
  fi

  sleep "$API_REQUEST_DELAY"
done

echo "--- 語音轉錄完成，開始生成時間軸文本 ---"
FINAL_TIMELINE_FILE="$OUTPUT_DIR/${AUDIO_BASE_NAME}_transcript_with_timestamps.txt"
echo -e "$FULL_TRANSCRIPT_WITH_TIMESTAMPS" > "$FINAL_TIMELINE_FILE"
echo "✅ 轉錄結果（含時間軸）: $FINAL_TIMELINE_FILE"

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

  # 檔案處理成功
  ((SUCCESS_FILES++))
  echo "✅ 檔案處理完成: $(basename "$INPUT_FILE")"

done  # 結束批次處理循環

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 批次處理完成"
echo "   成功: $SUCCESS_FILES 個檔案"
echo "   失敗: $FAILED_FILES 個檔案"
echo "   總計: $(($SUCCESS_FILES + $FAILED_FILES)) 個檔案"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "--- 腳本執行完畢 ---"
