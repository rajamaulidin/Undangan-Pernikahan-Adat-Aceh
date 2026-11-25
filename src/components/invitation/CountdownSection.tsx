"use client";

import React, { useEffect, useState } from "react";
import type { WeddingTemplateConfig } from "@/config/wedding.config";

export type CountdownLifecycleState = "auto" | "before" | "ongoing" | "after";

interface CountdownSectionProps {
  startTimeIso: string;
  endTimeIso: string;
  postEventMessage: WeddingTemplateConfig["postEventMessage"];
  overrideState?: CountdownLifecycleState;
  onChangeOverride?: (state: CountdownLifecycleState) => void;
}

interface TimeParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeCountdown(
  startTimeIso: string,
  endTimeIso: string,
  nowMs: number
): { phase: "before" | "ongoing" | "after"; parts: TimeParts } {
  const startMs = new Date(startTimeIso).getTime();
  const endMs = new Date(endTimeIso).getTime();

  if (nowMs >= endMs) {
    return {
      phase: "after",
      parts: { days: 0, hours: 0, minutes: 0, seconds: 0 },
    };
  }

  if (nowMs >= startMs && nowMs < endMs) {
    return {
      phase: "ongoing",
      parts: { days: 0, hours: 0, minutes: 0, seconds: 0 },
    };
  }

  const diffSec = Math.max(0, Math.floor((startMs - nowMs) / 1000));
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  return {
    phase: "before",
    parts: { days, hours, minutes, seconds },
  };
}

export function CountdownSection({
  startTimeIso,
  endTimeIso,
  postEventMessage,
  overrideState = "auto",
  onChangeOverride,
}: CountdownSectionProps) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const computed =
    nowMs === null
      ? {
          phase: "before" as const,
          parts: { days: 120, hours: 9, minutes: 30, seconds: 0 },
        }
      : computeCountdown(startTimeIso, endTimeIso, nowMs);

  const effectivePhase =
    overrideState === "auto" ? computed.phase : overrideState;
  const displayParts =
    overrideState === "before" && computed.phase !== "before"
      ? { days: 24, hours: 10, minutes: 45, seconds: 18 }
      : computed.parts;

  return (
    <div className="rounded-[14px] bg-card border border-line-gold p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-line-subtle">
        <h3 className="text-xs sm:text-sm uppercase tracking-wider font-semibold text-gold">
          Hitung Mundur Resepsi Intat Linto Baro
        </h3>
        <span className="text-xs text-ink-muted">Zona Waktu: WIB (UTC+7)</span>
      </div>

      {effectivePhase === "before" && (
        <div
          aria-live="polite"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center"
        >
          <div className="rounded-lg bg-surface border border-line-subtle p-3">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-gold block">
              {displayParts.days}
            </span>
            <span className="text-xs text-ink-secondary font-medium">Hari</span>
          </div>
          <div className="rounded-lg bg-surface border border-line-subtle p-3">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-gold block">
              {String(displayParts.hours).padStart(2, "0")}
            </span>
            <span className="text-xs text-ink-secondary font-medium">Jam</span>
          </div>
          <div className="rounded-lg bg-surface border border-line-subtle p-3">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-gold block">
              {String(displayParts.minutes).padStart(2, "0")}
            </span>
            <span className="text-xs text-ink-secondary font-medium">
              Menit
            </span>
          </div>
          <div className="rounded-lg bg-surface border border-line-subtle p-3">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-gold block">
              {String(displayParts.seconds).padStart(2, "0")}
            </span>
            <span className="text-xs text-ink-secondary font-medium">
              Detik
            </span>
          </div>
        </div>
      )}

      {effectivePhase === "ongoing" && (
        <div
          role="status"
          className="rounded-lg bg-surface border border-line-gold p-4 text-center"
        >
          <p className="text-xs uppercase tracking-widest text-gold font-semibold mb-1">
            Status Acara Saat Ini
          </p>
          <p className="font-serif text-xl sm:text-2xl font-bold text-ink-primary mb-1">
            Hari Bahagia Telah Tiba: Acara Sedang Berlangsung
          </p>
          <p className="text-xs sm:text-sm text-ink-secondary">
            Selamat datang di kediaman keluarga mempelai wanita (Dara Baro).
          </p>
        </div>
      )}

      {effectivePhase === "after" && (
        <div
          role="status"
          className="rounded-lg bg-surface border border-line-gold p-5 text-center"
        >
          <p className="text-xs uppercase tracking-widest text-gold font-semibold mb-1">
            {postEventMessage.closingGreeting}
          </p>
          <h4 className="font-serif text-xl sm:text-2xl font-bold text-ink-primary mb-2">
            {postEventMessage.title}
          </h4>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            {postEventMessage.body}
          </p>
        </div>
      )}

      {onChangeOverride && (
        <div className="mt-4 pt-3 border-t border-line-subtle flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-ink-muted font-medium">
            Uji Kondisi Waktu (FR-04):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "auto", label: "Waktu Nyata" },
                { id: "before", label: "Sebelum Hari-H" },
                { id: "ongoing", label: "Saat Acara" },
                { id: "after", label: "Pasca Acara" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeOverride(item.id)}
                aria-pressed={overrideState === item.id}
                className={`min-h-[44px] px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  overrideState === item.id
                    ? "bg-brand text-brand-on border-line-gold"
                    : "bg-surface text-ink-secondary border-line-subtle hover:border-line-gold"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
