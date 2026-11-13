// Kullanım: node generate-keys.mjs  (bağımlılık gerekmez)
import { generateKeyPairSync } from "node:crypto";
const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const j = privateKey.export({ format: "jwk" });
const b = (s) => Buffer.from(s, "base64url");
const pub = Buffer.concat([Buffer.from([4]), b(j.x), b(j.y)]).toString("base64url");
console.log("VAPID_PUBLIC_KEY=" + pub);
console.log("VAPID_PRIVATE_KEY=" + j.d);
