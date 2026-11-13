import { getStore } from "@netlify/blobs";
import { send } from "../lib/push.mjs";
import { dayInfo, defaults } from "../lib/day.mjs";

// Her saat başı çalışır. Uygulama kapalı olsa da bildirimi sunucu gönderir.
export default async () => {
  const store = getStore("devices");
  const now = new Date();
  const { blobs } = await store.list();
  for (const { key } of blobs) {
    const d = await store.get(key, { type: "json" });
    if (!d?.subscription) continue;
    const s = { ...defaults, ...d.settings };
    const { day, hour, line } = dayInfo(s.tz, now);
    if (hour < s.start || hour > s.end || (hour - s.start) % s.every !== 0) continue;
    try {
      await send(d.subscription, { title: `Bugün günlerden ${day} 🌼`, body: line, tag: "gun" });
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) { delete d.subscription; await store.setJSON(key, d); }
      else console.error("push hatası", e.statusCode || e.message);
    }
  }
};

export const config = { schedule: "0 * * * *" };
