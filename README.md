# Gün Hatırlatıcı (iPhone PWA + arka plan push)

Uygulama kapalıyken bile bildirim gelir: bildirimleri Netlify'daki **zamanlanmış fonksiyon** (her dakika) gönderir.

## Kurulum
1. VAPID anahtarı üret: `node generate-keys.mjs`
2. Projeyi GitHub'a yükle, Netlify'da "Import from Git" ile bağla (veya `npx netlify deploy --prod`).
   Not: Sürükle-bırak deploy fonksiyonları/npm paketlerini derlemez; Git ya da CLI kullan.
3. Netlify → Site settings → Environment variables:
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (1. adımdan)
   - `VAPID_SUBJECT` = `mailto:senin@epostan.com`
4. Değişkenlerden sonra yeniden deploy et (zamanlanmış fonksiyonlar sadece production deploy'da çalışır).

## iPhone'da
iOS 16.4+ gerekir. Safari'de siteyi aç → Paylaş → **Ana Ekrana Ekle** → simgeden aç → **Bildirimleri aç** → **Test bildirimi gönder**.
