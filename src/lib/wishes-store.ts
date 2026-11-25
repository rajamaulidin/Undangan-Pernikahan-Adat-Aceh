import fs from "fs";
import path from "path";
import crypto from "crypto";
import { BannedWordEntry, defaultBannedWords } from "./profanity-filter";
import { getSupabaseAdminClient } from "./supabase";

export type WishType = "TEXT" | "VIDEO";
export type WishStatus = "PUBLISHED" | "PENDING_MODERATION" | "HIDDEN";

export interface WishRecord {
  id: string;
  senderName: string;
  senderRelation: string;
  type: WishType;
  textContent?: string;
  videoR2Key?: string;
  videoFileName?: string;
  videoDurationSec?: number;
  videoSizeBytes?: number;
  status: WishStatus;
  flaggedWords: string[];
  editTokenHash: string;
  ipHash: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface PublicSafeWishView {
  id: string;
  senderName: string;
  senderRelation: string;
  type: WishType;
  textContent?: string;
  videoR2Key?: string;
  videoFileName?: string;
  videoDurationSec?: number;
  videoSizeBytes?: number;
  status: "PUBLISHED" | "PENDING_MODERATION";
  createdAtIso: string;
  updatedAtIso: string;
}

interface SupabaseWishRow {
  id: string;
  sender_name: string;
  sender_relation: string;
  type: WishType;
  text_content: string | null;
  video_r2_key: string | null;
  video_file_name: string | null;
  video_duration_sec: number | null;
  video_size_bytes: number | null;
  status: WishStatus;
  flagged_words: string[] | null;
  edit_token_hash: string;
  ip_hash: string;
  created_at: string;
  updated_at: string;
}

interface LocalStoreSchema {
  wishes: WishRecord[];
  bannedWords: BannedWordEntry[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "wishes-db.json");

function mapRowToWishRecord(row: SupabaseWishRow): WishRecord {
  return {
    id: row.id,
    senderName: row.sender_name,
    senderRelation: row.sender_relation ?? "",
    type: row.type,
    textContent: row.text_content ?? undefined,
    videoR2Key: row.video_r2_key ?? undefined,
    videoFileName: row.video_file_name ?? undefined,
    videoDurationSec: row.video_duration_sec ?? undefined,
    videoSizeBytes: row.video_size_bytes ?? undefined,
    status: row.status,
    flaggedWords: Array.isArray(row.flagged_words) ? row.flagged_words : [],
    editTokenHash: row.edit_token_hash,
    ipHash: row.ip_hash,
    createdAtIso: row.created_at,
    updatedAtIso: row.updated_at,
  };
}

function loadStore(): LocalStoreSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(raw) as LocalStoreSchema;
      if (Array.isArray(parsed.wishes)) {
        return {
          wishes: parsed.wishes,
          bannedWords:
            Array.isArray(parsed.bannedWords) && parsed.bannedWords.length > 0
              ? parsed.bannedWords
              : defaultBannedWords,
        };
      }
    }
  } catch {
    // Fallback to default in-memory state if local JSON file is unreadable.
  }

  return {
    wishes: [],
    bannedWords: [...defaultBannedWords],
  };
}

function saveStore(data: LocalStoreSchema): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // Ignore write failure in read-only test environments.
  }
}

export function toSenderSafeWishView(record: WishRecord): PublicSafeWishView {
  return {
    id: record.id,
    senderName: record.senderName,
    senderRelation: record.senderRelation,
    type: record.type,
    textContent: record.textContent,
    videoR2Key: record.videoR2Key,
    videoFileName: record.videoFileName,
    videoDurationSec: record.videoDurationSec,
    videoSizeBytes: record.videoSizeBytes,
    status:
      record.status === "PENDING_MODERATION"
        ? "PENDING_MODERATION"
        : "PUBLISHED",
    createdAtIso: record.createdAtIso,
    updatedAtIso: record.updatedAtIso,
  };
}

