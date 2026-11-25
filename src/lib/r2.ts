import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { getSupabaseAdminClient } from "./supabase";

export const ALLOWED_VIDEO_MIMES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

// shortcut: Supabase Free tier caps single file uploads at 50 MB, upgrade to Supabase Pro or configure Cloudflare R2 for 80 MB files
export const SUPABASE_FREE_MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEO_SIZE_BYTES = 80 * 1024 * 1024;
export const MAX_VIDEO_DURATION_SEC = 60;
export const PRESIGN_EXPIRES_SECONDS = 300;
export const SUPABASE_MEDIA_BUCKET = "wishes-media";

export interface PresignRequestInput {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  durationSec: number;
}

export interface PresignResponseOutput {
  uploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
  mode: "cloudflare_r2" | "supabase_storage" | "local_simulation";
}

export function hasCloudflareR2Config(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET_NAME?.trim()
  );
}

export function getEffectiveMaxVideoBytes(): number {
  return hasCloudflareR2Config()
    ? MAX_VIDEO_SIZE_BYTES
    : SUPABASE_FREE_MAX_VIDEO_BYTES;
}

function getExtensionForMime(contentType: string): string {
  if (contentType === "video/mp4") return "mp4";
  if (contentType === "video/quicktime") return "mov";
  return "webm";
}

export function buildVideoObjectKey(contentType: string): string {
  const ext = getExtensionForMime(contentType);
  const datePrefix = new Date().toISOString().slice(0, 10);
  const randomId = crypto.randomBytes(12).toString("hex");
  return `wishes/videos/${datePrefix}/${randomId}.${ext}`;
}

function createR2Client(): { client: S3Client; bucket: string } | null {
  if (!hasCloudflareR2Config()) return null;

  const accountId = process.env.R2_ACCOUNT_ID!.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!.trim();
  const bucket = process.env.R2_BUCKET_NAME!.trim();

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { client, bucket };
}

export async function createVideoPresignedUpload(
  input: PresignRequestInput
): Promise<PresignResponseOutput> {
  const maxBytes = getEffectiveMaxVideoBytes();
  if (input.sizeBytes > maxBytes) {
    throw new Error(
      `Ukuran berkas video melebihi batas maksimal ${Math.round(maxBytes / (1024 * 1024))} MB.`
    );
  }

  const objectKey = buildVideoObjectKey(input.contentType);
  const r2 = createR2Client();

  if (r2) {
    const command = new PutObjectCommand({
      Bucket: r2.bucket,
      Key: objectKey,
      ContentType: input.contentType,
      ContentLength: input.sizeBytes,
    });

    const uploadUrl = await getSignedUrl(r2.client, command, {
      expiresIn: PRESIGN_EXPIRES_SECONDS,
    });

    return {
      uploadUrl,
      objectKey,
      expiresInSeconds: PRESIGN_EXPIRES_SECONDS,
      mode: "cloudflare_r2",
    };
  }

  const supabase = getSupabaseAdminClient();
  if (supabase && process.env.VITEST !== "true") {
    const { data, error } = await supabase.storage
      .from(SUPABASE_MEDIA_BUCKET)
      .createSignedUploadUrl(objectKey);

    if (error || !data?.signedUrl) {
      throw new Error(
        error?.message ?? "Gagal menerbitkan Signed Upload URL dari Supabase Storage."
      );
    }

    return {
      uploadUrl: data.signedUrl,
      objectKey,
      expiresInSeconds: 7200,
      mode: "supabase_storage",
    };
  }

  return {
    uploadUrl: `/api/uploads/presign?simulatedKey=${encodeURIComponent(objectKey)}`,
    objectKey,
    expiresInSeconds: PRESIGN_EXPIRES_SECONDS,
    mode: "local_simulation",
  };
}

export async function deleteR2ObjectIfExists(
  objectKey?: string | null
): Promise<boolean> {
  if (!objectKey) return false;
  const r2 = createR2Client();
  if (r2) {
    try {
      await r2.client.send(
        new DeleteObjectCommand({
          Bucket: r2.bucket,
          Key: objectKey,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  const supabase = getSupabaseAdminClient();
  if (supabase && process.env.VITEST !== "true") {
    try {
      const { error } = await supabase.storage
        .from(SUPABASE_MEDIA_BUCKET)
        .remove([objectKey]);
      return !error;
    } catch {
      return false;
    }
  }

  return true;
}
