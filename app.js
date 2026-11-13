const $ = (s) => document.querySelector(s);
const deviceId = localStorage.getItem("did") || (() => { const v = crypto.randomUUID(); localStorage.setItem("did", v); return v; })();
const standalone = navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
const repeatTr = { none: "", daily: "Her gün", weekly: "Her hafta", monthly: "Her ay", yearly: "Her yıl" };

async function post(body) {
  const r = await fetch("/api/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ deviceId, ...body }) });
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

function dayLabel(iso) {
  const d = new Date(iso), n = new Date();
  const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(n.getFullYear(), n.getMonth(), n.getDate())) / 864e5);
  if (diff < 0) return "Geçti";
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Yarın";
  return diff + " gün kaldı";
}

function render(list) {
  const box = $("#list"); box.textContent = "";
  if (!list.length) { box.innerHTML = '<p class="hint">Henüz özel gün yok, ilkini ekle 🌼</p>'; return; }
  [...list].sort((a, b) => new Date(a.at) - new Date(b.at)).forEach((r) => {
    const row = document.createElement("div"); row.className = "item" + (r.done ? " done" : "");
    const t = document.createElement("div"); t.className = "t";
    const b = document.createElement("b"); b.textContent = r.title;
    const s = document.createElement("small");
    s.textContent = new Date(r.at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }) + (repeatTr[r.repeat] ? " · " + repeatTr[r.repeat] : "") + (r.note ? " · " + r.note : "");
    t.append(b, s);
    const badge = document.createElement("span"); badge.className = "badge"; badge.textContent = r.done ? "Tamam ✓" : dayLabel(r.at);
    const del = document.createElement("button"); del.className = "sm"; del.textContent = "Sil";
    del.onclick = async () => { render((await post({ action: "delete", id: r.id })).reminders); };
    row.append(t, badge, del); box.append(row);
  });
}

async function load() {
  try {
    const r = await (await fetch("/api/sync?deviceId=" + deviceId)).json();
    render(r.reminders || []); setNotifUI(r.subscribed);
  } catch { $("#list").innerHTML = '<p class="hint">Sunucuya ulaşılamadı.</p>'; }
}

function setNotifUI(subscribed) {
  const ok = subscribed && Notification.permission === "granted";
  $("#notifState").textContent = ok ? "Açık ✓ (uygulama kapalıyken de gelir)" : "Kapalı";
  $("#enable").classList.toggle("hidden", ok);
  $("#test").classList.toggle("hidden", !ok);
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
    setNotifUI(true); say("Bildirimler açıldı.");
  } catch (e) { say(e.message, true); }
};

$("#test").onclick = async () => {
  try { await post({ action: "test" }); say("Test gönderildi."); } catch (e) { say(e.message, true); }
};

$("#add").onclick = async () => {
  const title = $("#title").value.trim(), at = $("#at").value;
  if (!title || !at) return alert("Başlık ve tarih gerekli.");
  try {
    const r = await post({ action: "add", reminder: { title, note: $("#note").value.trim(), at: new Date(at).toISOString(), repeat: $("#repeat").value } });
    $("#title").value = ""; $("#note").value = ""; render(r.reminders);
  } catch (e) { alert(e.message); }
};

(function init() {
  const sweets = [
    "Bugün de güzel bir gün olacak, çünkü sen varsın.",
    "Önemli günlerini ben hatırlarım, sen sadece gülümse.",
    "Papatya gibi ferah, papatya gibi güzel.",
    "Bugün kendine iyi bak, çok seviliyorsun.",
    "Gülümsemen günün en güzel hatırlatıcısı.",
    "Her gün biraz daha güzel, her gün biraz daha sen.",
    "Bir papatya, bir gülümseme, güzel bir gün."
  ];
  const h = new Date().getHours();
  $("#hello").textContent = h < 5 ? "İyi geceler 🌙" : h < 12 ? "Günaydın ☀️" : h < 18 ? "İyi günler 🌤️" : "İyi akşamlar 🌙";
  $("#sweet").textContent = sweets[Math.floor(Date.now() / 864e5) % sweets.length];
  const d = new Date(Date.now() + 864e5); d.setHours(9, 0, 0, 0);
  $("#at").value = new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  $("#install").classList.toggle("hidden", standalone);
  $("#notif").classList.toggle("hidden", !standalone || !("PushManager" in window));
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");
  document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
  load();
})();
