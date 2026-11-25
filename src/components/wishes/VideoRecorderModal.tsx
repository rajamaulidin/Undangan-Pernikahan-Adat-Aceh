"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

export interface RecordedVideoResult {
  fileName: string;
  contentType: "video/mp4" | "video/webm" | "video/quicktime";
  durationSec: number;
  sizeBytes: number;
  objectUrl: string;
  blob?: Blob;
  existingR2Key?: string;
}

interface VideoRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToGalleryUpload: () => void;
  onVideoCaptured: (result: RecordedVideoResult) => void;
}

const MAX_DURATION_SEC = 60;

export function VideoRecorderModal({
  isOpen,
  onClose,
  onSwitchToGalleryUpload,
  onVideoCaptured,
}: VideoRecorderModalProps) {
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [recorderState, setRecorderState] = useState<
    "idle" | "recording" | "preview" | "camera_error"
  >("idle");
  const [errorReason, setErrorReason] = useState<string>("");
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [capturedClip, setCapturedClip] = useState<RecordedVideoResult | null>(
    null
  );

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const elapsedRef = useRef<number>(0);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const stopCameraStream = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCameraPreview = useCallback(
    async (mode: "user" | "environment") => {
      stopCameraStream();
      setErrorReason("");
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setRecorderState("camera_error");
        setErrorReason(
          "Peramban ini tidak menyediakan akses kamera langsung (sering terjadi pada peramban internal aplikasi pesan)."
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });
        streamRef.current = stream;
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
        }
        setRecorderState("idle");
      } catch {
        setRecorderState("camera_error");
        setErrorReason(
          "Izin kamera atau mikrofon ditolak, atau perangkat kamera tidak terdeteksi."
        );
      }
    },
    [stopCameraStream]
  );

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      return;
    }
    closeBtnRef.current?.focus();
    void startCameraPreview(facingMode);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      stopCameraStream();
    };
  }, [isOpen, facingMode, onClose, startCameraPreview, stopCameraStream]);

  if (!isOpen) return null;

  const handleStartRecording = () => {
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === "undefined") {
      setRecorderState("camera_error");
      setErrorReason("Perekam MediaRecorder tidak didukung pada peramban ini.");
      return;
    }

    chunksRef.current = [];
    elapsedRef.current = 0;
    setElapsedSec(0);

    const isMp4 = MediaRecorder.isTypeSupported("video/mp4");
    const mimeType = isMp4
      ? "video/mp4"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";
    const normalizedContentType: "video/mp4" | "video/webm" = isMp4
      ? "video/mp4"
      : "video/webm";

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 1_800_000,
    });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        chunksRef.current.push(ev.data);
      }
    };

    recorder.onstop = () => {
      const ext = isMp4 ? "mp4" : "webm";
      const blob = new Blob(chunksRef.current, { type: normalizedContentType });
      const objectUrl = URL.createObjectURL(blob);
      setCapturedClip({
        fileName: `rekaman-ucapan-aceh.${ext}`,
        contentType: normalizedContentType,
        durationSec: Math.max(1, elapsedRef.current),
        sizeBytes: Math.max(1024, blob.size),
        objectUrl,
        blob,
      });
      setRecorderState("preview");
      stopCameraStream();
    };

    recorder.start(250);
    setRecorderState("recording");

    timerRef.current = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsedSec(elapsedRef.current);
      if (elapsedRef.current >= MAX_DURATION_SEC) {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }
    }, 1000);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFlipCamera = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
  };

  const handleSimulateClip = () => {
    stopCameraStream();
    const syntheticBytes = new Uint8Array(1024 * 420);
    const blob = new Blob([syntheticBytes], { type: "video/webm" });
    const objectUrl = URL.createObjectURL(blob);
    setCapturedClip({
      fileName: "rekaman-kamera-simulasi.webm",
      contentType: "video/webm",
      durationSec: 18,
      sizeBytes: blob.size,
      objectUrl,
      blob,
    });
    setRecorderState("preview");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-kamera-heading"
      className="fixed inset-0 z-50 bg-page/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      <div className="max-w-xl w-full rounded-[16px] bg-card border-2 border-line-gold p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-line-subtle">
          <div>
            <p className="text-xs uppercase tracking-wider text-gold font-semibold">
              Musik Latar Dijeda Otomatis Selama Perekaman
            </p>
            <h3
              id="modal-kamera-heading"
              className="font-serif text-xl sm:text-2xl font-bold text-ink-primary"
            >
              Rekam Video Ucapan (Maks. 60 Detik)
            </h3>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] px-3 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs font-semibold text-ink-primary"
          >
            Tutup (Esc)
          </button>
        </div>

        {recorderState === "camera_error" && (
          <div
            role="alert"
            className="rounded-xl bg-surface border border-line-gold p-5 mb-4"
          >
            <h4 className="font-serif text-lg font-bold text-ink-primary mb-1">
              Kamera Langsung Tidak Dapat Diakses
            </h4>
            <p className="text-xs sm:text-sm text-ink-secondary mb-4 leading-relaxed">
              Penyebab: {errorReason} Anda dapat beralih memilih berkas video
              dari galeri ponsel atau mencoba mode simulasi rekaman.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToGalleryUpload();
                }}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-brand text-brand-on text-xs font-semibold border border-line-gold"
              >
                Pilih Video dari Galeri HP
              </button>
              <button
                type="button"
                onClick={handleSimulateClip}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-card text-ink-primary text-xs font-semibold border border-line-subtle hover:border-line-gold"
              >
                Gunakan Klip Rekaman Simulasi (18 dtk)
              </button>
            </div>
          </div>
        )}

        {(recorderState === "idle" || recorderState === "recording") && (
          <div>
            <div className="w-full rounded-xl overflow-hidden bg-surface border border-line-subtle aspect-video mb-4 relative">
              <video
                ref={liveVideoRef}
                autoPlay
                muted
                playsInline
                width={640}
                height={360}
                className="w-full h-full object-cover block"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-md bg-page/85 border border-line-gold text-xs font-mono text-gold">
                {String(elapsedSec).padStart(2, "0")}s / {MAX_DURATION_SEC}s
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {recorderState === "idle" ? (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="min-h-[46px] px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-brand-on text-xs sm:text-sm font-semibold border border-line-gold"
                >
                  Mulai Rekam Video
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="min-h-[46px] px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-brand-on text-xs sm:text-sm font-semibold border border-line-gold"
                >
                  Hentikan Rekaman ({MAX_DURATION_SEC - elapsedSec}s tersisa)
                </button>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  disabled={recorderState === "recording"}
                  className="min-h-[44px] px-3.5 py-2 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs font-semibold text-ink-primary disabled:opacity-50"
                >
                  Tukar Kamera ({facingMode === "user" ? "Depan" : "Belakang"})
                </button>
                <button
                  type="button"
                  onClick={handleSimulateClip}
                  className="min-h-[44px] px-3.5 py-2 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs font-semibold text-gold"
                >
                  Simulasi Rekaman
                </button>
              </div>
            </div>
          </div>
        )}

        {recorderState === "preview" && capturedClip && (
          <div>
            <div className="rounded-xl bg-surface border border-line-gold p-4 mb-4">
              <p className="text-xs font-semibold text-gold mb-1">
                Pratinjau Hasil Rekaman Siap Dilampirkan
              </p>
              <p className="text-xs text-ink-secondary">
                Berkas: {capturedClip.fileName} &bull; Durasi:{" "}
                {capturedClip.durationSec} detik (batas maks. 60 detik &amp; 80
                MB terpenuhi)
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setCapturedClip(null);
                  void startCameraPreview(facingMode);
                }}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs sm:text-sm font-semibold text-ink-primary"
              >
                Rekam Ulang
              </button>

              <button
                type="button"
                onClick={() => {
                  onVideoCaptured(capturedClip);
                  onClose();
                }}
                className="min-h-[46px] px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-brand-on text-xs sm:text-sm font-semibold border border-line-gold"
              >
                Gunakan Video Ini
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
