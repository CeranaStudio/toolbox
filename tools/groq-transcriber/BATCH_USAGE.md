# 批次轉錄與時間軸功能使用指南

## 新功能概覽

### 1. 批次處理多個檔案
一次命令處理多個音頻或影片檔案：

```bash
./transcribe.sh file1.m4a file2.mp4 file3.wav
```

### 2. 逐字時間軸輸出
每個字詞都附帶精確的時間戳：

```
[00:00:00.000] 各位
[00:00:00.450] 好
[00:00:01.200] 今天
[00:00:01.650] 的
[00:00:02.100] 會議
```

### 3. 錯誤容錯
某個檔案處理失敗不會中斷其他檔案：

```bash
./transcribe.sh valid.m4a missing.mp4 valid2.wav
# 會跳過 missing.mp4，繼續處理其他檔案
```

## 使用範例

### 單一檔案（向後兼容）
```bash
./transcribe.sh meeting.m4a
```

**輸出**:
- `meeting_transcript_with_timestamps.txt` - 含時間軸的完整轉錄

### 多個檔案批次處理
```bash
./transcribe.sh \
  monday_meeting.m4a \
  tuesday_interview.mp4 \
  wednesday_discussion.wav
```

**輸出**:
- `monday_meeting_transcript_with_timestamps.txt`
- `tuesday_interview_transcript_with_timestamps.txt`
- `wednesday_discussion_transcript_with_timestamps.txt`

### 處理含空格的檔名
```bash
./transcribe.sh "2024-01-15 團隊會議.m4a" "客戶訪談 final.mp4"
```

### 批次處理整個目錄
```bash
./transcribe.sh recordings/*.m4a
```

## 輸出格式

### 時間軸文本檔案
檔名格式: `<原始檔名>_transcript_with_timestamps.txt`

內容格式:
```
[HH:MM:SS.mmm] 完整句子
```

**按句子分組顯示** - 每個句子一行，時間戳為句子開始時間

範例:
```
[00:00:00.000] 大家好，我是主持人。
[00:00:02.200] 今天我們要討論的主題是人工智慧的發展。
[00:00:08.500] 首先請張教授為我們介紹一下背景。
[00:00:15.300] 謝謝主持人！
[00:00:16.200] 這個議題確實非常重要。
```

**句子識別規則**:
- 中文標點：。！？；
- 英文標點：. ! ? ;
- 遇到標點符號自動斷句
- 未結束的句子在片段結尾自動輸出

### 批次處理報告
處理完成後會顯示統計資訊：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 批次處理完成
   成功: 3 個檔案
   失敗: 0 個檔案
   總計: 3 個檔案
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 功能特性

### 自動格式檢測
- **音頻格式**: m4a, mp3, wav, flac, ogg, aac, wma, opus
- **影片格式**: mp4, mkv, avi, mov, wmv, flv, webm, ts, m4v, mpg, mpeg
- 影片會自動提取音頻進行轉錄

### 智能分段處理
- 長音頻自動切割為 10 分鐘片段
- 累積時間偏移確保時間軸連續
- 避免超過 Groq API 25MB 限制

### 錯誤處理層級

#### 批次層級
- 檔案不存在 → 跳過該檔案，繼續處理其他檔案
- 不支援的格式 → 跳過該檔案，顯示警告

#### 片段層級
- API 請求失敗 → 跳過該片段，繼續處理其他片段
- JSON 結構異常 → 跳過該片段，顯示回應預覽
- 缺少時間軸數據 → 跳過該片段，顯示警告

#### 關鍵錯誤（整批中斷）
- GROQ_API_KEY 未設定
- 網路連線中斷

## 進度指示

