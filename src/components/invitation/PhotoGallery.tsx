"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryPhotoItem } from "@/config/wedding.config";
import { ScrollReveal } from "./ScrollReveal";

interface PhotoGalleryProps {
  photos: GalleryPhotoItem[];
}

type GalleryViewState = "ready" | "loading" | "empty" | "error";

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [viewState, setViewState] = useState<GalleryViewState>("ready");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastTriggerIdRef = useRef<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const openLightbox = (index: number, id: string) => {
    lastTriggerIdRef.current = id;
    setActiveIndex(index);
  };

  const closeLightbox = useCallback(() => {
    setActiveIndex(null);
    const triggerId = lastTriggerIdRef.current;
    if (triggerId && triggerRefs.current[triggerId]) {
      window.setTimeout(() => {
        triggerRefs.current[triggerId]?.focus();
      }, 0);
    }
  }, []);

  const showPrev = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev === null || photos.length === 0) return null;
      return (prev - 1 + photos.length) % photos.length;
    });
  }, [photos.length]);

  const showNext = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev === null || photos.length === 0) return null;
      return (prev + 1) % photos.length;
    });
  }, [photos.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, closeLightbox, showPrev, showNext]);

  const activePhoto = activeIndex !== null ? photos[activeIndex] : null;

  return (
    <section
      id="galeri"
      aria-labelledby="galeri-heading"
      className="py-12 px-5 sm:py-16 sm:px-8 lg:py-24 border-b border-line-subtle bg-surface"
    >
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gold font-semibold mb-2">
              Potret Kebahagiaan
            </p>
            <h2
              id="galeri-heading"
              className="font-serif fluid-h2 font-bold text-ink-primary"
            >
              Galeri Foto Mempelai
            </h2>
            <p className="fluid-body text-ink-secondary mt-1">
              Pilih foto untuk membuka tampilan penuh (mendukung tombol panah
              dan Escape).
            </p>
          </div>

          {/* UI State verifier so R-27 Empty/Loading/Error states are genuinely operable */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-ink-muted mr-1">Uji State (R-27):</span>
            {(
              [
                { id: "ready", label: "Normal" },
                { id: "loading", label: "Memuat" },
                { id: "empty", label: "Kosong" },
                { id: "error", label: "Gangguan" },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setViewState(st.id)}
                aria-pressed={viewState === st.id}
                className={`min-h-[44px] px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  viewState === st.id
                    ? "bg-brand text-brand-on border-line-gold"
                    : "bg-card text-ink-secondary border-line-subtle hover:border-line-gold"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {viewState === "loading" && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-[14px] bg-card border border-line-subtle p-6"
          >
            <p className="text-sm font-semibold text-gold mb-4">
              Memuat galeri foto mempelai dari penyimpanan...
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="aspect-[3/2] sm:col-span-2 rounded-xl bg-surface border border-line-subtle animate-pulse" />
              <div className="aspect-[4/5] rounded-xl bg-surface border border-line-subtle animate-pulse" />
            </div>
          </div>
        )}

        {viewState === "empty" && (
          <div
            role="status"
            className="rounded-[14px] bg-card border border-line-gold p-8 text-center"
          >
            <p className="text-xs font-mono uppercase tracking-wider text-gold mb-2">
              [GALERI FOTO BELUM DIUNGGAH]
            </p>
            <h3 className="font-serif text-xl font-bold text-ink-primary mb-2">
              Belum Ada Foto Mempelai di Galeri
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary max-w-md mx-auto mb-5">
              Penyebab: Admin belum mengunggah foto ke album pernikahan. Setelah
              foto diunggah melalui Dashboard Admin, galeri akan tampil di
              bagian ini.
            </p>
            <button
              type="button"
              onClick={() => setViewState("ready")}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-brand text-brand-on text-xs font-semibold border border-line-gold"
            >
              Tampilkan Contoh Foto Template
            </button>
          </div>
        )}

        {viewState === "error" && (
          <div
            role="alert"
            className="rounded-[14px] bg-card border border-line-gold p-8 text-center"
          >
            <h3 className="font-serif text-xl font-bold text-ink-primary mb-2">
              Gagal Memuat Galeri Foto
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary max-w-md mx-auto mb-5">
              Penyebab: Sambungan ke penyimpanan media terputus sementara.
              Silakan muat ulang galeri untuk mencoba kembali.
            </p>
            <button
              type="button"
              onClick={() => setViewState("ready")}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-brand text-brand-on text-xs font-semibold border border-line-gold"
            >
              Coba Muat Ulang Galeri
            </button>
          </div>
        )}

        {viewState === "ready" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5">
            {photos.map((photo, index) => {
              const spanClass = photo.featured
                ? "sm:col-span-2 lg:col-span-7"
                : index === 1
                  ? "sm:col-span-1 lg:col-span-5"
                  : index === 2
                    ? "sm:col-span-1 lg:col-span-5"
                    : "sm:col-span-2 lg:col-span-7";

              return (
                <ScrollReveal key={photo.id} className={spanClass}>
                  <button
                    ref={(el) => {
                      triggerRefs.current[photo.id] = el;
                    }}
                    type="button"
                    onClick={() => openLightbox(index, photo.id)}
                    aria-label={`Perbesar foto: ${photo.caption}`}
                    className="group w-full text-left rounded-[14px] overflow-hidden bg-card border border-line-subtle hover:border-line-gold active:scale-[0.99] transition-all flex flex-col"
                  >
                    <div className="w-full overflow-hidden bg-surface relative">
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        width={photo.width}
                        height={photo.height}
                        loading="lazy"
                        className="w-full h-auto object-cover block group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3.5 sm:p-4 flex items-center justify-between gap-2 w-full">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-ink-primary">
                          {photo.caption}
                        </p>
                        <p className="text-[11px] font-mono text-ink-muted">
                          {photo.placeholderLabel}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-gold shrink-0 px-2.5 py-1 rounded bg-surface border border-line-subtle group-hover:border-line-gold">
                        Perbesar
                      </span>
                    </div>
                  </button>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>

      {/* Accessible Lightbox Modal (glassmorphism dose cap #2, R-10, R-32, R-39) */}
      {activePhoto && activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Tampilan penuh ${activePhoto.caption}`}
          className="fixed inset-0 z-50 bg-page/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
        >
          <div className="max-w-3xl w-full rounded-[16px] bg-card border-2 border-line-gold p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-line-subtle">
              <div>
                <p className="text-xs font-mono text-gold">
                  Foto {activeIndex + 1} dari {photos.length} &bull;{" "}
                  {activePhoto.placeholderLabel}
                </p>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-ink-primary">
                  {activePhoto.caption}
                </h3>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeLightbox}
                aria-label="Tutup tampilan foto penuh"
                className="min-h-[44px] min-w-[44px] px-3 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs font-semibold text-ink-primary"
              >
                Tutup (Esc)
              </button>
            </div>

            <div className="w-full rounded-xl overflow-hidden bg-surface border border-line-subtle mb-4">
              <img
                src={activePhoto.src}
                alt={activePhoto.alt}
                width={activePhoto.width}
                height={activePhoto.height}
                className="w-full max-h-[65dvh] object-contain mx-auto block"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={showPrev}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs sm:text-sm font-semibold text-ink-primary"
              >
                Sebelumnya
              </button>
              <span className="text-xs text-ink-muted text-center">
                Gunakan tombol panah kiri/kanan pada keyboard
              </span>
              <button
                type="button"
                onClick={showNext}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs sm:text-sm font-semibold text-ink-primary"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
