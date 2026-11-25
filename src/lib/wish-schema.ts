import { z } from "zod";
import {
  MAX_VIDEO_DURATION_SEC,
  MAX_VIDEO_SIZE_BYTES,
} from "@/lib/r2";
import { sanitizePlainText } from "@/lib/security";

export const createWishSchema = z
  .object({
    senderName: z
      .string()
      .min(1, "Nama lengkap wajib diisi.")
      .max(80, "Nama lengkap maksimal 80 karakter."),
    senderRelation: z
      .string()
      .max(80, "Keterangan hubungan maksimal 80 karakter.")
      .optional()
      .default(""),
    type: z.enum(["TEXT", "VIDEO"], {
      message: "Tipe ucapan harus TEXT atau VIDEO.",
    }),
    textContent: z
      .string()
      .max(200, "Ucapan teks maksimal 200 karakter.")
      .optional(),
    videoR2Key: z.string().max(260).optional(),
    videoFileName: z.string().max(180).optional(),
    videoDurationSec: z
      .number()
      .positive("Durasi video harus lebih dari 0 detik.")
      .max(MAX_VIDEO_DURATION_SEC, "Durasi video maksimal 60 detik.")
      .optional(),
    videoSizeBytes: z
      .number()
      .int()
      .positive("Ukuran video tidak valid.")
      .max(MAX_VIDEO_SIZE_BYTES, "Ukuran video maksimal 80 MB.")
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "TEXT") {
      const cleaned = sanitizePlainText(val.textContent ?? "");
      if (!cleaned) {
        ctx.addIssue({
          code: "custom",
          path: ["textContent"],
          message: "Isi doa dan ucapan teks wajib diisi.",
        });
      } else if (cleaned.length > 200) {
        ctx.addIssue({
          code: "custom",
          path: ["textContent"],
          message: "Isi doa dan ucapan teks maksimal 200 karakter.",
        });
      }
    } else if (val.type === "VIDEO") {
      if (!val.videoR2Key) {
        ctx.addIssue({
          code: "custom",
          path: ["videoR2Key"],
          message: "Kunci berkas video (videoR2Key) wajib disertakan.",
        });
      }
      if (!val.videoDurationSec) {
        ctx.addIssue({
          code: "custom",
          path: ["videoDurationSec"],
          message: "Durasi video wajib disertakan.",
        });
      }
      if (!val.videoSizeBytes) {
        ctx.addIssue({
          code: "custom",
          path: ["videoSizeBytes"],
          message: "Ukuran berkas video wajib disertakan.",
        });
      }
    }
  });
