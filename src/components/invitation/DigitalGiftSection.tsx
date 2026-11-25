"use client";

import React, { useState } from "react";
import type { WeddingTemplateConfig } from "@/config/wedding.config";
import { ScrollReveal } from "./ScrollReveal";

interface DigitalGiftSectionProps {
  digitalGift: WeddingTemplateConfig["digitalGift"];
}

export function DigitalGiftSection({ digitalGift }: DigitalGiftSectionProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!digitalGift.enabled) return null;

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 3500);
    } catch {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 3500);
    }
  };

  return (
    <section
      id="tanda-kasih"
      aria-labelledby="tanda-kasih-heading"
      className="py-12 px-5 sm:py-16 sm:px-8 lg:py-20 border-b border-line-subtle bg-page"
    >
      <div className="max-w-4xl mx-auto">
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-gold font-semibold mb-2">
            Tanda Kasih Pernikahan (Opsional)
          </p>
          <h2
            id="tanda-kasih-heading"
            className="font-serif fluid-h2 font-bold text-ink-primary mb-3"
          >
            Amplop Digital &amp; Kado
          </h2>
          <p className="fluid-body text-ink-secondary">
            {digitalGift.sectionNote}
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {digitalGift.accounts.map((acc) => {
            const isCopied = copiedId === acc.id;
            return (
              <ScrollReveal key={acc.id}>
                <article className="rounded-[14px] bg-card border border-line-gold p-5 sm:p-6 flex flex-col justify-between gap-4 h-full">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">
                      {acc.bankName}
                    </p>
                    <p className="font-mono text-xl sm:text-2xl font-bold text-ink-primary tracking-wide my-2">
                      {acc.accountNumber}
                    </p>
                    <p className="text-xs sm:text-sm text-ink-secondary">
                      {acc.accountHolder}
                    </p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleCopy(acc.id, acc.accountNumber)}
                      className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-surface border border-line-subtle hover:border-line-gold active:scale-[0.99] text-xs sm:text-sm font-semibold text-ink-primary flex items-center justify-center gap-2 transition-all"
                    >
                      <span>
                        {isCopied
                          ? "Nomor Rekening Tersalin"
                          : "Salin Nomor Rekening"}
                      </span>
                    </button>
                    <span className="sr-only" aria-live="polite">
                      {isCopied
                        ? `Nomor rekening ${acc.bankName} berhasil disalin`
                        : ""}
                    </span>
                  </div>
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
