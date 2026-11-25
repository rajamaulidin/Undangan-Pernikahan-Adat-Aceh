import { NextRequest, NextResponse } from "next/server";
import { evaluateProfanity } from "@/lib/profanity-filter";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  extractClientIp,
  generateEditToken,
  hashClientIp,
  hashEditToken,
  sanitizePlainText,
  verifyEditToken,
} from "@/lib/security";
import { createWishSchema } from "@/lib/wish-schema";
import {
  createWishRecord,
  findWishById,
  getActiveBannedWords,
  toSenderSafeWishView,
} from "@/lib/wishes-store";

// Public GET never exposes a list of all guests' wishes; only the sender with a valid editToken can inspect their own wish.
export async function GET(request: NextRequest) {
  const wishId = request.nextUrl.searchParams.get("wishId");
  const editToken =
    request.headers.get("x-edit-token") ??
    request.nextUrl.searchParams.get("editToken") ??
    "";

  if (!wishId || !editToken) {
    return NextResponse.json(
      {
        privateMode: true,
        wishes: [],
        message:
          "Doa dan video ucapan tamu bersifat privat dan hanya dapat dilihat oleh kedua mempelai melalui Dashboard Admin.",
      },
      { status: 200 }
    );
  }

  const record = await findWishById(wishId);
  if (!record || !verifyEditToken(editToken, record.editTokenHash)) {
    return NextResponse.json(
      { error: "Ucapan tidak ditemukan atau token akses tidak cocok." },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      privateMode: true,
      wish: toSenderSafeWishView(record),
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const rawIp = extractClientIp(request.headers);
  const ipHash = hashClientIp(rawIp);
  const rate = checkRateLimit(`wishes:post:${ipHash}`, 10, 60_000);

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error:
          "Pengiriman ucapan terlalu cepat. Silakan tunggu sebentar sebelum mengirim kembali.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format payload JSON tidak valid." },
      { status: 400 }
    );
  }

  const parsed = createWishSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue =
      parsed.error.issues[0]?.message ?? "Data ucapan tidak valid.";
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
      ? evaluateProfanity(
          `${cleanName} ${cleanRelation} ${cleanText}`,
          activeRules
        )
      : evaluateProfanity(`${cleanName} ${cleanRelation}`, activeRules);

  const editToken = generateEditToken();
  const editTokenHash = hashEditToken(editToken);

  const created = await createWishRecord({
    senderName: cleanName,
    senderRelation: cleanRelation,
    type: parsed.data.type,
    textContent: cleanText,
    videoR2Key:
      parsed.data.type === "VIDEO" ? parsed.data.videoR2Key : undefined,
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
    editTokenHash,
    ipHash,
  });

  return NextResponse.json(
    {
      wish: toSenderSafeWishView(created),
      editToken,
    },
    { status: 201 }
  );
}
