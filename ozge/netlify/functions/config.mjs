export default async () =>
  new Response(JSON.stringify({ publicKey: process.env.VAPID_PUBLIC_KEY || "" }), {
    headers: { "content-type": "application/json" },
  });
export const config = { path: "/api/config" };