處理每個檔案時會顯示：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 處理檔案 1/3: meeting.m4a
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--- 腳本開始執行 ---
輸入音頻文件: /path/to/meeting.m4a
所有輸出將保存在: /path/to
---
--- 開始音頻切割 ---
...
--- 音頻切割完成，開始進行語音轉錄 ---
正在處理文件: meeting_part_000.m4a
成功轉錄 meeting_part_000.m4a
正在處理文件: meeting_part_001.m4a
成功轉錄 meeting_part_001.m4a
---
--- 語音轉錄完成，開始生成時間軸文本 ---
✅ 轉錄結果（含時間軸）: meeting_transcript_with_timestamps.txt
---
已清理中間文件: 2 個音頻片段, 2 個 JSON 文件
✅ 檔案處理完成: meeting.m4a
```

## 實用技巧

### 1. 批次處理特定日期的錄音
```bash
./transcribe.sh recordings/2024-01-*.m4a
```

### 2. 處理多種格式混合
```bash
./transcribe.sh audio/*.{m4a,mp3,wav} videos/*.{mp4,mov}
```

### 3. 使用 find 命令處理子目錄
```bash
find recordings/ -name "*.m4a" -exec ./transcribe.sh {} +
```

### 4. 並行處理多個批次（進階）
```bash
# 分成兩批並行處理
./transcribe.sh file1.m4a file2.m4a &
./transcribe.sh file3.mp4 file4.wav &
wait
```

## 時間軸應用場景

### 1. 會議記錄回放
點擊時間戳快速定位到錄音的特定時間點

### 2. 字幕生成
時間軸文本可輕易轉換為 SRT 字幕格式

### 3. 內容檢索
搜尋特定關鍵字並定位其出現的時間點

### 4. 語音分析
分析說話速度、停頓模式等

## 效能與限制

### API 限制
- 單個請求最大 25MB
- 預設 API 請求間隔: 2 秒（可透過 `API_REQUEST_DELAY` 環境變數調整）

### 分段設定
- 預設分段長度: 10 分鐘 (600 秒)
- 可透過 `SEGMENT_TIME_SECONDS` 環境變數調整

### 時間戳精度
- 毫秒級精度 (±0.001 秒)
- 跨片段時間軸自動對齊

## 疑難排解

### 問題: 時間軸數據缺失
**症狀**: 顯示 "⚠️ 無時間軸數據"

**可能原因**:
- API 回應中未包含 `words` 數組
- Groq API 版本更新導致回應格式變更

**解決方案**:
- 檢查 API 回應: 查看對應的 JSON 檔案
- 確認 API 參數: `timestamp_granularities[]=word` 是否有效

### 問題: 累積偏移錯誤
**症狀**: 後面片段的時間戳不正確

**可能原因**:
- `duration` 欄位缺失或為 null
- 浮點數計算精度問題

**解決方案**:
- 腳本已使用 `jq -r '.duration // 0'` 提供預設值
- 使用 `awk` 進行高精度浮點數計算

### 問題: 批次處理中斷
**症狀**: 處理第一個檔案後腳本退出

**可能原因**:
- 舊版腳本（未支援批次處理）

**解決方案**:
- 確認腳本版本包含批次處理功能
- 檢查參數驗證邏輯是否為 `if [ $# -eq 0 ]`

## 技術細節

### 時間戳格式化演算法
```bash
format_timestamp() {
  local seconds="$1"
  local hours=$((${seconds%.*} / 3600))
  local minutes=$(((${seconds%.*} % 3600) / 60))
  local secs=$((${seconds%.*} % 60))
  local millis="..."
  printf "[%02d:%02d:%02d.%s]" "$hours" "$minutes" "$secs" "$millis"
}
```

### 累積偏移計算
```bash
# 提取當前片段時長
SEGMENT_DURATION=$(jq -r '.duration // 0' "$JSON_OUTPUT_FILE")

# 更新累積偏移
CUMULATIVE_OFFSET=$(awk "BEGIN {print $CUMULATIVE_OFFSET + $SEGMENT_DURATION}")

# 應用偏移到時間戳
jq -r --argjson offset "$CUMULATIVE_OFFSET" \
  '.words[]? | "\($offset + .start)|\(.word)"'
```

## 更新紀錄

### v2.0 (2024-01-15)
- ✨ 新增批次處理多個檔案功能
- ✨ 新增逐字時間軸輸出
- ✨ 強化錯誤處理和容錯機制
- 🔧 修改輸出檔名為 `_transcript_with_timestamps.txt`
- 📊 新增批次處理統計報告
- ⚡ 優化累積偏移計算精度

### v1.0
- 🎉 初始版本
- 支援單一音頻/影片檔案轉錄
- 自動音頻分段處理
- 純文本輸出
