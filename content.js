let STOP = false;

const META = {
  owner_id: "100cd0dd269d508a5acd7c945f0e25d0",
  owner_name: "Thông Tin Doanh Nghiệp",
  profile_type: "custom",
  channel_name: "business"
};

function wrapLines(lines) {
  const now = Date.now();
  return {
    owner_id: META.owner_id,
    owner_name: META.owner_name,
    profile_type: META.profile_type,
    channel_name: META.channel_name,
    created_time: now,
    crawled_time: now,
    business_lines: lines
  };
}

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

function pushKafka(cfg, payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "SEND_KAFKA", cfg: cfg, items: payload }, (r) => resolve(r));
  });
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

  if (STOP) { log("Stopped."); return; }
  log("Sending 1 message with business_lines = " + all.length + " items");
  const r = await pushKafka(cfg, wrapLines(all));
  if (!r || !r.ok) { log("Gateway error: " + (r ? (r.error || r.status) : "no response")); return; }
  log("Done. Sent " + all.length + " business_lines in 1 message.");
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "START") run(msg.cfg);
  if (msg.type === "STOP") STOP = true;
});