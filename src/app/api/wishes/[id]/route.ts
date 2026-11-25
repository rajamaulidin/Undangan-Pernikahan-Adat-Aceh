import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { evaluateProfanity } from "@/lib/profanity-filter";
import { deleteR2ObjectIfExists } from "@/lib/r2";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  extractClientIp,
  hashClientIp,
  sanitizePlainText,
  verifyEditToken,
} from "@/lib/security";
import {
  findWishById,
  getActiveBannedWords,
  toSenderSafeWishView,
  updateWishRecord,
} from "@/lib/wishes-store";
import { createWishSchema } from "@/lib/wish-schema";

const patchWishSchema = z.object({
  editToken: z.string().min(16, "Token akses ubah ucapan tidak valid.").optional(),
  data: createWishSchema,
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const rawIp = extractClientIp(request.headers);
  const ipHash = hashClientIp(rawIp);
  const rate = checkRateLimit(`wishes:patch:${ipHash}`, 12, 60_000);

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error:
          "Permintaan ubah ucapan terlalu sering. Silakan tunggu sebentar.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Payload JSON tidak valid." },
      { status: 400 }
    );
  }

  const bodyObj = (rawBody ?? {}) as Record<string, unknown>;
  const headerToken = request.headers.get("x-edit-token") ?? "";
  const bodyToken =
    typeof bodyObj.editToken === "string" ? bodyObj.editToken : "";
  const editToken = headerToken || bodyToken;

  if (!editToken) {
    return NextResponse.json(
      { error: "Token otorisasi ubah ucapan (editToken) wajib disertakan." },
      { status: 401 }
    );
  }

  const existing = await findWishById(id);
  if (!existing) {
    return NextResponse.json(
      { error: "Data ucapan tidak ditemukan." },
      { status: 404 }
    );
  }

  if (!verifyEditToken(editToken, existing.editTokenHash)) {
    return NextResponse.json(
      { error: "Token ubah ucapan tidak sah. Akses pembaruan ditolak." },
      { status: 403 }
    );
  }

  const candidateData = bodyObj.data ?? bodyObj;
  const parsed = patchWishSchema.shape.data.safeParse(candidateData);
  if (!parsed.success) {
    const firstIssue =
      parsed.error.issues[0]?.message ?? "Data pembaruan ucapan tidak valid.";
    return NextResponse.json({ error: firstIssue }, { status: 400 });
  }

  const cleanName = sanitizePlainText(parsed.data.senderName);
  const cleanRelation = sanitizePlainText(parsed.data.senderRelation);
  if (!cleanName) {
    return NextResponse.json(
      { error: "Nama lengkap wajib diisi dengan huruf yang valid." },
      { status: 400 }
    );
  }

  const activeRules = await getActiveBannedWords();
  const cleanText =
    parsed.data.type === "TEXT"
      ? sanitizePlainText(parsed.data.textContent ?? "")
      : undefined;

  const profanityCheck =
    parsed.data.type === "TEXT" && cleanText
      ? evaluateProfanity(`${cleanName} ${cleanRelation} ${cleanText}`, activeRules)
      : evaluateProfanity(`${cleanName} ${cleanRelation}`, activeRules);

  const oldVideoKey = existing.videoR2Key;
  const newVideoKey =
    parsed.data.type === "VIDEO" ? parsed.data.videoR2Key : undefined;

  if (oldVideoKey && oldVideoKey !== newVideoKey) {
    await deleteR2ObjectIfExists(oldVideoKey);
  }

  const updated = await updateWishRecord(id, {
    senderName: cleanName,
    senderRelation: cleanRelation,
    type: parsed.data.type,
    textContent: cleanText,
    videoR2Key: newVideoKey,
    videoFileName:
      parsed.data.type === "VIDEO"
        ? sanitizePlainText(parsed.data.videoFileName ?? "video-ucapan.webm")
        : undefined,
    videoDurationSec:
      parsed.data.type === "VIDEO"
        ? Math.round(parsed.data.videoDurationSec ?? 1)
        : undefined,
    videoSizeBytes:
      parsed.data.type === "VIDEO" ? parsed.data.videoSizeBytes : undefined,
    status: profanityCheck.flagged ? "PENDING_MODERATION" : "PUBLISHED",
    flaggedWords: profanityCheck.matchedWords,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Gagal menyimpan pembaruan ucapan." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      wish: toSenderSafeWishView(updated),
    },
    { status: 200 }
  );
}
