import crypto from "crypto";

const IP_HASH_SALT =
  process.env.IP_HASH_SALT ?? "undangan-adat-aceh-intat-linto-salt-v1";

export function sanitizePlainText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateEditToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function hashEditToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function verifyEditToken(token: string, expectedHash: string): boolean {
  if (!token || !expectedHash) return false;
  const candidateHash = hashEditToken(token);
  const a = Buffer.from(candidateHash, "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}

export function hashClientIp(rawIp: string): string {
  const normalized = (rawIp || "127.0.0.1").trim().toLowerCase();
  return crypto
    .createHash("sha256")
    .update(`${IP_HASH_SALT}:${normalized}`, "utf8")
    .digest("hex");
}

export function extractClientIp(headers: Headers): string {
  const trustedHeader =
    headers.get("x-vercel-forwarded-for") ??
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip");
  if (trustedHeader) {
    const first = trustedHeader.split(",")[0]?.trim();
    if (first) return first;
  }
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    const rightmost = parts[parts.length - 1];
    if (rightmost) return rightmost;
  }
  return "127.0.0.1";
}
