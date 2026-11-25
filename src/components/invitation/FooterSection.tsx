"use client";

import React from "react";
import type { WeddingTemplateConfig } from "@/config/wedding.config";
import {
  BungongJeumpaEmblem,
  PintoAcehDivider,
} from "@/components/ornaments/AcehMotifs";

interface FooterSectionProps {
  config: WeddingTemplateConfig;
}

export function FooterSection({ config }: FooterSectionProps) {
  return (
    <footer className="py-12 px-5 sm:px-8 bg-page text-center">
      <div className="max-w-2xl mx-auto">
        <PintoAcehDivider className="max-w-xs mx-auto text-gold-ornament mb-6" />
        <BungongJeumpaEmblem className="w-9 h-9 mx-auto mb-3 text-gold-ornament" />

        <p className="font-serif text-3xl sm:text-4xl font-bold text-ink-primary mb-2">
          {config.postEventMessage.closingGreeting}
        </p>
        <p className="text-xs sm:text-sm text-ink-secondary mb-4">
          Merupakan suatu kehormatan dan kebahagiaan bagi keluarga besar kami
          apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu
          pada acara{" "}
          <strong className="text-gold font-semibold">
            {config.receptionSchedule.title}
          </strong>
          .
        </p>

        <p className="font-serif text-xl font-bold text-gold mb-1">
          {config.couple.bride.nickname} &amp; {config.couple.groom.nickname}
        </p>
        <p className="text-xs text-ink-muted">
          Keluarga Besar {config.couple.bride.fatherName} &amp; Keluarga Besar{" "}
          {config.couple.groom.fatherName}
        </p>
      </div>
    </footer>
  );
}
