"use client";

import React from "react";
import type { WeddingTemplateConfig } from "@/config/wedding.config";
import { BungongJeumpaEmblem } from "@/components/ornaments/AcehMotifs";
import { ScrollReveal } from "./ScrollReveal";

interface CoupleSectionProps {
  couple: WeddingTemplateConfig["couple"];
}

export function CoupleSection({ couple }: CoupleSectionProps) {
  return (
    <section
      id="mempelai"
      aria-labelledby="mempelai-heading"
      className="py-12 px-5 sm:py-16 sm:px-8 lg:py-24 border-b border-line-subtle bg-surface"
    >
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gold font-semibold mb-2">
            Mempelai Berbahagia
          </p>
          <h2
            id="mempelai-heading"
            className="font-serif fluid-h2 font-bold text-ink-primary mb-3"
          >
            Dara Baro &amp; Linto Baro
          </h2>
          <p className="fluid-body text-ink-secondary">
            Satukan langkah dalam ikatan suci pernikahan adat Aceh.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          <ScrollReveal className="sm:col-span-1 lg:col-span-5 flex">
            <article className="w-full rounded-[14px] bg-card border border-line-gold p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold px-2.5 py-1 rounded bg-surface border border-line-subtle">
                    {couple.bride.roleLabel}
                  </span>
                  <span className="text-[11px] font-mono text-ink-muted">
                    {couple.bride.placeholderLabel}
                  </span>
                </div>

                <div className="w-full max-w-[240px] mx-auto mb-5 rounded-[12px] overflow-hidden border border-line-gold bg-surface">
                  <img
                    src={couple.bride.portraitSrc}
                    alt={couple.bride.portraitAlt}
                    width={480}
                    height={600}
                    loading="lazy"
                    className="w-full h-auto aspect-[4/5] object-cover block"
                  />
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-serif fluid-h3 font-bold text-ink-primary mb-2">
                  {couple.bride.fullName}
                </h3>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  Putri tercinta dari:
                  <br />
                  <strong className="text-ink-primary font-semibold">
                    {couple.bride.fatherName}
                  </strong>
                  <br />
                  &amp;{" "}
                  <strong className="text-ink-primary font-semibold">
                    {couple.bride.motherName}
                  </strong>
                </p>
              </div>
            </article>
          </ScrollReveal>

          <div
            className="sm:col-span-2 lg:col-span-2 flex flex-row lg:flex-col items-center justify-center gap-3 py-2"
            aria-hidden="true"
          >
            <span className="h-px w-16 lg:w-px lg:h-16 bg-line-gold" />
            <div className="w-14 h-14 rounded-full bg-card border border-line-gold flex flex-col items-center justify-center text-gold">
              <BungongJeumpaEmblem className="w-6 h-6 text-gold" />
              <span className="font-serif italic text-sm leading-none">&amp;</span>
            </div>
            <span className="h-px w-16 lg:w-px lg:h-16 bg-line-gold" />
          </div>

          <ScrollReveal delay={0.1} className="sm:col-span-1 lg:col-span-5 flex">
            <article className="w-full rounded-[14px] bg-card border border-line-gold p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold px-2.5 py-1 rounded bg-surface border border-line-subtle">
                    {couple.groom.roleLabel}
                  </span>
                  <span className="text-[11px] font-mono text-ink-muted">
                    {couple.groom.placeholderLabel}
                  </span>
                </div>

                <div className="w-full max-w-[240px] mx-auto mb-5 rounded-[12px] overflow-hidden border border-line-gold bg-surface">
                  <img
                    src={couple.groom.portraitSrc}
                    alt={couple.groom.portraitAlt}
                    width={480}
                    height={600}
                    loading="lazy"
                    className="w-full h-auto aspect-[4/5] object-cover block"
                  />
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-serif fluid-h3 font-bold text-ink-primary mb-2">
                  {couple.groom.fullName}
                </h3>
                <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                  Putra tercinta dari:
                  <br />
                  <strong className="text-ink-primary font-semibold">
                    {couple.groom.fatherName}
                  </strong>
                  <br />
                  &amp;{" "}
                  <strong className="text-ink-primary font-semibold">
                    {couple.groom.motherName}
                  </strong>
                </p>
              </div>
            </article>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
