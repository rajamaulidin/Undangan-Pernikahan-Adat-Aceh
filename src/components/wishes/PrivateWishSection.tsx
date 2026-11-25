"use client";

import React, { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "@/components/invitation/ScrollReveal";
import {
  StoredGuestWish,
  UserWishStatusCard,
} from "./UserWishStatusCard";
import {
  RecordedVideoResult,
  VideoRecorderModal,
} from "./VideoRecorderModal";

interface PrivateWishSectionProps {
  onPauseAudioForVideo: () => void;
  onResumeAudioAfterVideo: () => void;
}

const STORAGE_KEY = "undangan_aceh_private_wish_v1";
const MAX_TEXT_CHARS = 200;
const MAX_VIDEO_DURATION_SEC = 60;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

function resolveVideoMime(
  rawType?: string,
  fileName?: string
): "video/mp4" | "video/webm" | "video/quicktime" {
  if (rawType === "video/mp4" || rawType === "video/quicktime" || rawType === "video/webm") {
    return rawType;
  }
  const lower = (fileName ?? "").toLowerCase();
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".mov")) return "video/quicktime";
  return "video/webm";
}

export function PrivateWishSection({
  onPauseAudioForVideo,
  onResumeAudioAfterVideo,
}: PrivateWishSectionProps) {
  const [activeTab, setActiveTab] = useState<"TEXT" | "VIDEO">("TEXT");
  const [senderName, setSenderName] = useState("");
  const [senderRelation, setSenderRelation] = useState("");
  const [textContent, setTextContent] = useState("");
  const [selectedVideo, setSelectedVideo] =
    useState<RecordedVideoResult | null>(null);

  const [storedWish, setStoredWish] = useState<StoredGuestWish | null>(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tabTextRef = useRef<HTMLButtonElement | null>(null);
  const tabVideoRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredGuestWish;
      if (!parsed || !parsed.wishId || !parsed.editToken) return;
      setStoredWish(parsed);

      void (async () => {
        try {
          const res = await fetch(
            `/api/wishes?wishId=${encodeURIComponent(parsed.wishId)}`,
            {
              headers: { "x-edit-token": parsed.editToken },
            }
          );
          if (!res.ok) return;
          const data = (await res.json()) as {
            wish?: {
              id: string;
              senderName: string;
              senderRelation: string;
              type: "TEXT" | "VIDEO";
              textContent?: string;
              videoR2Key?: string;
              videoFileName?: string;
              videoDurationSec?: number;
              videoSizeBytes?: number;
              status: "PUBLISHED" | "PENDING_MODERATION";
              updatedAtIso: string;
            };
          };
          if (data.wish) {
            const synced: StoredGuestWish = {
              wishId: data.wish.id,
              editToken: parsed.editToken,
              senderName: data.wish.senderName,
              senderRelation: data.wish.senderRelation,
              type: data.wish.type,
              textContent: data.wish.textContent,
              videoR2Key: data.wish.videoR2Key,
              videoFileName: data.wish.videoFileName,
              videoDurationSec: data.wish.videoDurationSec,
              videoSizeBytes: data.wish.videoSizeBytes,
              videoObjectUrl: parsed.videoObjectUrl,
              status: data.wish.status,
              updatedAtIso: data.wish.updatedAtIso,
            };
            setStoredWish(synced);
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
          }
        } catch {
          // Retain cached local wish if offline.
        }
      })();
    } catch {
      // Ignore invalid local storage state.
    }
  }, []);

  const handleOpenCameraModal = () => {
    setErrorMessage(null);
    onPauseAudioForVideo();
    setIsCameraModalOpen(true);
  };

  const handleCloseCameraModal = () => {
    setIsCameraModalOpen(false);
    onResumeAudioAfterVideo();
  };

  const handleTabKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const next = activeTab === "TEXT" ? "VIDEO" : "TEXT";
      setActiveTab(next);
      setErrorMessage(null);
      if (next === "TEXT") {
        tabTextRef.current?.focus();
      } else {
        tabVideoRef.current?.focus();
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_VIDEO_BYTES) {
      setErrorMessage(
        `Ukuran berkas video (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal 80 MB. Silakan pilih video yang lebih pendek atau rekam langsung.`
      );
      event.target.value = "";
      return;
    }

    const contentType = resolveVideoMime(file.type, file.name);
    const objectUrl = URL.createObjectURL(file);
    const probeVideo = document.createElement("video");
    probeVideo.preload = "metadata";
    probeVideo.src = objectUrl;

    probeVideo.onloadedmetadata = () => {
      const duration = Math.round(probeVideo.duration || 0);
      if (duration > MAX_VIDEO_DURATION_SEC) {
        URL.revokeObjectURL(objectUrl);
        setErrorMessage(
          `Durasi video (${duration} detik) melebihi batas maksimal 60 detik. Silakan pangkas video Anda hingga maksimal 1 menit.`
        );
        return;
      }

      setSelectedVideo({
        fileName: file.name,
        contentType,
        durationSec: Math.max(1, duration),
        sizeBytes: file.size,
        objectUrl,
        blob: file,
      });
    };

    probeVideo.onerror = () => {
      setSelectedVideo({
        fileName: file.name,
        contentType,
        durationSec: 15,
        sizeBytes: file.size,
        objectUrl,
        blob: file,
      });
    };
  };

  const handleStartEdit = () => {
    if (!storedWish) return;
    setSenderName(storedWish.senderName);
    setSenderRelation(storedWish.senderRelation);
    setActiveTab(storedWish.type);
    setTextContent(storedWish.textContent ?? "");
    if (storedWish.type === "VIDEO" && storedWish.videoFileName) {
      setSelectedVideo({
        fileName: storedWish.videoFileName,
        contentType: resolveVideoMime(undefined, storedWish.videoFileName),
        durationSec: storedWish.videoDurationSec ?? 15,
        sizeBytes: storedWish.videoSizeBytes ?? 512000,
        objectUrl: storedWish.videoObjectUrl ?? "",
        existingR2Key: storedWish.videoR2Key,
      });
    }
    setErrorMessage(null);
    setIsEditingExisting(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const cleanName = senderName.trim();
    const cleanRelation = senderRelation.trim();

    if (!cleanName) {
      setErrorMessage(
        "Nama lengkap wajib diisi agar kedua mempelai mengenali pengirim ucapan."
      );
      return;
    }

    if (activeTab === "TEXT") {
      const cleanText = textContent.trim();
      if (!cleanText) {
        setErrorMessage(
          "Isi doa dan ucapan belum ditulis. Silakan tuliskan doa Anda terlebih dahulu (maksimal 200 karakter)."
        );
        return;
      }
      if (cleanText.length > MAX_TEXT_CHARS) {
        setErrorMessage(
          `Panjang ucapan (${cleanText.length} karakter) melebihi batas 200 karakter.`
        );
        return;
      }
    } else if (!selectedVideo) {
      setErrorMessage(
        "Belum ada video ucapan yang dipilih atau direkam. Silakan klik tombol Rekam dengan Kamera atau Pilih Video dari Galeri."
      );
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(20);

    try {
      let videoR2Key = selectedVideo?.existingR2Key;

      if (activeTab === "VIDEO" && selectedVideo && !videoR2Key) {
        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: selectedVideo.fileName,
            contentType: selectedVideo.contentType,
            sizeBytes: selectedVideo.sizeBytes,
            durationSec: selectedVideo.durationSec,
          }),
        });

        const presignJson = (await presignRes.json()) as {
          error?: string;
          uploadUrl?: string;
          objectKey?: string;
        };

        if (!presignRes.ok || !presignJson.uploadUrl || !presignJson.objectKey) {
          throw new Error(
            presignJson.error ?? "Gagal menyiapkan tautan unggah video ke server."
          );
        }

        setUploadProgress(55);

        const uploadPutRes = await fetch(presignJson.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": selectedVideo.contentType },
          body: selectedVideo.blob ?? new Uint8Array(1024),
        });

        if (!uploadPutRes.ok) {
          throw new Error("Gagal mengunggah berkas video ke penyimpanan.");
        }

        videoR2Key = presignJson.objectKey;
      }

      setUploadProgress(80);

      const payload = {
        senderName: cleanName,
        senderRelation: cleanRelation,
        type: activeTab,
        textContent: activeTab === "TEXT" ? textContent.trim() : undefined,
        videoR2Key: activeTab === "VIDEO" ? videoR2Key : undefined,
        videoFileName:
          activeTab === "VIDEO" ? selectedVideo?.fileName : undefined,
        videoDurationSec:
          activeTab === "VIDEO" ? selectedVideo?.durationSec : undefined,
        videoSizeBytes:
          activeTab === "VIDEO" ? selectedVideo?.sizeBytes : undefined,
      };

      let apiRes: Response;
      if (isEditingExisting && storedWish?.wishId && storedWish?.editToken) {
        apiRes = await fetch(
          `/api/wishes/${encodeURIComponent(storedWish.wishId)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "x-edit-token": storedWish.editToken,
            },
            body: JSON.stringify({
              editToken: storedWish.editToken,
              data: payload,
            }),
          }
        );

        // If the server store was restarted during development and the previous ID is gone, create a new record transparently.
        if (apiRes.status === 404) {
          apiRes = await fetch("/api/wishes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
      } else {
        apiRes = await fetch("/api/wishes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const apiJson = (await apiRes.json()) as {
        error?: string;
        editToken?: string;
        wish?: {
          id: string;
          senderName: string;
          senderRelation: string;
          type: "TEXT" | "VIDEO";
          textContent?: string;
          videoR2Key?: string;
          videoFileName?: string;
          videoDurationSec?: number;
          videoSizeBytes?: number;
          status: "PUBLISHED" | "PENDING_MODERATION";
          updatedAtIso: string;
        };
      };

      if (!apiRes.ok || !apiJson.wish) {
        throw new Error(
          apiJson.error ?? "Terjadi kendala saat menyimpan ucapan ke server."
        );
      }

      setUploadProgress(100);

      const savedWish: StoredGuestWish = {
        wishId: apiJson.wish.id,
        editToken: apiJson.editToken ?? storedWish?.editToken ?? "",
        senderName: apiJson.wish.senderName,
        senderRelation: apiJson.wish.senderRelation,
        type: apiJson.wish.type,
        textContent: apiJson.wish.textContent,
        videoR2Key: apiJson.wish.videoR2Key,
        videoFileName: apiJson.wish.videoFileName,
        videoDurationSec: apiJson.wish.videoDurationSec,
        videoSizeBytes: apiJson.wish.videoSizeBytes,
        videoObjectUrl:
          apiJson.wish.type === "VIDEO"
            ? selectedVideo?.objectUrl
            : undefined,
        status: apiJson.wish.status,
        updatedAtIso: apiJson.wish.updatedAtIso,
      };

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedWish));
      } catch {
        // Keep in-memory state if localStorage is blocked.
      }

      setStoredWish(savedWish);
      setIsEditingExisting(false);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal menghubungi server. Silakan periksa koneksi Anda dan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const showForm = !storedWish || isEditingExisting;

  return (
    <section
      id="ucapan"
      aria-labelledby="ucapan-heading"
      className="py-12 px-5 sm:py-16 sm:px-8 lg:py-24 border-b border-line-subtle bg-surface"
    >
      <div className="max-w-3xl mx-auto">
        <ScrollReveal className="text-center mb-8 sm:mb-10">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gold font-semibold mb-2">
            Kenang-Kenangan Pernikahan
          </p>
          <h2
            id="ucapan-heading"
            className="font-serif fluid-h2 font-bold text-ink-primary mb-3"
          >
            Kirim Doa &amp; Video Ucapan
          </h2>
          <p className="fluid-body text-ink-secondary">
            Sampaikan doa terbaik atau kirimkan rekaman video singkat untuk
            kedua mempelai.
          </p>
        </ScrollReveal>

        <ScrollReveal className="mb-6">
          <div className="rounded-[14px] bg-card border border-line-gold p-4 sm:p-5 flex items-start gap-3.5">
            <svg
              className="w-5 h-5 text-gold shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <div className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              <strong className="text-ink-primary font-semibold">
                Jaminan Privasi Tamu:
              </strong>{" "}
              Doa teks dan video ucapan yang Anda kirimkan bersifat privat,
              tidak ditampilkan ke halaman publik website, dan hanya dapat
              dilihat langsung oleh kedua mempelai melalui Dashboard Admin.
            </div>
          </div>
        </ScrollReveal>

        {!showForm && storedWish ? (
          <UserWishStatusCard
            wish={storedWish}
            onEdit={handleStartEdit}
            onVideoPlay={onPauseAudioForVideo}
            onVideoPause={onResumeAudioAfterVideo}
          />
        ) : (
          <div className="rounded-[14px] bg-card border border-line-gold p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-line-subtle">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-primary">
                  {isEditingExisting
                    ? "Ubah Ucapan Privat Anda"
                    : "Formulir Ucapan Tamu (1 Kuota per Tamu)"}
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Pilih format Doa Teks (maks. 200 karakter) atau Video Ucapan
                  (maks. 60 detik &amp; 80 MB).
                </p>
              </div>
              {isEditingExisting && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingExisting(false);
                    setErrorMessage(null);
                  }}
                  className="min-h-[44px] px-3.5 py-1.5 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs font-semibold text-ink-secondary"
                >
                  Batal Ubah
                </button>
              )}
            </div>

            <div
              role="tablist"
              aria-label="Pilih jenis ucapan"
              onKeyDown={handleTabKeyDown}
              className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-surface border border-line-subtle mb-6"
            >
              <button
                ref={tabTextRef}
                id="tab-wish-text"
                role="tab"
                type="button"
                aria-selected={activeTab === "TEXT"}
                aria-controls="panel-wish-text"
                tabIndex={activeTab === "TEXT" ? 0 : -1}
                onClick={() => {
                  setActiveTab("TEXT");
                  setErrorMessage(null);
                }}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === "TEXT"
                    ? "bg-brand text-brand-on border border-line-gold shadow-sm"
                    : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                Doa Teks (Maks. 200 Kar.)
              </button>

              <button
                ref={tabVideoRef}
                id="tab-wish-video"
                role="tab"
                type="button"
                aria-selected={activeTab === "VIDEO"}
                aria-controls="panel-wish-video"
                tabIndex={activeTab === "VIDEO" ? 0 : -1}
                onClick={() => {
                  setActiveTab("VIDEO");
                  setErrorMessage(null);
                }}
                className={`min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === "VIDEO"
                    ? "bg-brand text-brand-on border border-line-gold shadow-sm"
                    : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                Video Ucapan (Maks. 1 Menit)
              </button>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl bg-surface border-2 border-line-gold p-4 mb-5"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">
                  Periksa Kembali Masukan Anda
                </p>
                <p className="text-xs sm:text-sm text-ink-primary">
                  {errorMessage}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="wish-sender-name"
                    className="block text-xs sm:text-sm font-semibold text-ink-primary mb-1.5"
                  >
                    Nama Lengkap Anda <span className="text-gold">*</span>
                  </label>
                  <input
                    id="wish-sender-name"
                    name="senderName"
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Contoh: Cut Meutia"
                    className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted"
                  />
                </div>

                <div>
                  <label
                    htmlFor="wish-sender-relation"
                    className="block text-xs sm:text-sm font-semibold text-ink-primary mb-1.5"
                  >
                    Hubungan / Kerabat{" "}
                    <span className="text-ink-muted font-normal">(opsional)</span>
                  </label>
                  <input
                    id="wish-sender-relation"
                    name="senderRelation"
                    type="text"
                    value={senderRelation}
                    onChange={(e) => setSenderRelation(e.target.value)}
                    placeholder="Contoh: Keluarga Banda Aceh / Sahabat"
                    className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted"
                  />
                </div>
              </div>

              <div
                id="panel-wish-text"
                role="tabpanel"
                aria-labelledby="tab-wish-text"
                hidden={activeTab !== "TEXT"}
              >
                {activeTab === "TEXT" && (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label
                        htmlFor="wish-text-content"
                        className="text-xs sm:text-sm font-semibold text-ink-primary"
                      >
                        Tulis Doa &amp; Ucapan <span className="text-gold">*</span>
                      </label>
                      <span
                        aria-live="polite"
                        className="text-xs font-mono text-ink-muted"
                      >
                        {textContent.length} / {MAX_TEXT_CHARS} karakter
                      </span>
                    </div>
                    <textarea
                      id="wish-text-content"
                      name="textContent"
                      rows={4}
                      maxLength={MAX_TEXT_CHARS}
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Tuliskan doa terbaik Anda untuk kedua mempelai..."
                      className="w-full rounded-lg bg-surface border border-line-subtle focus:border-line-gold p-3.5 text-sm text-ink-primary placeholder:text-ink-muted resize-y"
                    />
                    <p className="text-[11px] text-ink-muted mt-1.5">
                      Dilengkapi penyaring kata kasar otomatis Bahasa Indonesia
                      dan Bahasa Aceh di sisi server.
                    </p>
                  </div>
                )}
              </div>

              <div
                id="panel-wish-video"
                role="tabpanel"
                aria-labelledby="tab-wish-video"
                hidden={activeTab !== "VIDEO"}
              >
                {activeTab === "VIDEO" && (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-xl bg-surface border border-line-subtle p-4">
                      <p className="text-xs font-semibold text-gold mb-1">
                        Ketentuan Video Ucapan Privat:
                      </p>
                      <ul className="text-xs text-ink-secondary list-disc list-inside space-y-0.5">
                        <li>Durasi maksimal 1 menit (60 detik)</li>
                        <li>Ukuran berkas maksimal 80 MB (.mp4, .webm, .mov)</li>
                        <li>
                          Musik latar Ranup Lampuan otomatis dijeda saat kamera
                          rekam dibuka
                        </li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleOpenCameraModal}
                        className="min-h-[48px] px-4 py-3 rounded-lg bg-surface border border-line-gold hover:bg-page active:scale-[0.99] text-xs sm:text-sm font-semibold text-ink-primary flex items-center justify-center gap-2 transition-all"
                      >
                        <svg
                          className="w-4 h-4 text-gold shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <span>Rekam Langsung dengan Kamera</span>
                      </button>

                      <div>
                        <label
                          htmlFor="wish-video-file"
                          className="w-full min-h-[48px] px-4 py-3 rounded-lg bg-surface border border-line-subtle hover:border-line-gold active:scale-[0.99] text-xs sm:text-sm font-semibold text-ink-primary flex items-center justify-center gap-2 transition-all"
                        >
                          <svg
                            className="w-4 h-4 text-gold shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                          <span>Pilih Video dari Galeri HP</span>
                        </label>
                        <input
                          ref={fileInputRef}
                          id="wish-video-file"
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </div>
                    </div>

                    {selectedVideo ? (
                      <div className="rounded-xl bg-surface border border-line-gold p-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gold">
                            Video Terlampir &amp; Siap Dikirim:
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-ink-primary mt-0.5">
                            {selectedVideo.fileName} ({selectedVideo.durationSec}{" "}
                            detik)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedVideo(null)}
                          className="min-h-[44px] px-3 py-1.5 rounded-lg bg-card border border-line-subtle hover:border-line-gold text-xs font-semibold text-ink-secondary"
                        >
                          Ganti Video
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-surface border border-line-subtle p-4 text-center">
                        <p className="text-xs text-ink-muted">
                          Belum ada video yang dipilih. Silakan rekam melalui
                          kamera atau unggah dari galeri ponsel Anda.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isSubmitting && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-xl bg-surface border border-line-gold p-4"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-gold mb-2">
                    <span>Mengirim ucapan privat ke server mempelai...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-card overflow-hidden">
                    <div
                      className="h-full bg-gold transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[48px] px-6 py-3 rounded-lg bg-brand hover:bg-brand-hover active:scale-[0.99] disabled:opacity-60 text-brand-on text-sm font-semibold border border-line-gold shadow-md flex items-center justify-center gap-2 transition-all mt-1"
              >
                <span>
                  {isSubmitting
                    ? "Menyimpan Ucapan..."
                    : isEditingExisting
                      ? "Simpan Perubahan Ucapan"
                      : activeTab === "TEXT"
                        ? "Kirim Doa Privat ke Mempelai"
                        : "Kirim Video Ucapan Privat"}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>

      <VideoRecorderModal
        isOpen={isCameraModalOpen}
        onClose={handleCloseCameraModal}
        onSwitchToGalleryUpload={() => {
          fileInputRef.current?.click();
        }}
        onVideoCaptured={(clip) => {
          setSelectedVideo(clip);
          setErrorMessage(null);
        }}
      />
    </section>
  );
}
