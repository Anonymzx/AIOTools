/**
 * BYOK (Bring Your Own Key) storage for OpenAI API keys.
 *
 * HONEST LIMITS — read before relying on this:
 * - The key is AES-GCM encrypted with a key derived via PBKDF2 (100k
 *   iterations, SHA-256) from a random per-device salt + a random device id
 *   stored separately in localStorage. This protects against casual
 *   shoulder-surfing / DevTools glances, NOT against anyone with real access
 *   to this browser profile (they can read both values and decrypt).
 * - The plaintext key lives in JS memory while a tool page is open and is
 *   sent directly from the browser to api.openai.com — treat it like any
 *   client-side secret: set spend limits + rotation on the OpenAI dashboard.
 * - No key material ever touches our servers (there are none for these tools).
 */

const BLOB_KEY = "aiotools-byok-key-v1";
const DEVICE_KEY = "aiotools-byok-device-v1";

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

interface KeyBlob {
  salt: string;
  iv: string;
  data: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return window.btoa(binary);
}

function b64ToBytes(b64: string): Uint8Array {
  const binary = window.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  window.crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Random device id, stored separately from the encrypted blob. */
export function getDeviceId(): string | null {
  try {
    if (!isBrowser()) return null;
    const existing = window.localStorage.getItem(DEVICE_KEY);
    if (existing && existing.length >= 16) return existing;
    const fresh = randomHex(16);
    window.localStorage.setItem(DEVICE_KEY, fresh);
    return fresh;
  } catch {
    return null;
  }
}

async function deriveAesKey(deviceId: string, salt: Uint8Array): Promise<CryptoKey | null> {
  try {
    const base = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(`aiotools-byok:${deviceId}`),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    return await window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
      base,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  } catch {
    return null;
  }
}

/** Encrypt + persist. Returns true on success, false on any failure. */
export async function saveAiKey(plain: string): Promise<boolean> {
  try {
    if (!isBrowser()) return false;
    const trimmed = plain.trim();
    if (trimmed.length === 0) return false;
    const deviceId = getDeviceId();
    if (!deviceId) return false;
    const salt = new Uint8Array(SALT_BYTES);
    const iv = new Uint8Array(IV_BYTES);
    window.crypto.getRandomValues(salt);
    window.crypto.getRandomValues(iv);
    const aes = await deriveAesKey(deviceId, salt);
    if (!aes) return false;
    const cipher = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      aes,
      new TextEncoder().encode(trimmed),
    );
    const blob: KeyBlob = {
      salt: bufToB64(salt),
      iv: bufToB64(iv),
      data: bufToB64(cipher),
    };
    window.localStorage.setItem(BLOB_KEY, JSON.stringify(blob));
    return true;
  } catch {
    return false;
  }
}

/** Decrypt + return the key, or null when missing/unreadable. */
export async function loadAiKey(): Promise<string | null> {
  try {
    if (!isBrowser()) return null;
    const deviceId = window.localStorage.getItem(DEVICE_KEY);
    const raw = window.localStorage.getItem(BLOB_KEY);
    if (!deviceId || !raw) return null;
    const blob = JSON.parse(raw) as Partial<KeyBlob>;
    if (!blob.salt || !blob.iv || !blob.data) return null;
    const aes = await deriveAesKey(deviceId, b64ToBytes(blob.salt));
    if (!aes) return null;
    const plain = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(blob.iv) as BufferSource },
      aes,
      b64ToBytes(blob.data) as BufferSource,
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

/** Remove the encrypted blob (device id is kept — harmless random value). */
export function clearAiKey(): void {
  try {
    if (!isBrowser()) return;
    window.localStorage.removeItem(BLOB_KEY);
  } catch {
    // Clear must never throw; key simply stays until cleared manually.
  }
}

/** True when an encrypted blob exists (no decryption attempted). */
export function hasAiKey(): boolean {
  try {
    if (!isBrowser()) return false;
    return window.localStorage.getItem(BLOB_KEY) !== null;
  } catch {
    return false;
  }
}

/** Mask for display, e.g. "sk-••••abcd". Never reveals more than 4 chars. */
export function maskKey(key: string): string {
  try {
    const t = key.trim();
    if (t.length <= 8) return "••••";
    const prefix = t.startsWith("sk-") ? "sk-" : "";
    return `${prefix}••••${t.slice(-4)}`;
  } catch {
    return "••••";
  }
}
