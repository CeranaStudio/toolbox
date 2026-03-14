# FB 租屋過濾器 Chrome Extension — 上架指南

## 🔧 本地測試（開發用）

### 步驟
1. 打開 Chrome，網址列輸入：`chrome://extensions/`
2. 右上角開啟 **「開發人員模式」**（Developer mode）
3. 點「**載入未封裝項目**」（Load unpacked）
4. 選擇這個資料夾：`tools/fb-rent-extension/`
5. Extension 就裝好了，Chrome 工具列會出現圖示

### 測試方式
1. 打開任意 Facebook 租屋社團，例如：
   - https://www.facebook.com/groups/ntp.aptforrent
   - https://www.facebook.com/groups/taipei.rent
2. 點 Extension 圖示
3. 設定條件（可選）→ 按「開始掃描」
4. Extension 會自動往下滑、分析貼文、加入清單

### 修改 code 後更新
1. 修改任意 `.js` / `.html` 檔案
2. 回到 `chrome://extensions/`
3. 點那個 Extension 的「重新整理」按鈕（🔄）
4. 重新測試

---

## 📦 打包上架 Chrome Web Store

### 前置作業
- [ ] Google 開發者帳號（一次性費用 $5 USD）：https://chrome.google.com/webstore/devconsole
- [ ] Extension 打包成 .zip
- [ ] 準備素材（見下方）

### 打包
```bash
# 在 extension 資料夾執行
cd tools/fb-rent-extension
zip -r fb-rent-extension.zip . \
  --exclude "*.md" \
  --exclude ".DS_Store" \
  --exclude "node_modules/*"
```

### 上架素材清單
| 項目 | 規格 | 說明 |
|------|------|------|
| 截圖 x4 | 1280×800 或 640×400 | 展示 popup UI + 掃描過程 |
| 小圖示 | 128×128 PNG | 已有 icons/128.png |
| 促銷圖（可選） | 440×280 PNG | 商店首頁展示用 |
| 隱私權政策 | 網頁 URL | 必須要有（見下方） |

### 隱私權政策
必填。最簡單的做法：在 `fb-rent-filter.cerana-mail.workers.dev` 加一個 `/privacy` 頁面。

內容重點：
- 我們不收集用戶的 Facebook 帳號資訊
- 貼文內容只用於 AI 萃取，不儲存原始文字
- 不追蹤用戶行為

### 上架流程
1. 前往 https://chrome.google.com/webstore/devconsole
2. 點「+ 新增項目」
3. 上傳 `.zip`
4. 填寫：
   - **名稱**：FB 租屋過濾器
   - **說明**：自動掃描 Facebook 租屋社團貼文，AI 整理成結構化清單，一鍵分享給朋友
   - **類別**：工具 (Tools)
   - **語言**：繁體中文
5. 上傳截圖和圖示
6. 填寫隱私權政策 URL
7. 送審

### 審核時間
- 首次上架：通常 **2-5 個工作日**
- 更新版本：1-2 個工作日
- 審核期間如果被退回，會收到 email 說明原因

---

## ⚠️ 常見問題

### FB 的 DOM 結構改了，掃不到貼文
FB 頻繁更改 CSS class names。如果 `extractPosts()` 失效：
1. 打開 FB 社團頁面
2. 右鍵貼文文字 → 「檢查」
3. 找到包含貼文文字的 element
4. 複製該 selector 更新 `content.js` 的 `selectors` 陣列

### Extension 被 Chrome 安全機制阻擋
確認 `manifest.json` 的 `host_permissions` 包含目標網域。

### API 呼叫失敗
確認 `API_BASE` 的 URL 是正確的 Worker URL。

---

## 🚀 後續計畫
- [ ] Firefox 版（manifest v2，略有差異）
- [ ] 支援 LINE 社群訊息轉貼
- [ ] 付費解鎖：更多清單、自動定時掃描
