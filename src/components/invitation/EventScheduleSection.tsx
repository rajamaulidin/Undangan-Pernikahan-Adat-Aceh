"use client";

import React, { useState } from "react";
import type { WeddingTemplateConfig } from "@/config/wedding.config";
import { buildGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendar";
import {
  CountdownLifecycleState,
  CountdownSection,
} from "./CountdownSection";
import { ScrollReveal } from "./ScrollReveal";

interface EventScheduleSectionProps {
  schedule: WeddingTemplateConfig["receptionSchedule"];
  postEventMessage: WeddingTemplateConfig["postEventMessage"];
  coupleSummary: string;
}

export function EventScheduleSection({
  schedule,
  postEventMessage,
  coupleSummary,
}: EventScheduleSectionProps) {
  const [icsSavedNotice, setIcsSavedNotice] = useState(false);
  const [countdownState, setCountdownState] =
    useState<CountdownLifecycleState>("auto");

  const googleCalendarUrl = buildGoogleCalendarUrl(schedule, coupleSummary);

  const handleDownloadIcs = () => {
    downloadIcsFile(schedule, coupleSummary);
    setIcsSavedNotice(true);
    window.setTimeout(() => setIcsSavedNotice(false), 4000);
  };

  return (
    <section
      id="acara"
      aria-labelledby="acara-heading"
      className="py-12 px-5 sm:py-16 sm:px-8 lg:py-24 border-b border-line-subtle bg-page"
    >
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gold font-semibold mb-2">
            Jadwal &amp; Lokasi Acara
          </p>
          <h2
            id="acara-heading"
            className="font-serif fluid-h2 font-bold text-ink-primary mb-3"
          >
            {schedule.title}
          </h2>
          <p className="fluid-body text-ink-secondary">{schedule.description}</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <ScrollReveal>
              <article className="rounded-[14px] bg-card border-2 border-line-gold p-5 sm:p-7 relative">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                  <span className="inline-flex items-center px-3 py-1 rounded-md bg-brand text-brand-on text-xs font-semibold border border-line-gold">
                    {schedule.ceremonyBadge}
                  </span>
                  <span className="text-xs font-medium text-gold">
                    Pihak Keluarga Mempelai Wanita
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-5 mb-5 border-b border-line-subtle">
                  <div className="w-16 h-16 rounded-xl bg-surface border border-line-gold flex flex-col items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold uppercase text-gold">
                      {schedule.dayName}
                    </span>
                    <span className="font-serif text-2xl font-bold text-ink-primary leading-none mt-0.5">
                      {schedule.dayNumber}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif fluid-h3 font-bold text-ink-primary">
                      {schedule.dateDisplay}
                    </h3>
                    <p className="text-sm font-semibold text-gold mt-0.5">
                      Pukul {schedule.timeRangeWib}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm sm:text-base font-bold text-ink-primary">
                      {schedule.venueName}
                    </p>
                    <p className="text-xs sm:text-sm text-ink-secondary mt-1 leading-relaxed">
                      {schedule.address}
                      <br />
                      {schedule.city}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-line-subtle grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadIcs}
                    className="min-h-[46px] px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-hover active:scale-[0.99] text-brand-on text-xs sm:text-sm font-semibold border border-line-gold flex items-center justify-center gap-2 transition-all"
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Simpan ke Kalender (.ics)</span>
                  </button>

                  <a
                    href={googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[46px] px-4 py-2.5 rounded-lg bg-surface hover:border-line-gold active:scale-[0.99] text-ink-primary text-xs sm:text-sm font-semibold border border-line-subtle flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Simpan via Google Calendar</span>
                  </a>
                </div>

                {icsSavedNotice && (
                  <p
                    role="status"
                    aria-live="polite"
                    className="mt-3 text-xs text-gold font-medium"
                  >
                    Berkas pengingat kalender (.ics) berhasil diunduh ke
                    perangkat Anda.
                  </p>
                )}
              </article>
            </ScrollReveal>

            <ScrollReveal delay={0.08}>
              <CountdownSection
                startTimeIso={schedule.startTimeIso}
                endTimeIso={schedule.endTimeIso}
                postEventMessage={postEventMessage}
                overrideState={countdownState}
                onChangeOverride={setCountdownState}
              />
            </ScrollReveal>
          </div>

          <ScrollReveal delay={0.12} className="lg:col-span-5">
            <div className="rounded-[14px] bg-card border border-line-gold p-5 sm:p-6 flex flex-col gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-ink-primary">
                  Peta Lokasi Kediaman
                </h3>
                <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
                  Gampong Lamnyong, Kec. Syiah Kuala, Kota Banda Aceh
                </p>
              </div>

              {/* R-40 requirement: explicit width, height, and aspect-ratio on iframe to prevent layout shift */}
              <div className="relative z-0 isolate w-full rounded-xl overflow-hidden border border-line-subtle bg-surface aspect-[4/3]">
                <iframe
                  title="Peta Lokasi Resepsi Intat Linto Baro"
                  src={schedule.mapsEmbedUrl}
                  width={600}
                  height={450}
                  loading="lazy"
                  className="w-full h-full border-0 block"
                />
              </div>

              <a
                href={schedule.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[46px] px-4 py-3 rounded-lg bg-surface hover:border-line-gold active:scale-[0.99] text-ink-primary text-xs sm:text-sm font-semibold border border-line-subtle flex items-center justify-center gap-2 transition-all"
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
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <span>Arahkan via Google Maps</span>
              </a>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
