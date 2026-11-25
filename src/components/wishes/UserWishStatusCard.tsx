"use client";

import React from "react";

export interface StoredGuestWish {
  wishId: string;
  editToken: string;
  senderName: string;
  senderRelation: string;
  type: "TEXT" | "VIDEO";
  textContent?: string;
  videoR2Key?: string;
  videoFileName?: string;
  videoDurationSec?: number;
  videoSizeBytes?: number;
  videoObjectUrl?: string;
  status: "PUBLISHED" | "PENDING_MODERATION";
  updatedAtIso: string;
}

interface UserWishStatusCardProps {
  wish: StoredGuestWish;
  onEdit: () => void;
  onVideoPlay: () => void;
  onVideoPause: () => void;
}

function formatBytes(bytes = 0): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UserWishStatusCard({
  wish,
  onEdit,
  onVideoPlay,
  onVideoPause,
}: UserWishStatusCardProps) {
  return (
    <div
      role="region"
      aria-labelledby="status-ucapan-heading"
      className="rounded-[14px] bg-card border-2 border-line-gold p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-line-subtle">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full bg-gold shrink-0"
            aria-hidden="true"
          />
          <h3
            id="status-ucapan-heading"
            className="font-serif text-xl sm:text-2xl font-bold text-ink-primary"
          >
            Ucapan Anda Telah Diterima
          </h3>
        </div>
        <span className="px-3 py-1 rounded-md bg-surface border border-line-gold text-xs font-semibold text-gold">
          {wish.status === "PUBLISHED"
            ? "Tersimpan Privat untuk Mempelai"
            : "Diterima & Sedang Ditinjau"}
        </span>
      </div>

      <p className="text-xs sm:text-sm text-ink-secondary mb-4 leading-relaxed">
        {wish.status === "PUBLISHED"
          ? "Terima kasih atas doa restu Anda. Ucapan ini bersifat privat dan hanya dapat dibuka oleh kedua mempelai melalui panel khusus."
          : "Terima kasih. Ucapan Anda telah kami terima dan sedang dalam peninjauan sebelum diteruskan ke ruang baca mempelai."}
      </p>

      <div className="rounded-xl bg-surface border border-line-subtle p-4 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <p className="text-sm font-bold text-ink-primary">
              {wish.senderName}
            </p>
            {wish.senderRelation && (
              <p className="text-xs text-ink-muted">{wish.senderRelation}</p>
            )}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gold px-2.5 py-0.5 rounded bg-card border border-line-subtle">
            {wish.type === "TEXT" ? "Doa Teks" : "Video Ucapan"}
          </span>
        </div>

        {wish.type === "TEXT" ? (
          <blockquote className="mt-2 font-serif italic text-base sm:text-lg text-ink-primary leading-relaxed">
            &ldquo;{wish.textContent}&rdquo;
          </blockquote>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-secondary">
              <span>Berkas: {wish.videoFileName ?? "video-ucapan.webm"}</span>
              <span>
                Durasi: {wish.videoDurationSec ?? 12} dtk &bull; Ukuran:{" "}
                {formatBytes(wish.videoSizeBytes)}
              </span>
            </div>

            {wish.videoObjectUrl && (
              <div className="w-full rounded-lg overflow-hidden border border-line-subtle bg-page aspect-video">
                <video
                  src={wish.videoObjectUrl}
                  controls
                  preload="metadata"
                  width={640}
                  height={360}
                  onPlay={onVideoPlay}
                  onPause={onVideoPause}
                  onEnded={onVideoPause}
                  className="w-full h-full object-contain block"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs text-ink-muted">
          Kuota 1 ucapan per tamu (Anda tetap dapat memperbarui isi atau format
          ucapan).
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="min-h-[46px] px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover active:scale-[0.99] text-brand-on text-xs sm:text-sm font-semibold border border-line-gold inline-flex items-center justify-center gap-2 transition-all"
        >
          <svg
            className="w-4 h-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span>Ubah Ucapan Anda</span>
        </button>
      </div>
    </div>
  );
}
