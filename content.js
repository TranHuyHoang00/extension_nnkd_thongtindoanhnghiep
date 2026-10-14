let STOP = false;

function log(s) {
  chrome.runtime.sendMessage({ type: "LOG", text: s });
}

async function apiGet(url) {
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 403) throw new Error("CF_403 (Cloudflare block)");
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

function toArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const k of Object.keys(data)) {
      if (Array.isArray(data[k])) return data[k];
    }
    return [data];
  }
  return [];
}

function pushKafka(cfg, items) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "SEND_KAFKA", cfg: cfg, items: items }, (r) => resolve(r));
  });
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run(cfg) {
  STOP = false;
  log("Fetching " + cfg.apiUrl);
  let data;
  try {
    data = await apiGet(cfg.apiUrl);
  } catch (e) {
    log("Error: " + e.message);
    return;
  }

  let all = toArray(data);
  if (cfg.limit && cfg.limit > 0) all = all.slice(0, cfg.limit);
  log("Got " + all.length + " items");

  if (all.length === 0) {
    log("Nothing to send.");
    return;
  }

  let buf = [];
  let sent = 0;
  for (let i = 0; i < all.length; i++) {
    if (STOP) { log("Stopped at " + sent + "/" + all.length); return; }
    buf.push(all[i]);
    if (buf.length >= cfg.batch) {
      const r = await pushKafka(cfg, buf);
      if (!r || !r.ok) { log("Gateway error: " + (r ? (r.error || r.status) : "no response")); return; }
      sent += buf.length;
      log("Sent " + sent + "/" + all.length);
      buf = [];
      if (cfg.delay > 0) await sleep(cfg.delay);
    }
  }

  if (buf.length > 0) {
    const r = await pushKafka(cfg, buf);
    if (!r || !r.ok) { log("Gateway error: " + (r ? (r.error || r.status) : "no response")); return; }
    sent += buf.length;
    log("Sent " + sent + "/" + all.length);
  }

  log("Done. Total sent " + sent);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "START") run(msg.cfg);
  if (msg.type === "STOP") STOP = true;
});
