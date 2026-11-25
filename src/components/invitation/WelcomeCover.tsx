"use client";

import React from "react";
import type { WeddingTemplateConfig } from "@/config/wedding.config";
import { PintoAcehCorner, PintoAcehDivider } from "@/components/ornaments/AcehMotifs";

interface WelcomeCoverProps {
  config: WeddingTemplateConfig;
  isInvitationOpened: boolean;
  onOpenInvitation: () => void;
}

export function WelcomeCover({
  config,
  isInvitationOpened,
  onOpenInvitation,
}: WelcomeCoverProps) {
  return (
    <section
      id="sampul"
      aria-labelledby="cover-heading"
      className="relative min-h-[calc(100dvh-3.5rem)] flex flex-col justify-between px-4 py-6 sm:px-8 sm:py-10 border-b border-line-subtle bg-page"
    >
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-between rounded-[18px] border-2 border-line-gold bg-surface p-5 sm:p-7 lg:p-9 relative">
        <div className="flex items-center justify-between gap-2">
          <PintoAcehCorner className="w-8 h-8 sm:w-10 sm:h-10 text-gold-ornament shrink-0" />
          <div className="text-center">
            <p className="text-xs sm:text-sm uppercase tracking-[0.22em] text-gold font-semibold">
              {config.ceremonyHeader}
            </p>
            {config.isTemplateDemo && (
              <p className="text-[11px] text-ink-muted mt-0.5">
                Mode Pratinjau Template Portofolio Adat Aceh
              </p>
            )}
          </div>
          <PintoAcehCorner className="w-8 h-8 sm:w-10 sm:h-10 text-gold-ornament shrink-0" />
        </div>

        <div className="my-auto py-4 sm:py-6 flex flex-col items-center text-center max-w-2xl mx-auto w-full">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-ink-secondary font-medium mb-2">
            {config.welcomeGreeting}
          </p>

          <PintoAcehDivider className="w-44 sm:w-56 text-gold-ornament mb-4" />

          {/* R-40 requirement: hero image is an <img> in HTML with explicit dimensions and fetchpriority="high", never lazy. */}
          <div className="w-full max-w-[280px] sm:max-w-sm mb-5 rounded-[14px] overflow-hidden border border-line-gold bg-card">
            <img
              src={config.couple.heroImageSrc}
              alt={config.couple.heroImageAlt}
              width={960}
              height={540}
              fetchPriority="high"
              className="w-full h-auto aspect-[16/9] object-cover block"
            />
          </div>

          <h1
            id="cover-heading"
            className="font-serif fluid-h1 font-bold text-ink-primary tracking-tight"
          >
            <span>{config.couple.bride.nickname}</span>{" "}
            <span className="text-gold italic font-normal">&amp;</span>{" "}
            <span>{config.couple.groom.nickname}</span>
          </h1>

          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-card border border-line-gold">
            <span className="text-xs sm:text-sm font-semibold text-gold tracking-wide">
              Acara {config.receptionSchedule.title}
            </span>
          </div>

          <p className="mt-3 text-xs sm:text-sm text-ink-secondary">
            {config.receptionSchedule.dateDisplay} &bull;{" "}
            {config.receptionSchedule.city}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="w-full max-w-xs">
            <button
              type="button"
              onClick={onOpenInvitation}
              className="w-full min-h-[48px] px-6 py-3 rounded-lg bg-brand hover:bg-brand-hover active:scale-[0.99] text-brand-on font-semibold text-sm sm:text-base border border-line-gold shadow-md flex items-center justify-center gap-2.5 transition-all"
            >
              <span>
                {isInvitationOpened
                  ? "Lihat Isi Undangan"
                  : "Buka Undangan"}
              </span>
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          <p className="text-xs text-ink-muted text-center">
            Diiringi Instrumen Adat Aceh{" "}
            <strong className="text-gold font-semibold">
              {config.audioTrack.title}
            </strong>{" "}
            (Mengikuti Volume Perangkat)
          </p>

          <div className="w-full flex items-center justify-between pt-1">
            <PintoAcehCorner className="w-7 h-7 text-gold-ornament opacity-80" />
            <span className="text-[11px] text-ink-muted">
              Pihak Keluarga Dara Baro
            </span>
            <PintoAcehCorner className="w-7 h-7 text-gold-ornament opacity-80" />
          </div>
        </div>
      </div>
    </section>
  );
}
