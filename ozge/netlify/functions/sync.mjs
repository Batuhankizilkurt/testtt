import { getStore } from "@netlify/blobs";
import { send } from "../lib/push.mjs";
import { dayInfo, defaults } from "../lib/day.mjs";

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json" } });
const validId = (id) => typeof id === "string" && /^[0-9a-f-]{36}$/.test(id);
const num = (v, min, max, def) => { v = parseInt(v, 10); return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def; };

export default async (req) => {
  const store = getStore("devices");

  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("deviceId");
    if (!validId(id)) return json({ error: "deviceId" }, 400);
    const d = (await store.get(id, { type: "json" })) || {};
    return json({ settings: { ...defaults, ...d.settings }, subscribed: !!d.subscription });
  }
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const b = await req.json().catch(() => ({}));
  if (!validId(b.deviceId)) return json({ error: "deviceId" }, 400);
  const d = (await store.get(b.deviceId, { type: "json" })) || {};
  d.settings = { ...defaults, ...d.settings };

  switch (b.action) {
    case "subscribe":
      if (!b.subscription?.endpoint) return json({ error: "subscription" }, 400);
      d.subscription = b.subscription;
      if (b.tz) d.settings.tz = String(b.tz).slice(0, 60);
      break;
    case "settings": {
      const s = b.settings || {};
      const start = num(s.start, 0, 23, defaults.start);
      d.settings.start = start;
      d.settings.end = Math.max(start, num(s.end, 0, 23, defaults.end));
      d.settings.every = num(s.every, 1, 12, 1);
      if (b.tz) d.settings.tz = String(b.tz).slice(0, 60);
      break;
    }
    case "test":
      if (!d.subscription) return json({ error: "Önce bildirimleri aç" }, 400);
      try {
        const { day, line } = dayInfo(d.settings.tz);
        await send(d.subscription, { title: `Bugün günlerden ${day} 🌼`, body: line, tag: "gun" });
        return json({ ok: true });
      } catch (e) {
        return json({ error: "Gönderilemedi: " + (e.statusCode || e.message) }, 502);
      }
    default:
      return json({ error: "action" }, 400);
  }
  await store.setJSON(b.deviceId, d);
  return json({ settings: d.settings, subscribed: !!d.subscription });
};

export const config = { path: "/api/sync" };
