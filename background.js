chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

async function sendKafka(cfg, items) {
  const res = await fetch(cfg.gatewayUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: cfg.topic, message: JSON.stringify(items) })
  });
  const text = await res.text();
  if (!res.ok) throw new Error("HTTP " + res.status + " " + text);
  return { ok: true, status: res.status, body: text };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SEND_KAFKA") {
    sendKafka(msg.cfg, msg.items)
      .then((r) => sendResponse(r))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
});
