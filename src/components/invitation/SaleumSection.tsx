"use client";

import React from "react";
import type { WeddingTemplateConfig } from "@/config/wedding.config";
import {
  BungongJeumpaEmblem,
  PintoAcehDivider,
} from "@/components/ornaments/AcehMotifs";
import { ScrollReveal } from "./ScrollReveal";

interface SaleumSectionProps {
  holyVerse: WeddingTemplateConfig["holyVerse"];
}

export function SaleumSection({ holyVerse }: SaleumSectionProps) {
  return (
    <section
      id="sambutan"
      aria-labelledby="sambutan-heading"
      className="py-12 px-5 sm:py-16 sm:px-8 lg:py-20 border-b border-line-subtle bg-page"
    >
      <ScrollReveal className="max-w-3xl mx-auto text-center">
        <BungongJeumpaEmblem className="w-10 h-10 mx-auto mb-4 text-gold-ornament" />

        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gold font-semibold mb-2">
          {holyVerse.bismillah}
        </p>

        <h2
          id="sambutan-heading"
          className="font-serif fluid-h2 font-bold text-ink-primary mb-4"
        >
          Assalamu&apos;alaikum Warahmatullahi Wabarakatuh, Saleum Teuka
        </h2>

        <p className="fluid-body text-ink-secondary mb-6 max-w-2xl mx-auto">
          Dengan memohon rahmat dan ridha Allah Subhanahu Wa Ta&apos;ala, kami
          mengundang Bapak/Ibu/Saudara/i untuk menghadiri dan memberikan doa
          restu pada acara pernikahan putra-putri kami.
        </p>

        <blockquote className="rounded-[14px] bg-card border border-line-gold p-5 sm:p-7 mb-6">
          <p className="font-serif italic text-lg sm:text-xl text-ink-primary leading-relaxed mb-3">
            &ldquo;{holyVerse.translation}&rdquo;
          </p>
          <footer className="text-xs sm:text-sm font-semibold text-gold">
            ({holyVerse.surahRef})
          </footer>
        </blockquote>

        <div className="rounded-[14px] bg-surface border border-line-subtle p-4 sm:p-5 max-w-xl mx-auto mb-6">
          <p className="text-xs uppercase tracking-widest text-gold font-semibold mb-1">
            Hadih Maja Aceh
          </p>
          <p className="font-serif italic text-base sm:text-lg text-ink-primary mb-1">
            &ldquo;{holyVerse.hadihMaja}&rdquo;
          </p>
          <p className="text-xs sm:text-sm text-ink-secondary">
            {holyVerse.hadihMajaMeaning}
          </p>
        </div>

        <PintoAcehDivider className="max-w-xs mx-auto text-gold-ornament" />
      </ScrollReveal>
    </section>
  );
}
