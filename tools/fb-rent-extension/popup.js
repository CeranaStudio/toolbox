const API_BASE = "https://fb-rent-filter.cerana-mail.workers.dev";

let isRunning = false;
let listId = null;
let stats = { scanned: 0, added: 0, cached: 0 };

// DOM refs
const startBtn = document.getElementById("startBtn");
const actionArea = document.getElementById("actionArea");
const statusBox = document.getElementById("statusBox");
const statsEl = document.getElementById("stats");
const listLinkArea = document.getElementById("listLinkArea");
const listLink = document.getElementById("listLink");
const listUrlInput = document.getElementById("listUrl");

// Restore saved settings
chrome.storage.local.get(["listUrl", "maxPrice", "district", "maxScrolls"], (data) => {
  if (data.listUrl) document.getElementById("listUrl").value = data.listUrl;
  if (data.maxPrice) document.getElementById("maxPrice").value = data.maxPrice;
  if (data.district) document.getElementById("district").value = data.district;
  if (data.maxScrolls) document.getElementById("maxScrolls").value = data.maxScrolls;
});

function setStatus(msg, type = "") {
  statusBox.textContent = msg;
  statusBox.className = "status-box" + (type ? " " + type : "");
}

function updateStats() {
  document.getElementById("scanned").textContent = stats.scanned;
  document.getElementById("added").textContent = stats.added;
  document.getElementById("cached").textContent = stats.cached;
  statsEl.style.display = "flex";
}

startBtn.addEventListener("click", async () => {
  // Save settings
  const maxPrice = document.getElementById("maxPrice").value;
  const district = document.getElementById("district").value;
  const maxScrolls = parseInt(document.getElementById("maxScrolls").value) || 10;
  const listUrl = listUrlInput.value.trim();

  chrome.storage.local.set({ listUrl, maxPrice, district, maxScrolls });

  // Extract list ID from URL if provided
  if (listUrl) {
    const match = listUrl.match(/\/list\/([a-f0-9-]+)/);
    if (match) {
      listId = match[1];
    } else {
      setStatus("連結格式錯誤，請貼入 /list/xxxx 格式的連結", "error");
      return;
    }
  } else {
    listId = null; // will create new list
  }

  isRunning = true;
  stats = { scanned: 0, added: 0, cached: 0 };
  updateStats();
  setStatus("啟動中，正在讀取頁面貼文...", "running");

  // Show stop button
  actionArea.innerHTML = `<button class="btn-stop" id="stopBtn">⏹ 停止</button>`;
  document.getElementById("stopBtn").addEventListener("click", () => {
    isRunning = false;
    setStatus("已停止", "");
    resetActionBtn();
  });

  // Inject and run content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url?.includes("facebook.com")) {
    setStatus("請先打開 Facebook 租屋社團頁面", "error");
    resetActionBtn();
    return;
  }

  // Send message to content script to start scraping
  chrome.tabs.sendMessage(
    tab.id,
    {
      action: "START_SCRAPE",
      config: { maxPrice: maxPrice ? parseInt(maxPrice) : null, district, maxScrolls, listId },
    },
    (response) => {
      if (chrome.runtime.lastError) {
        // Content script not ready, inject it
        chrome.scripting.executeScript(
          { target: { tabId: tab.id }, files: ["content.js"] },
          () => {
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, {
                action: "START_SCRAPE",
                config: { maxPrice: maxPrice ? parseInt(maxPrice) : null, district, maxScrolls, listId },
              });
            }, 500);
          }
        );
      }
    }
  );

  // Listen for progress updates from content script
  chrome.runtime.onMessage.addListener(function listener(msg) {
    if (msg.action === "PROGRESS") {
      stats.scanned = msg.scanned;
      stats.added = msg.added;
      setStatus(`掃描中... 第 ${msg.scroll} / ${maxScrolls} 頁`, "running");
      updateStats();
      if (msg.listId && !listId) {
        listId = msg.listId;
        const url = `${API_BASE}/list/${listId}`;
        listLink.href = url;
        listLink.textContent = "📋 開啟我的清單 →";
        listLinkArea.style.display = "block";
      }
    }
    if (msg.action === "DONE") {
      stats.scanned = msg.scanned;
      stats.added = msg.added;
      updateStats();
      if (msg.listId) {
        listId = msg.listId;
        const url = `${API_BASE}/list/${listId}`;
        listLink.href = url;
        listLinkArea.style.display = "block";
        // save to input
        listUrlInput.value = url;
        chrome.storage.local.set({ listUrl: url });
      }
      setStatus(`✅ 完成！共加入 ${msg.added} 筆租屋資料`, "done");
      isRunning = false;
      resetActionBtn();
      chrome.runtime.onMessage.removeListener(listener);
    }
    if (msg.action === "ERROR") {
      setStatus("錯誤：" + msg.error, "error");
      isRunning = false;
      resetActionBtn();
      chrome.runtime.onMessage.removeListener(listener);
    }
  });
});

function resetActionBtn() {
  actionArea.innerHTML = `<button class="btn-primary" id="startBtn">🔍 開始掃描</button>`;
  document.getElementById("startBtn").addEventListener("click", () => location.reload());
}
