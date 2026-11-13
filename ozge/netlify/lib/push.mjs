import webpush from "web-push";

export async function send(subscription, payload) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  return webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 3600, urgency: "high" });
}
