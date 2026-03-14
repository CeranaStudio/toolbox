// FB 租屋過濾器 - Content Script
// 在 Facebook 頁面上執行，掃描貼文並送到 API

const API_BASE = "https://fb-rent-filter.cerana-mail.workers.dev";

let isScraping = false;
let stopRequested = false;

// 已處理過的貼文 (避免重複)
const processedHashes = new Set();

// 簡單的 string hash（不是 crypto，只用於去重）
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// 從 FB 頁面抓取可見的貼文文字
function extractPosts() {
  const posts = [];

  // FB 的貼文文字常見 selector（可能隨 FB 更新失效）
  // 策略：找到貼文容器，抓取所有文字
  const selectors = [
    // 一般動態貼文
    '[data-ad-comet-preview="message"]',
    '[data-ad-preview="message"]',
    // 社團貼文
    '.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6',
    // 備用：找所有 role=article 的元素
  ];

  // 主要策略：找 role="article" 的貼文容器
  const articles = document.querySelectorAll('[role="article"]');

  articles.forEach((article) => {
    // 排除廣告和推薦
    if (article.closest('[data-pagelet="FeedUnit"]')?.querySelector('[aria-label="贊助"]')) return;
    if (article.querySelector('[aria-label="贊助"]')) return;

    // 抓取貼文文字：找最長的文字區塊
    const textEls = article.querySelectorAll(
      '[data-ad-comet-preview="message"], [data-ad-preview="message"], [dir="auto"]'
    );

    let postText = "";
    textEls.forEach((el) => {
      const t = el.innerText?.trim();
      if (t && t.length > postText.length) {
        postText = t;
      }
    });

    // 備用：直接抓整個 article 的文字（截斷前 2000 字）
    if (!postText || postText.length < 50) {
      postText = article.innerText?.trim().slice(0, 2000) || "";
    }

    if (postText.length < 50) return; // 太短，跳過

    const hash = simpleHash(postText);
    if (processedHashes.has(hash)) return;

    // 基本篩選：包含常見租屋關鍵字才送
    const keywords = ["租", "月租", "押金", "坪", "套房", "分租", "出租", "雅房"];
    const hasKeyword = keywords.some((k) => postText.includes(k));
    if (!hasKeyword) return;

    processedHashes.add(hash);
    posts.push(postText);
  });

  return posts;
}

// 送一篇貼文到 API 分析
async function analyzePost(postText) {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ posts: [postText] }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

// 把分析結果加入清單
async function addToList(listId, records) {
  const res = await fetch(`${API_BASE}/api/lists/${listId}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records }),
  });
  if (!res.ok) throw new Error(`List API error: ${res.status}`);
  return res.json();
}

// 建立新清單
async function createList(name) {
  const res = await fetch(`${API_BASE}/api/lists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, records: [] }),
  });
  if (!res.ok) throw new Error(`Create list error: ${res.status}`);
  const data = await res.json();
  return data.id;
}

// 自動往下滑
function scrollDown() {
  return new Promise((resolve) => {
    window.scrollBy({ top: window.innerHeight * 1.5, behavior: "smooth" });
    setTimeout(resolve, 2500); // 等 FB 載入新內容
  });
}

// 主掃描流程
async function startScrape(config) {
  if (isScraping) return;
  isScraping = true;
  stopRequested = false;

  const { maxPrice, district, maxScrolls, listId: inputListId } = config;
  let listId = inputListId;
  let scanned = 0;
  let added = 0;
  let scroll = 0;

  try {
    // 先滾到頂部
    window.scrollTo({ top: 0, behavior: "smooth" });
    await new Promise((r) => setTimeout(r, 1000));

    // 掃描 + 滾動
    while (scroll <= maxScrolls && !stopRequested) {
      const posts = extractPosts();

      for (const postText of posts) {
        if (stopRequested) break;

        try {
          const results = await analyzePost(postText);
          scanned++;

          // 套用 filter
          const filtered = results.filter((r) => {
            if (maxPrice && r.price && r.price > maxPrice) return false;
            if (district && r.district && !r.district.includes(district)) return false;
            return true;
          });

          if (filtered.length > 0) {
            // 建立清單（如果還沒有）
            if (!listId) {
              const today = new Date().toLocaleDateString("zh-TW");
              listId = await createList(`租屋清單 ${today}`);
              chrome.runtime.sendMessage({ action: "PROGRESS", scanned, added, scroll, listId });
            }

            await addToList(listId, filtered);
            added += filtered.length;
          }

          // 更新進度
          chrome.runtime.sendMessage({ action: "PROGRESS", scanned, added, scroll, listId });

          // 稍微等一下避免 API rate limit
          await new Promise((r) => setTimeout(r, 300));
        } catch (err) {
          console.warn("[FB租屋] post error:", err);
        }
      }

      // 往下滑
      scroll++;
      if (scroll <= maxScrolls) {
        chrome.runtime.sendMessage({ action: "PROGRESS", scanned, added, scroll, listId });
        await scrollDown();
      }
    }

    chrome.runtime.sendMessage({ action: "DONE", scanned, added, listId });
  } catch (err) {
    chrome.runtime.sendMessage({ action: "ERROR", error: err.message });
  } finally {
    isScraping = false;
  }
}

// 接收來自 popup 的訊息
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "START_SCRAPE") {
    sendResponse({ ok: true });
    startScrape(msg.config);
  }
  if (msg.action === "STOP_SCRAPE") {
    stopRequested = true;
    isScraping = false;
    sendResponse({ ok: true });
  }
  return true; // keep channel open
});

console.log("[FB租屋過濾器] content script 已載入");
