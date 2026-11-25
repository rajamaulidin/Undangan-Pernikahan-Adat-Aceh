import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ALLOWED_VIDEO_MIMES,
  MAX_VIDEO_DURATION_SEC,
  MAX_VIDEO_SIZE_BYTES,
  createVideoPresignedUpload,
  getEffectiveMaxVideoBytes,
} from "@/lib/r2";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  extractClientIp,
  hashClientIp,
  sanitizePlainText,
} from "@/lib/security";

const presignSchema = z.object({
  fileName: z.string().min(1, "Nama berkas video wajib diisi.").max(180),
  contentType: z.enum(ALLOWED_VIDEO_MIMES, {
    message:
      "Format video tidak didukung. Gunakan berkas MP4, WebM, atau MOV.",
  }),
  sizeBytes: z
    .number()
    .int()
    .positive("Ukuran berkas video tidak valid.")
    .max(
      MAX_VIDEO_SIZE_BYTES,
      "Ukuran berkas video melebihi batas maksimal 80 MB."
    ),
  durationSec: z
    .number()
    .positive("Durasi video tidak valid.")
    .max(
      MAX_VIDEO_DURATION_SEC,
      "Durasi video melebihi batas maksimal 60 detik (1 menit)."
    ),
});

export async function POST(request: NextRequest) {
  const rawIp = extractClientIp(request.headers);
  const ipHash = hashClientIp(rawIp);
  const rate = checkRateLimit(`presign:${ipHash}`, 10, 60_000);

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error:
          "Permintaan unggah video terlalu sering. Silakan tunggu beberapa detik sebelum mencoba lagi.",
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
      { error: "Payload JSON tidak valid." },
      { status: 400 }
    );
  }

  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue =
      parsed.error.issues[0]?.message ?? "Parameter berkas video tidak valid.";
    return NextResponse.json({ error: firstIssue }, { status: 400 });
  }

  const maxAllowedBytes = getEffectiveMaxVideoBytes();
  if (parsed.data.sizeBytes > maxAllowedBytes) {
    const maxMb = Math.round(maxAllowedBytes / (1024 * 1024));
    return NextResponse.json(
      {
        error: `Ukuran berkas video melebihi batas maksimal ${maxMb} MB pada penyimpanan aktif saat ini.`,
      },
      { status: 400 }
    );
  }

  try {
    const cleanFileName = sanitizePlainText(parsed.data.fileName);
    const result = await createVideoPresignedUpload({
      fileName: cleanFileName || "video-ucapan.webm",
      contentType: parsed.data.contentType,
      sizeBytes: parsed.data.sizeBytes,
      durationSec: Math.round(parsed.data.durationSec),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Gagal menyiapkan penyimpanan unggah video.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const simulatedKey = request.nextUrl.searchParams.get("simulatedKey");
  if (!simulatedKey) {
    return NextResponse.json(
      { error: "Parameter simulatedKey tidak ditemukan." },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      uploaded: true,
      objectKey: simulatedKey,
    },
    { status: 200 }
  );
}
