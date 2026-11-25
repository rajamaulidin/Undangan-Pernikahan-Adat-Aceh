"use client";

import React, { useEffect, useState } from "react";
import {
  GalleryPhotoItem,
  ThemePreset,
  weddingConfig,
  WeddingTemplateConfig,
} from "@/config/wedding.config";
import { useBackgroundAudio } from "@/hooks/useBackgroundAudio";
import { StickyHeader } from "@/components/invitation/StickyHeader";
import { WelcomeCover } from "@/components/invitation/WelcomeCover";
import { SaleumSection } from "@/components/invitation/SaleumSection";
import { CoupleSection } from "@/components/invitation/CoupleSection";
import { EventScheduleSection } from "@/components/invitation/EventScheduleSection";
import { PhotoGallery } from "@/components/invitation/PhotoGallery";
import { DigitalGiftSection } from "@/components/invitation/DigitalGiftSection";
import { PrivateWishSection } from "@/components/wishes/PrivateWishSection";
import { FooterSection } from "@/components/invitation/FooterSection";

export default function InvitationPage() {
  const [liveConfig, setLiveConfig] =
    useState<WeddingTemplateConfig>(weddingConfig);
  const [theme, setTheme] = useState<ThemePreset>(weddingConfig.themePreset);
  const [isInvitationOpened, setIsInvitationOpened] = useState(false);

  const audio = useBackgroundAudio({
    sourceUrl: liveConfig.audioTrack.sourceUrl,
    defaultVolume: liveConfig.audioTrack.defaultVolume,
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const json = (await res.json()) as {
          settings?: Record<string, unknown> | null;
          schedule?: Record<string, unknown> | null;
          galleryPhotos?: Array<{
            id: string;
            storage_key: string;
            caption: string;
            width: number;
            height: number;
            sort_order: number;
          }> | null;
        };

        setLiveConfig((prev) => {
          const next = { ...prev };
          if (json.settings) {
            const s = json.settings;
            if (
              s.theme_preset === "klasik_megah" ||
              s.theme_preset === "modern_elegan"
            ) {
              next.themePreset = s.theme_preset;
              setTheme(s.theme_preset);
            }
            if (typeof s.holy_verse === "string" && s.holy_verse) {
              next.holyVerse = {
                ...prev.holyVerse,
                translation: s.holy_verse,
              };
            }
            if (
              typeof s.post_event_message === "string" &&
              s.post_event_message
            ) {
              next.postEventMessage = {
                ...prev.postEventMessage,
                body: s.post_event_message,
              };
            }
            if (typeof s.enable_digital_gift === "boolean") {
              next.digitalGift = {
                ...prev.digitalGift,
                enabled: s.enable_digital_gift,
              };
            }
          }

          if (json.schedule) {
            const sc = json.schedule;
            next.receptionSchedule = {
              ...prev.receptionSchedule,
              title:
                typeof sc.title === "string" && sc.title
                  ? sc.title
                  : prev.receptionSchedule.title,
              timeRangeWib:
                typeof sc.start_time_wib === "string" &&
                typeof sc.end_time_wib === "string"
                  ? `${sc.start_time_wib} s/d ${sc.end_time_wib}`
                  : prev.receptionSchedule.timeRangeWib,
              venueName:
                typeof sc.venue_name === "string" && sc.venue_name
                  ? sc.venue_name
                  : prev.receptionSchedule.venueName,
              address:
                typeof sc.address === "string" && sc.address
                  ? sc.address
                  : prev.receptionSchedule.address,
              googleMapsUrl:
                typeof sc.google_maps_url === "string" && sc.google_maps_url
                  ? sc.google_maps_url
                  : prev.receptionSchedule.googleMapsUrl,
            };
          }

          if (
            Array.isArray(json.galleryPhotos) &&
            json.galleryPhotos.length > 0
          ) {
            const mappedPhotos: GalleryPhotoItem[] = json.galleryPhotos.map(
              (p, idx) => ({
                id: String(p.id),
                src: String(p.storage_key),
                alt: String(p.caption),
                caption: String(p.caption),
                placeholderLabel: `[FOTO GALERI 0${idx + 1}]`,
                width: Number(p.width) || 960,
                height: Number(p.height) || 640,
                aspectClass: idx === 0 || idx === 3 ? "aspect-[3/2]" : "aspect-[4/5]",
                featured: idx === 0,
              })
            );
            next.galleryPhotos = mappedPhotos;
          }

          return next;
        });
      } catch {
        // Keep static fallback config if offline.
      }
    })();
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) =>
      prev === "klasik_megah" ? "modern_elegan" : "klasik_megah"
    );
  };

  const handleOpenInvitation = () => {
    setIsInvitationOpened(true);
    void audio.startFromUserGesture();
    const target = document.getElementById("sambutan");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const coupleShortTitle = `${liveConfig.couple.bride.nickname} & ${liveConfig.couple.groom.nickname}`;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-page text-ink-primary">
      <StickyHeader
        coupleShortTitle={coupleShortTitle}
        eventTitle={liveConfig.eventTitle}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        showDigitalGift={liveConfig.digitalGift.enabled}
      />

      <main id="konten-utama" className="flex-1">
        <WelcomeCover
          config={liveConfig}
          isInvitationOpened={isInvitationOpened}
          onOpenInvitation={handleOpenInvitation}
        />

        <SaleumSection holyVerse={liveConfig.holyVerse} />

        <CoupleSection couple={liveConfig.couple} />

        <EventScheduleSection
          schedule={liveConfig.receptionSchedule}
          postEventMessage={liveConfig.postEventMessage}
          coupleSummary={coupleShortTitle}
        />

        <PhotoGallery photos={liveConfig.galleryPhotos} />

        <DigitalGiftSection digitalGift={liveConfig.digitalGift} />

        <PrivateWishSection
          onPauseAudioForVideo={audio.pauseForVideo}
          onResumeAudioAfterVideo={() => {
            void audio.resumeAfterVideo();
          }}
        />
      </main>

      <FooterSection config={liveConfig} />
    </div>
  );
}
