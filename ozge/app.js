const $ = (s) => document.querySelector(s);
const deviceId = localStorage.getItem("did") || (() => { const v = crypto.randomUUID(); localStorage.setItem("did", v); return v; })();
const standalone = navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Istanbul";
const cap = (s) => s.charAt(0).toLocaleUpperCase("tr") + s.slice(1);
const hasNotif = typeof Notification !== "undefined" && "PushManager" in window;

async function post(body) {
  const r = await fetch("/api/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ deviceId, tz, ...body }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Hata");
  return j;
}
const say = (t, bad) => { const m = $("#msg"); m.textContent = t; m.style.color = bad ? "var(--bad)" : "var(--ok)"; };

function urlB64(s) {
  const p = "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + p).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function renderDay() {
  const n = new Date();
  $("#day").textContent = cap(n.toLocaleDateString("tr-TR", { weekday: "long" }));
  $("#date").textContent = n.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const week = $("#week"); week.textContent = "";
  const i = (n.getDay() + 6) % 7;
  ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].forEach((x, k) => {
    const s = document.createElement("span"); s.textContent = x; if (k === i) s.className = "on"; week.append(s);
  });
}

function fillSelects() {
  for (let h = 0; h < 24; h++) for (const id of ["#start", "#end"]) {
    const o = document.createElement("option"); o.value = h; o.textContent = String(h).padStart(2, "0") + ":00"; $(id).append(o);
  }
  for (let e = 1; e <= 4; e++) {
    const o = document.createElement("option"); o.value = e; o.textContent = e === 1 ? "Her saat başı" : e + " saatte bir"; $("#every").append(o);
  }
}

function setUI(subscribed) {
  const ok = subscribed && hasNotif && Notification.permission === "granted";
  $("#notifState").textContent = ok ? "Açık ✓ (uygulama kapalıyken de gelir)" : "Kapalı";
  $("#enable").classList.toggle("hidden", ok);
  $("#settings").classList.toggle("hidden", !ok);
}

async function load() {
  try {
    const r = await (await fetch("/api/sync?deviceId=" + deviceId)).json();
    $("#start").value = r.settings.start; $("#end").value = r.settings.end; $("#every").value = r.settings.every;
    setUI(r.subscribed);
  } catch { say("Sunucuya ulaşılamadı.", true); }
}

$("#enable").onclick = async () => {
  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return say("İzin verilmedi. iPhone Ayarlar'dan bildirimlere izin ver.", true);
    const reg = await navigator.serviceWorker.ready;
    const { publicKey } = await (await fetch("/api/config")).json();
    if (!publicKey) return say("Sunucuda VAPID anahtarı tanımlı değil.", true);
    const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(publicKey) });
    await post({ action: "subscribe", subscription: sub.toJSON() });
    setUI(true); say("Bildirimler açıldı.");
  } catch (e) { say(e.message, true); }
};

async function saveSettings() {
  if (+$("#end").value < +$("#start").value) $("#end").value = $("#start").value;
  try {
    await post({ action: "settings", settings: { start: $("#start").value, end: $("#end").value, every: $("#every").value } });
    say("Kaydedildi ✓");
  } catch (e) { say(e.message, true); }
}
["#start", "#end", "#every"].forEach((id) => $(id).addEventListener("change", saveSettings));

$("#test").onclick = async () => {
  try { await post({ action: "test" }); say("Test gönderildi."); } catch (e) { say(e.message, true); }
};

(function init() {
  const sweets = [
    "Bugün de güzel bir gün olacak, çünkü sen varsın.",
    "Günlerin hesabını ben tutarım, sen sadece gülümse.",
    "Papatya gibi ferah, papatya gibi güzel.",
    "Bugün kendine iyi bak, çok seviliyorsun.",
    "Gülümsemen günün en güzel hatırlatıcısı.",
    "Her gün biraz daha güzel, her gün biraz daha sen.",
    "Bir papatya, bir gülümseme, güzel bir gün."
  ];
  const h = new Date().getHours();
  $("#hello").textContent = h < 5 ? "İyi geceler 🌙" : h < 12 ? "Günaydın ☀️" : h < 18 ? "İyi günler 🌤️" : "İyi akşamlar 🌙";
  $("#sweet").textContent = sweets[Math.floor(Date.now() / 864e5) % sweets.length];
  fillSelects(); renderDay(); setInterval(renderDay, 60000);
  $("#install").classList.toggle("hidden", standalone);
  $("#notif").classList.toggle("hidden", !standalone || !hasNotif);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { renderDay(); load(); } });
  load();
})();
