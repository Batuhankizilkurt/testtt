const lines = {
  Pazartesi: "Yeni haftaya güzel bir başlangıç yap 🌼",
  Salı: "Haftanın temposunu yakaladın 🌸",
  Çarşamba: "Haftanın ortasındayız, az kaldı ✨",
  Perşembe: "Hafta sonuna bir gün kaldı 🌼",
  Cuma: "Hafta sonuna çok az kaldı 🎉",
  Cumartesi: "Bugün keyfine bak 🌸",
  Pazar: "Dinlenmeli, huzurlu bir gün ☀️",
};

export function dayInfo(tz, date = new Date()) {
  try { new Intl.DateTimeFormat("tr-TR", { timeZone: tz }); } catch { tz = "Europe/Istanbul"; }
  let day = new Intl.DateTimeFormat("tr-TR", { weekday: "long", timeZone: tz }).format(date);
  day = day.charAt(0).toLocaleUpperCase("tr") + day.slice(1);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: tz }).format(date));
  return { day, hour, line: lines[day] || "" };
}

export const defaults = { start: 9, end: 21, every: 1, tz: "Europe/Istanbul" };
