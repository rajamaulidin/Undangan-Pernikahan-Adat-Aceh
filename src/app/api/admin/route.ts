import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deleteR2ObjectIfExists, SUPABASE_MEDIA_BUCKET } from "@/lib/r2";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  extractClientIp,
  hashClientIp,
  sanitizePlainText,
} from "@/lib/security";
import { getSupabaseAdminClient } from "@/lib/supabase";

async function verifyAdminToken(request: NextRequest): Promise<{
  authorized: boolean;
  email?: string;
  error?: string;
  status?: number;
}> {
  const ipHash = hashClientIp(extractClientIp(request.headers));
  const rate = checkRateLimit(`admin:${ipHash}`, 60, 60_000);
  if (!rate.allowed) {
    return {
      authorized: false,
      error: "Terlalu banyak permintaan ke endpoint admin. Silakan tunggu sebentar.",
      status: 429,
    };
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    return {
      authorized: false,
      error: "Sesi login admin tidak ditemukan. Silakan masuk terlebih dahulu.",
      status: 401,
    };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      authorized: false,
      error: "Konfigurasi server Supabase belum lengkap.",
      status: 500,
    };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return {
      authorized: false,
      error: "Sesi login tidak sah atau telah berakhir. Silakan login kembali.",
      status: 401,
    };
  }

  if (data.user.is_anonymous) {
    return {
      authorized: false,
      error: "Akun anonim tidak memiliki hak akses Dashboard Admin.",
      status: 403,
    };
  }

  return {
    authorized: true,
    email: data.user.email ?? "admin",
  };
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminToken(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status ?? 401 }
    );
  }

  const supabase = getSupabaseAdminClient()!;

  const [wishesRes, wordsRes, settingsRes, scheduleRes, galleryRes] =
    await Promise.all([
      supabase
        .from("wishes")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("banned_words")
        .select("*")
        .order("language", { ascending: true })
        .order("word", { ascending: true }),
      supabase
        .from("site_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("event_schedule")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("gallery_photos")
        .select("*")
        .order("sort_order", { ascending: true }),
    ]);

  if (wishesRes.error) {
    return NextResponse.json(
      { error: `Gagal memuat daftar ucapan: ${wishesRes.error.message}` },
      { status: 500 }
    );
  }

  const rawWishes = wishesRes.data ?? [];
  const wishesWithUrls = await Promise.all(
    rawWishes.map(async (row) => {
      let videoSignedUrl: string | null = null;
      if (row.type === "VIDEO" && row.video_r2_key) {
        const { data: signed } = await supabase.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .createSignedUrl(String(row.video_r2_key), 3600);
        if (signed?.signedUrl) {
          videoSignedUrl = signed.signedUrl;
        }
      }
      return {
        id: String(row.id),
        senderName: String(row.sender_name),
        senderRelation: String(row.sender_relation ?? ""),
        type: row.type as "TEXT" | "VIDEO",
        textContent: row.text_content ? String(row.text_content) : undefined,
        videoR2Key: row.video_r2_key ? String(row.video_r2_key) : undefined,
        videoFileName: row.video_file_name
          ? String(row.video_file_name)
          : undefined,
        videoDurationSec:
          typeof row.video_duration_sec === "number"
            ? row.video_duration_sec
            : undefined,
        videoSizeBytes:
          typeof row.video_size_bytes === "number"
            ? row.video_size_bytes
            : undefined,
        videoSignedUrl,
        status: row.status as "PUBLISHED" | "PENDING_MODERATION" | "HIDDEN",
        flaggedWords: Array.isArray(row.flagged_words)
          ? (row.flagged_words as string[])
          : [],
        createdAtIso: String(row.created_at),
        updatedAtIso: String(row.updated_at),
      };
    })
  );

  return NextResponse.json({
    adminEmail: auth.email,
    wishes: wishesWithUrls,
    bannedWords: wordsRes.data ?? [],
    settings: settingsRes.data ?? null,
    schedule: scheduleRes.data ?? null,
    galleryPhotos: galleryRes.data ?? [],
  });
}

const adminActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update_wish_status"),
    wishId: z.string().uuid("ID ucapan tidak valid."),
    status: z.enum(["PUBLISHED", "PENDING_MODERATION", "HIDDEN"]),
  }),
  z.object({
    action: z.literal("delete_wish"),
    wishId: z.string().uuid("ID ucapan tidak valid."),
  }),
  z.object({
    action: z.literal("add_banned_word"),
    word: z.string().min(2, "Kata minimal 2 karakter.").max(60),
    language: z.enum(["id", "aceh"]),
    matchType: z.enum(["exact", "contains"]),
  }),
  z.object({
    action: z.literal("toggle_banned_word"),
    id: z.string().uuid(),
    isActive: z.boolean(),
  }),
  z.object({
    action: z.literal("delete_banned_word"),
    id: z.string().uuid(),
  }),
  z.object({
    action: z.literal("save_settings"),
    themePreset: z.enum(["klasik_megah", "modern_elegan"]),
    holyVerse: z.string().min(5).max(800),
    postEventMessage: z.string().min(5).max(800),
    enableDigitalGift: z.boolean(),
    scheduleTitle: z.string().min(3).max(120),
    startTimeWib: z.string().min(3).max(40),
    endTimeWib: z.string().min(3).max(40),
    venueName: z.string().min(3).max(160),
    address: z.string().min(5).max(300),
    googleMapsUrl: z.string().url("URL Google Maps harus berupa tautan valid."),
  }),
  z.object({
    action: z.literal("add_gallery_photo"),
    storageKey: z
      .string()
      .min(1)
      .max(400)
      .regex(
        /^(\/|https:\/\/)/,
        "Path gambar harus diawali '/' atau 'https://'."
      ),
    caption: z.string().min(2, "Keterangan foto wajib diisi.").max(140),
    width: z.number().int().positive().default(960),
    height: z.number().int().positive().default(640),
  }),
  z.object({
    action: z.literal("delete_gallery_photo"),
    id: z.string().uuid(),
  }),
]);

export async function POST(request: NextRequest) {
  const auth = await verifyAdminToken(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status ?? 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format JSON permintaan tidak valid." },
      { status: 400 }
    );
  }

  const parsed = adminActionSchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      parsed.error.issues[0]?.message ?? "Parameter aksi admin tidak valid.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient()!;
  const payload = parsed.data;

  if (payload.action === "update_wish_status") {
    const { error } = await supabase
      .from("wishes")
      .update({
        status: payload.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.wishId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (payload.action === "delete_wish") {
    const { data: existing } = await supabase
      .from("wishes")
      .select("video_r2_key")
      .eq("id", payload.wishId)
      .maybeSingle();

    if (existing?.video_r2_key) {
      await deleteR2ObjectIfExists(String(existing.video_r2_key));
    }

    const { error } = await supabase
      .from("wishes")
      .delete()
      .eq("id", payload.wishId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (payload.action === "add_banned_word") {
    const cleanWord = sanitizePlainText(payload.word).toLowerCase();
    if (!cleanWord) {
      return NextResponse.json(
        { error: "Kata terlarang tidak boleh kosong." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("banned_words")
      .upsert(
        {
          word: cleanWord,
          language: payload.language,
          match_type: payload.matchType,
          is_active: true,
        },
        { onConflict: "word" }
      )
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, word: data });
  }

  if (payload.action === "toggle_banned_word") {
    const { error } = await supabase
      .from("banned_words")
      .update({ is_active: payload.isActive })
      .eq("id", payload.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (payload.action === "delete_banned_word") {
    const { error } = await supabase
      .from("banned_words")
      .delete()
      .eq("id", payload.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (payload.action === "save_settings") {
    const nowIso = new Date().toISOString();
    const [sErr, eErr] = await Promise.all([
      supabase.from("site_settings").upsert({
        id: "00000000-0000-0000-0000-000000000001",
        theme_preset: payload.themePreset,
        event_title: "Intat Linto Baro",
        holy_verse: sanitizePlainText(payload.holyVerse),
        post_event_message: sanitizePlainText(payload.postEventMessage),
        enable_digital_gift: payload.enableDigitalGift,
        updated_at: nowIso,
      }),
      supabase.from("event_schedule").upsert({
        id: "00000000-0000-0000-0000-000000000002",
        title: sanitizePlainText(payload.scheduleTitle),
        event_date: "2026-08-15T10:00:00+07:00",
        start_time_wib: sanitizePlainText(payload.startTimeWib),
        end_time_wib: sanitizePlainText(payload.endTimeWib),
        venue_name: sanitizePlainText(payload.venueName),
        address: sanitizePlainText(payload.address),
        google_maps_url: payload.googleMapsUrl.trim(),
        maps_embed_url:
          "https://www.openstreetmap.org/export/embed.html?bbox=95.3483%2C5.5656%2C95.3683%2C5.5816&layer=mapnik&marker=5.5736%2C95.3583",
        updated_at: nowIso,
      }),
    ]);

    if (sErr.error || eErr.error) {
      return NextResponse.json(
        {
          error:
            sErr.error?.message ??
            eErr.error?.message ??
            "Gagal menyimpan pengaturan.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (payload.action === "add_gallery_photo") {
    const { data: existing } = await supabase
      .from("gallery_photos")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder =
      existing && existing[0] ? Number(existing[0].sort_order) + 1 : 1;

    const { data, error } = await supabase
      .from("gallery_photos")
      .insert({
        storage_key: payload.storageKey.trim(),
        caption: sanitizePlainText(payload.caption),
        width: payload.width,
        height: payload.height,
        sort_order: nextOrder,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, photo: data });
  }

  if (payload.action === "delete_gallery_photo") {
    const { error } = await supabase
      .from("gallery_photos")
      .delete()
      .eq("id", payload.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
}