export async function getActiveBannedWords(): Promise<BannedWordEntry[]> {
  const supabase = getSupabaseAdminClient();
  if (supabase && process.env.VITEST !== "true") {
    const { data, error } = await supabase
      .from("banned_words")
      .select("word, language, match_type, is_active")
      .eq("is_active", true);

    if (error) {
      throw new Error(`Gagal memuat daftar kata filter: ${error.message}`);
    }
    if (Array.isArray(data) && data.length > 0) {
      return data.map((row) => ({
        word: String(row.word),
        language: row.language === "aceh" ? "aceh" : "id",
        matchType: row.match_type === "contains" ? "contains" : "exact",
        isActive: Boolean(row.is_active),
      }));
    }
  }

  const store = loadStore();
  return store.bannedWords.filter((w) => w.isActive !== false);
}

export async function findWishById(id: string): Promise<WishRecord | null> {
  const supabase = getSupabaseAdminClient();
  if (supabase && process.env.VITEST !== "true") {
    const { data, error } = await supabase
      .from("wishes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Gagal membaca data ucapan: ${error.message}`);
    }
    return data ? mapRowToWishRecord(data as SupabaseWishRow) : null;
  }

  const store = loadStore();
  return store.wishes.find((w) => w.id === id) ?? null;
}

export async function createWishRecord(
  input: Omit<WishRecord, "id" | "createdAtIso" | "updatedAtIso">
): Promise<WishRecord> {
  const supabase = getSupabaseAdminClient();
  if (supabase && process.env.VITEST !== "true") {
    const { data, error } = await supabase
      .from("wishes")
      .insert({
        sender_name: input.senderName,
        sender_relation: input.senderRelation,
        type: input.type,
        text_content: input.textContent ?? null,
        video_r2_key: input.videoR2Key ?? null,
        video_file_name: input.videoFileName ?? null,
        video_duration_sec: input.videoDurationSec ?? null,
        video_size_bytes: input.videoSizeBytes ?? null,
        status: input.status,
        flagged_words: input.flaggedWords,
        edit_token_hash: input.editTokenHash,
        ip_hash: input.ipHash,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(
        error?.message ?? "Gagal menyimpan ucapan ke database Supabase."
      );
    }
    return mapRowToWishRecord(data as SupabaseWishRow);
  }

  const store = loadStore();
  const nowIso = new Date().toISOString();
  const record: WishRecord = {
    ...input,
    id: crypto.randomUUID(),
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
  store.wishes.unshift(record);
  saveStore(store);
  return record;
}

export async function updateWishRecord(
  id: string,
  updates: Partial<
    Pick<
      WishRecord,
      | "senderName"
      | "senderRelation"
      | "type"
      | "textContent"
      | "videoR2Key"
      | "videoFileName"
      | "videoDurationSec"
      | "videoSizeBytes"
      | "status"
      | "flaggedWords"
    >
  >
): Promise<WishRecord | null> {
  const supabase = getSupabaseAdminClient();
  if (supabase && process.env.VITEST !== "true") {
    const { data, error } = await supabase
      .from("wishes")
      .update({
        sender_name: updates.senderName,
        sender_relation: updates.senderRelation,
        type: updates.type,
        text_content: updates.textContent ?? null,
        video_r2_key: updates.videoR2Key ?? null,
        video_file_name: updates.videoFileName ?? null,
        video_duration_sec: updates.videoDurationSec ?? null,
        video_size_bytes: updates.videoSizeBytes ?? null,
        status: updates.status,
        flagged_words: updates.flaggedWords,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(
        `Gagal memperbarui ucapan di database Supabase: ${error.message}`
      );
    }
    return data ? mapRowToWishRecord(data as SupabaseWishRow) : null;
  }

  const store = loadStore();
  const index = store.wishes.findIndex((w) => w.id === id);
  if (index === -1) return null;

  const current = store.wishes[index];
  const updated: WishRecord = {
    ...current,
    ...updates,
    updatedAtIso: new Date().toISOString(),
  };
  store.wishes[index] = updated;
  saveStore(store);
  return updated;
}

export function resetWishesStoreForTests(): void {
  saveStore({
    wishes: [],
    bannedWords: [...defaultBannedWords],
  });
}
