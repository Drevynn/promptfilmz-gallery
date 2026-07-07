import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// VAPID helpers using Web Crypto API
const VAPID_PUBLIC_KEY = "BOQhOcUyqrM-yMQ47N0ih-kKa94WM_P_fjb5XfNz3C2QY5TrMz1xteLMooFBpysV9jUJp9HGn30pHSx2A8AWv7c";

function base64UrlToUint8Array(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createVapidJwt(audience: string): Promise<string> {
  const privateKeyB64 = Deno.env.get("VAPID_PRIVATE_KEY")!;
  const privateKeyBytes = base64UrlToUint8Array(privateKeyB64);

  // Build JWK for import
  const publicKeyBytes = base64UrlToUint8Array(VAPID_PUBLIC_KEY);
  // Extract x, y from uncompressed public key (65 bytes: 0x04 || x || y)
  const x = uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33));
  const y = uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65));
  const d = uint8ArrayToBase64Url(privateKeyBytes);

  const jwk = { kty: "EC", crv: "P-256", x, y, d, ext: true };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 86400, sub: "mailto:notifications@aifilmz.app" };

  const enc = new TextEncoder();
  const headerB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(payload)));
  const unsigned = `${headerB64}.${payloadB64}`;

  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(unsigned));

  // Convert DER signature to raw r||s
  const sigBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  if (sigBytes.length === 64) {
    r = sigBytes.slice(0, 32);
    s = sigBytes.slice(32);
  } else {
    // DER encoded
    let offset = 2;
    const rLen = sigBytes[offset + 1];
    r = sigBytes.slice(offset + 2, offset + 2 + rLen);
    offset = offset + 2 + rLen;
    const sLen = sigBytes[offset + 1];
    s = sigBytes.slice(offset + 2, offset + 2 + sLen);
    // Pad/trim to 32 bytes
    if (r.length > 32) r = r.slice(r.length - 32);
    if (s.length > 32) s = s.slice(s.length - 32);
    if (r.length < 32) { const tmp = new Uint8Array(32); tmp.set(r, 32 - r.length); r = tmp; }
    if (s.length < 32) { const tmp = new Uint8Array(32); tmp.set(s, 32 - s.length); s = tmp; }
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);

  return `${unsigned}.${uint8ArrayToBase64Url(rawSig)}`;
}

async function encryptPayload(
  p256dhB64: string,
  authB64: string,
  payloadText: string
): Promise<{ body: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const enc = new TextEncoder();

  // Generate local ECDH key pair
  const localKey = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const localPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKey.publicKey));

  // Import subscriber public key
  const subPubBytes = base64UrlToUint8Array(p256dhB64);
  const subscriberKey = await crypto.subtle.importKey("raw", subPubBytes, { name: "ECDH", namedCurve: "P-256" }, false, []);

  // Derive shared secret
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: subscriberKey }, localKey.privateKey, 256));

  const authSecret = base64UrlToUint8Array(authB64);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF for IKM
  const authInfo = enc.encode("Content-Encoding: auth\0");
  const prkKey = await crypto.subtle.importKey("raw", authSecret, { name: "HKDF" }, false, ["deriveBits"]);
  // Actually use HKDF properly
  const ikm = await crypto.subtle.importKey("raw", sharedSecret, { name: "HKDF" }, false, ["deriveBits"]);
  const ikmBits = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: authSecret, info: authInfo }, ikm, 256));

  // Derive CEK and nonce
  const context = new Uint8Array([
    ...enc.encode("P-256\0"),
    0, 65, ...subPubBytes,
    0, 65, ...localPublicKeyRaw,
  ]);

  const cekInfo = new Uint8Array([...enc.encode("Content-Encoding: aesgcm\0"), ...context]);
  const nonceInfo = new Uint8Array([...enc.encode("Content-Encoding: nonce\0"), ...context]);

  const prkForCek = await crypto.subtle.importKey("raw", ikmBits, { name: "HKDF" }, false, ["deriveBits"]);
  const cek = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: cekInfo }, prkForCek, 128));
  const prkForNonce = await crypto.subtle.importKey("raw", ikmBits, { name: "HKDF" }, false, ["deriveBits"]);
  const nonce = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: nonceInfo }, prkForNonce, 96));

  // Encrypt with AES-128-GCM
  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const paddedPayload = new Uint8Array([0, 0, ...enc.encode(payloadText)]);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPayload));

  return { body: encrypted, salt, localPublicKey: localPublicKeyRaw };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authentication: require either a valid user JWT (and userId must match auth.uid())
    // or a service-role key (for internal server-to-server calls).
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const isServiceRole = token === serviceRoleKey;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey
    );

    let callerUserId: string | null = null;
    if (!isServiceRole) {
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
      if (userErr || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      callerUserId = user.id;
    }

    const { userId, title, body, url, event_type } = await req.json();
    if (!userId || !title) throw new Error("userId and title are required");

    // Non-service callers can only notify themselves
    if (!isServiceRole && callerUserId !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    // Check notification preferences if event_type is specified
    if (event_type) {
      const { data: prefs } = await supabaseAdmin
        .from("notification_preferences")
        .select("render_complete, script_updates, contest_votes")
        .eq("user_id", userId)
        .maybeSingle();

      // Map event_type to preference column
      const prefMap: Record<string, string> = {
        render_complete: "render_complete",
        script_updates: "script_updates",
        contest_votes: "contest_votes",
      };

      const prefKey = prefMap[event_type];
      if (prefKey && prefs && !(prefs as any)[prefKey]) {
        return new Response(JSON.stringify({ sent: 0, message: "User has disabled this notification type" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: subs, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No subscriptions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({ title, body: body || "", url: url || "/" });
    let sent = 0;
    const errors: string[] = [];

    for (const sub of subs) {
      try {
        const endpoint = sub.endpoint;
        const aud = new URL(endpoint).origin;
        const jwt = await createVapidJwt(aud);

        const { body: encBody, salt, localPublicKey } = await encryptPayload(sub.p256dh, sub.auth, payload);

        const resp = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aesgcm",
            "Content-Length": String(encBody.byteLength),
            Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
            "Crypto-Key": `dh=${uint8ArrayToBase64Url(localPublicKey)};p256ecdsa=${VAPID_PUBLIC_KEY}`,
            Encryption: `salt=${uint8ArrayToBase64Url(salt)}`,
            TTL: "86400",
          },
          body: encBody,
        });

        if (resp.status === 201 || resp.status === 200) {
          sent++;
        } else if (resp.status === 404 || resp.status === 410) {
          // Subscription expired, clean up
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
          errors.push(`Removed expired subscription ${sub.id}`);
        } else {
          errors.push(`Push to ${sub.id} failed: ${resp.status} ${await resp.text()}`);
        }
      } catch (e) {
        errors.push(`Error sending to ${sub.id}: ${e.message}`);
      }
    }

    return new Response(JSON.stringify({ sent, total: subs.length, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
