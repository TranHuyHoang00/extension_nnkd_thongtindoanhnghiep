function el(id) { return document.getElementById(id); }

function joinKey(base, key) {
  base = (base || "").trim();
  key = (key || "").trim();
  if (!key) return base;
  return base + (base.indexOf("?") === -1 ? "?" : "&") + "apikey=" + encodeURIComponent(key);
}

function logLine(s) {
  const pre = el("log");
  const t = new Date().toLocaleTimeString();
  pre.textContent += "[" + t + "] " + s + "\n";
  pre.scrollTop = pre.scrollHeight;
}

function readCfg() {
  return {
    apiUrl: el("apiUrl").value.trim(),
    gatewayUrl: joinKey(el("gatewayUrl").value, el("apikey").value),
    topic: el("topic").value.trim(),
    limit: parseInt(el("limit").value, 10)
  };
}

async function activeTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

el("start").addEventListener("click", async () => {
  const cfg = readCfg();
  if (!el("apikey").value.trim()) { logLine("Enter the API Key first."); return; }
  const tab = await activeTab();
  if (!tab || !tab.url || tab.url.indexOf("thongtindoanhnghiep.co") === -1) {
    logLine("Open a thongtindoanhnghiep.co tab first and keep it active.");
    return;
  }
  logLine("Start on tab: " + tab.url);
  chrome.tabs.sendMessage(tab.id, { type: "START", cfg: cfg });
});

el("stop").addEventListener("click", async () => {
  const tab = await activeTab();
  if (tab) chrome.tabs.sendMessage(tab.id, { type: "STOP" });
  logLine("Stop requested.");
});

el("clear").addEventListener("click", () => {
  el("log").textContent = "";
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "LOG") logLine(msg.text);
});