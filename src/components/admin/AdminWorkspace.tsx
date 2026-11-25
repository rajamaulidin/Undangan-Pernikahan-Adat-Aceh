"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { weddingConfig } from "@/config/wedding.config";
import {
  BannedWordEntry,
  evaluateProfanity,
} from "@/lib/profanity-filter";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { AdminSectionId, AdminShell } from "./AdminShell";

interface AdminWishItem {
  id: string;
  senderName: string;
  senderRelation: string;
  type: "TEXT" | "VIDEO";
  textContent?: string;
  videoR2Key?: string;
  videoFileName?: string;
  videoDurationSec?: number;
  videoSizeBytes?: number;
  videoSignedUrl?: string | null;
  status: "PUBLISHED" | "PENDING_MODERATION" | "HIDDEN";
  flaggedWords: string[];
  createdAtIso: string;
  updatedAtIso: string;
}

interface AdminBannedWordRow {
  id: string;
  word: string;
  language: "id" | "aceh";
  match_type: "exact" | "contains";
  is_active: boolean;
}

interface AdminGalleryPhotoRow {
  id: string;
  storage_key: string;
  caption: string;
  width: number;
  height: number;
  sort_order: number;
}

interface AdminWorkspaceProps {
  initialSection: AdminSectionId;
}

function formatDateWib(iso: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminWorkspace({ initialSection }: AdminWorkspaceProps) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>("Memeriksa sesi...");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const [wishes, setWishes] = useState<AdminWishItem[]>([]);
  const [bannedWords, setBannedWords] = useState<AdminBannedWordRow[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<AdminGalleryPhotoRow[]>(
    []
  );

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING_MODERATION" | "PUBLISHED" | "HIDDEN"
  >("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "TEXT" | "VIDEO">("ALL");

  const [testSentence, setTestSentence] = useState("");
  const [newWord, setNewWord] = useState("");
  const [newWordLang, setNewWordLang] = useState<"aceh" | "id">("aceh");
  const [newWordMatch, setNewWordMatch] = useState<"exact" | "contains">(
    "exact"
  );
  const [dictLangFilter, setDictLangFilter] = useState<"ALL" | "aceh" | "id">(
    "ALL"
  );

  const [themePreset, setThemePreset] = useState<
    "klasik_megah" | "modern_elegan"
  >(weddingConfig.themePreset);
  const [holyVerse, setHolyVerse] = useState(
    weddingConfig.holyVerse.translation
  );
  const [postEventMessage, setPostEventMessage] = useState(
    weddingConfig.postEventMessage.body
  );
  const [enableDigitalGift, setEnableDigitalGift] = useState(
    weddingConfig.digitalGift.enabled
  );
  const [scheduleTitle, setScheduleTitle] = useState(
    weddingConfig.receptionSchedule.title
  );
  const [startTimeWib, setStartTimeWib] = useState("10.00 WIB");
  const [endTimeWib, setEndTimeWib] = useState("16.00 WIB");
  const [venueName, setVenueName] = useState(
    weddingConfig.receptionSchedule.venueName
  );
  const [address, setAddress] = useState(
    `${weddingConfig.receptionSchedule.address}, ${weddingConfig.receptionSchedule.city}`
  );
  const [googleMapsUrl, setGoogleMapsUrl] = useState(
    weddingConfig.receptionSchedule.googleMapsUrl
  );
  const [newPhotoUrl, setNewPhotoUrl] = useState("/images/gallery-01.svg");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");

  const [selectedWishIds, setSelectedWishIds] = useState<string[]>([]);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setFeedbackNotice(msg);
    window.setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const fetchDashboardData = useCallback(
    async (token: string) => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch("/api/admin", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401 || res.status === 403) {
          router.replace("/admin/login");
          return;
        }

        const json = (await res.json()) as {
          error?: string;
          adminEmail?: string;
          wishes?: AdminWishItem[];
          bannedWords?: AdminBannedWordRow[];
          settings?: Record<string, unknown> | null;
          schedule?: Record<string, unknown> | null;
          galleryPhotos?: AdminGalleryPhotoRow[];
        };

        if (!res.ok) {
          throw new Error(json.error ?? "Gagal memuat data Dashboard Admin.");
        }

        setAdminEmail(json.adminEmail ?? "admin@undangan-aceh.id");
        setWishes(json.wishes ?? []);
        setBannedWords(json.bannedWords ?? []);
        setGalleryPhotos(json.galleryPhotos ?? []);

        if (json.settings) {
          const s = json.settings;
          if (
            s.theme_preset === "klasik_megah" ||
            s.theme_preset === "modern_elegan"
          ) {
            setThemePreset(s.theme_preset);
          }
          if (typeof s.holy_verse === "string" && s.holy_verse) {
            setHolyVerse(s.holy_verse);
          }
          if (
            typeof s.post_event_message === "string" &&
            s.post_event_message
          ) {
            setPostEventMessage(s.post_event_message);
          }
          if (typeof s.enable_digital_gift === "boolean") {
            setEnableDigitalGift(s.enable_digital_gift);
          }
        }

        if (json.schedule) {
          const sc = json.schedule;
          if (typeof sc.title === "string" && sc.title) {
            setScheduleTitle(sc.title);
          }
          if (typeof sc.start_time_wib === "string" && sc.start_time_wib) {
            setStartTimeWib(sc.start_time_wib);
          }
          if (typeof sc.end_time_wib === "string" && sc.end_time_wib) {
            setEndTimeWib(sc.end_time_wib);
          }
          if (typeof sc.venue_name === "string" && sc.venue_name) {
            setVenueName(sc.venue_name);
          }
          if (typeof sc.address === "string" && sc.address) {
            setAddress(sc.address);
          }
          if (typeof sc.google_maps_url === "string" && sc.google_maps_url) {
            setGoogleMapsUrl(sc.google_maps_url);
          }
        }
      } catch (err) {
        setLoadError(
          err instanceof Error
            ? err.message
            : "Tidak dapat terhubung ke server Dashboard Admin."
        );
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.replace("/admin/login");
        return;
      }
      setAccessToken(token);
      await fetchDashboardData(token);
    })();
  }, [fetchDashboardData, router]);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  const postAdminAction = async (payload: Record<string, unknown>) => {
    if (!accessToken) return null;
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as { error?: string; ok?: boolean };
    if (!res.ok) {
      throw new Error(json.error ?? "Gagal mengeksekusi aksi admin.");
    }
    return json;
  };

  const pendingCount = useMemo(
    () => wishes.filter((w) => w.status === "PENDING_MODERATION").length,
    [wishes]
  );

  // Put PENDING_MODERATION items at the very top of the moderation list so the admin acts on them first.
  const filteredWishes = useMemo(() => {
    return wishes
      .filter((w) => (statusFilter === "ALL" ? true : w.status === statusFilter))
      .filter((w) => (typeFilter === "ALL" ? true : w.type === typeFilter))
      .sort((a, b) => {
        if (
          a.status === "PENDING_MODERATION" &&
          b.status !== "PENDING_MODERATION"
        ) {
          return -1;
        }
        if (
          b.status === "PENDING_MODERATION" &&
          a.status !== "PENDING_MODERATION"
        ) {
          return 1;
        }
        return (
          new Date(b.createdAtIso).getTime() -
          new Date(a.createdAtIso).getTime()
        );
      });
  }, [wishes, statusFilter, typeFilter]);

  const activeWordRules: BannedWordEntry[] = useMemo(
    () =>
      bannedWords.map((w) => ({
        word: w.word,
        language: w.language,
        matchType: w.match_type,
        isActive: w.is_active,
      })),
    [bannedWords]
  );

  const liveProfanitySimulation = useMemo(() => {
    if (!testSentence.trim()) return null;
    return evaluateProfanity(testSentence, activeWordRules);
  }, [testSentence, activeWordRules]);

  const filteredDictionary = useMemo(() => {
    return bannedWords.filter((w) =>
      dictLangFilter === "ALL" ? true : w.language === dictLangFilter
    );
  }, [bannedWords, dictLangFilter]);

  const handleUpdateWishStatus = async (
    wishId: string,
    status: "PUBLISHED" | "PENDING_MODERATION" | "HIDDEN"
  ) => {
    try {
      await postAdminAction({
        action: "update_wish_status",
        wishId,
        status,
      });
      setWishes((prev) =>
        prev.map((w) => (w.id === wishId ? { ...w, status } : w))
      );
      showNotice(`Status ucapan berhasil diperbarui ke ${status}.`);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Gagal memperbarui status ucapan."
      );
    }
  };

  const handleDeleteWish = async (wishId: string) => {
    try {
      await postAdminAction({
        action: "delete_wish",
        wishId,
      });
      setWishes((prev) => prev.filter((w) => w.id !== wishId));
      setSelectedWishIds((prev) => prev.filter((id) => id !== wishId));
      showNotice("Ucapan dan berkas medianya berhasil dihapus.");
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Gagal menghapus ucapan."
      );
    }
  };

  const handleAddBannedWord = async (event: React.FormEvent) => {
    event.preventDefault();
    const clean = newWord.trim().toLowerCase();
    if (!clean || !accessToken) return;
    try {
      await postAdminAction({
        action: "add_banned_word",
        word: clean,
        language: newWordLang,
        matchType: newWordMatch,
      });
      setNewWord("");
      await fetchDashboardData(accessToken);
      showNotice(`Kata "${clean}" berhasil disimpan ke kamus filter.`);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Gagal menambah kata terlarang."
      );
    }
  };

  const handleToggleWord = async (id: string, currentActive: boolean) => {
    try {
      await postAdminAction({
        action: "toggle_banned_word",
        id,
        isActive: !currentActive,
      });
      setBannedWords((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, is_active: !currentActive } : w
        )
      );
      showNotice("Status kata terlarang berhasil diperbarui.");
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Gagal mengubah status kata."
      );
    }
  };

  const handleDeleteWord = async (id: string, word: string) => {
    try {
      await postAdminAction({
        action: "delete_banned_word",
        id,
      });
      setBannedWords((prev) => prev.filter((w) => w.id !== id));
      showNotice(`Kata "${word}" berhasil dihapus dari kamus.`);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Gagal menghapus kata."
      );
    }
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await postAdminAction({
        action: "save_settings",
        themePreset,
        holyVerse,
        postEventMessage,
        enableDigitalGift,
        scheduleTitle,
        startTimeWib,
        endTimeWib,
        venueName,
        address,
        googleMapsUrl,
      });
      document.documentElement.dataset.theme = themePreset;
      showNotice(
        "Pengaturan acara Intat Linto Baro dan tema berhasil disimpan ke Supabase."
      );
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Gagal menyimpan pengaturan."
      );
    }
  };

  const handleAddGalleryPhoto = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newPhotoCaption.trim() || !accessToken) return;
    try {
      await postAdminAction({
        action: "add_gallery_photo",
        storageKey: newPhotoUrl.trim(),
        caption: newPhotoCaption.trim(),
        width: 960,
        height: 640,
      });
      setNewPhotoCaption("");
      await fetchDashboardData(accessToken);
      showNotice("Foto baru berhasil ditambahkan ke Galeri Mempelai.");
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Gagal menambah foto galeri."
      );
    }
  };

  const handleDeleteGalleryPhoto = async (id: string) => {
    try {
      await postAdminAction({
        action: "delete_gallery_photo",
        id,
      });
      setGalleryPhotos((prev) => prev.filter((p) => p.id !== id));
      showNotice("Foto berhasil dihapus dari galeri.");
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Gagal menghapus foto galeri."
      );
    }
  };

  const exportCsvForWishes = (items: AdminWishItem[], filename: string) => {
    const safeCell = (val = ""): string => {
      // Prefix spreadsheet formula characters with an apostrophe to prevent CSV injection in Excel.
      const escaped = /^[=+\-@]/.test(val) ? `'${val}` : val;
      return `"${escaped.replace(/"/g, '""')}"`;
    };
    const header = [
      "ID",
      "Nama Pengirim",
      "Hubungan",
      "Jenis",
      "Isi Doa Teks",
      "Berkas Video",
      "Durasi Video (Detik)",
      "Status",
      "Waktu Kirim (WIB)",
    ];
    const rows = items.map((w) => [
      w.id,
      safeCell(w.senderName),
      safeCell(w.senderRelation),
      w.type,
      safeCell(w.textContent),
      safeCell(w.videoFileName ?? w.videoR2Key),
      w.videoDurationSec ?? "",
      w.status,
      safeCell(formatDateWib(w.createdAtIso)),
    ]);

    const csvContent =
      "\uFEFF" + [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotice(`Berkas arsip ${filename} (${items.length} baris) berhasil diunduh.`);
  };

  const downloadVideosSequentially = async (items: AdminWishItem[]) => {
    const videoItems = items.filter((w) => w.type === "VIDEO");
    if (videoItems.length === 0) {
      setDownloadStatus(
        "Tidak ada video ucapan pada daftar pilihan yang dipilih."
      );
      return;
    }

    for (let i = 0; i < videoItems.length; i++) {
      const item = videoItems[i];
      setDownloadStatus(
        `Mengunduh video ${i + 1} dari ${videoItems.length}: ${
          item.videoFileName ?? item.senderName
        }...`
      );
      if (item.videoSignedUrl) {
        const a = document.createElement("a");
        a.href = item.videoSignedUrl;
        a.download = item.videoFileName ?? `video-${item.id}.webm`;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      await new Promise((r) => window.setTimeout(r, 400));
    }

    setDownloadStatus(
      `Selesai menyiapkan unduhan untuk ${videoItems.length} video ucapan.`
    );
  };

  return (
    <AdminShell
      activeSection={initialSection}
      adminEmail={adminEmail}
      pendingCount={pendingCount}
      onSignOut={handleSignOut}
    >
      {feedbackNotice && (
        <div
          role="status"
          aria-live="polite"
          className="mb-5 rounded-xl bg-card border-2 border-line-gold p-4 flex items-center justify-between gap-3"
        >
          <p className="text-xs sm:text-sm font-semibold text-gold">
            {feedbackNotice}
          </p>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="min-h-[44px] px-3 rounded-lg bg-surface border border-line-subtle text-xs font-semibold text-ink-secondary"
          >
            Tutup
          </button>
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="mb-6 rounded-xl bg-card border-2 border-line-gold p-5"
        >
          <h2 className="font-serif text-lg font-bold text-ink-primary mb-1">
            Gangguan Memuat atau Menyimpan Data
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary mb-3">
            Penyebab: {loadError}
          </p>
          <button
            type="button"
            onClick={() => {
              if (accessToken) void fetchDashboardData(accessToken);
            }}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-brand text-brand-on text-xs font-semibold border border-line-gold"
          >
            Muat Ulang Data Sekarang
          </button>
        </div>
      )}

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-[14px] bg-card border border-line-subtle p-6"
        >
          <p className="text-sm font-semibold text-gold mb-4">
            Memuat data ruang kerja mempelai dari Supabase...
          </p>
          <div className="space-y-3">
            <div className="h-16 rounded-xl bg-surface border border-line-subtle animate-pulse" />
            <div className="h-16 rounded-xl bg-surface border border-line-subtle animate-pulse" />
            <div className="h-16 rounded-xl bg-surface border border-line-subtle animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          {initialSection === "moderasi" && (
            <section aria-labelledby="admin-moderasi-heading">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 mb-6 border-b border-line-subtle">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gold font-semibold mb-1">
                    Layar Keputusan 1: Peninjauan &amp; Pemutar Kenangan
                  </p>
                  <h1
                    id="admin-moderasi-heading"
                    className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary"
                  >
                    Doa Teks &amp; Video Ucapan Masuk
                  </h1>
                  <p className="text-xs sm:text-sm text-ink-secondary mt-1">
                    Seluruh ucapan di bawah bersifat privat (tidak tampil di
                    halaman publik). Antrean yang memicu filter kata kasar
                    ditempatkan paling atas.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-2 rounded-lg bg-card border border-line-subtle text-ink-primary font-semibold">
                    Total Masuk: {wishes.length}
                  </span>
                  <span className="px-3 py-2 rounded-lg bg-card border border-line-gold text-gold font-semibold">
                    Tertahan Filter: {pendingCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (accessToken) void fetchDashboardData(accessToken);
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-lg bg-surface border border-line-subtle hover:border-line-gold font-semibold text-ink-primary"
                  >
                    Segarkan
                  </button>
                </div>
              </div>

              <div className="rounded-[14px] bg-card border border-line-subtle p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-ink-muted mr-1 font-medium">
                    Status:
                  </span>
                  {(
                    [
                      { id: "ALL", label: `Semua (${wishes.length})` },
                      {
                        id: "PENDING_MODERATION",
                        label: `Tertahan (${pendingCount})`,
                      },
                      {
                        id: "PUBLISHED",
                        label: `Disetujui (${
                          wishes.filter((w) => w.status === "PUBLISHED").length
                        })`,
                      },
                      {
                        id: "HIDDEN",
                        label: `Disembunyikan (${
                          wishes.filter((w) => w.status === "HIDDEN").length
                        })`,
                      },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      aria-pressed={statusFilter === tab.id}
                      className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        statusFilter === tab.id
                          ? "bg-brand text-brand-on border-line-gold"
                          : "bg-surface text-ink-secondary border-line-subtle hover:border-line-gold"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-ink-muted mr-1 font-medium">
                    Format:
                  </span>
                  {(
                    [
                      { id: "ALL", label: "Semua Format" },
                      { id: "TEXT", label: "Doa Teks" },
                      { id: "VIDEO", label: "Video Ucapan" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTypeFilter(t.id)}
                      aria-pressed={typeFilter === t.id}
                      className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        typeFilter === t.id
                          ? "bg-brand text-brand-on border-line-gold"
                          : "bg-surface text-ink-secondary border-line-subtle hover:border-line-gold"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredWishes.length === 0 ? (
                <div
                  role="status"
                  className="rounded-[14px] bg-card border border-line-gold p-8 text-center"
                >
                  <h2 className="font-serif text-xl font-bold text-ink-primary mb-2">
                    {wishes.length === 0
                      ? "Belum Ada Doa atau Video Ucapan yang Masuk"
                      : "Tidak Ada Ucapan yang Cocok dengan Filter Ini"}
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-secondary max-w-md mx-auto mb-4">
                    {wishes.length === 0
                      ? "Penyebab: Tamu undangan belum mengirimkan formulir ucapan. Setiap doa teks dan video yang dikirim tamu akan langsung tampil di sini."
                      : "Penyebab: Filter status atau format yang aktif menyembunyikan baris lain. Reset filter untuk melihat seluruh ucapan."}
                  </p>
                  {wishes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("ALL");
                        setTypeFilter("ALL");
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-lg bg-brand text-brand-on text-xs font-semibold border border-line-gold"
                    >
                      Tampilkan Semua Ucapan
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredWishes.map((item) => (
                    <article
                      key={item.id}
                      className={`rounded-[14px] bg-card p-5 border-2 transition-all ${
                        item.status === "PENDING_MODERATION"
                          ? "border-line-gold"
                          : "border-line-subtle"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 mb-3 border-b border-line-subtle">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-serif text-xl font-bold text-ink-primary">
                              {item.senderName}
                            </h2>
                            {item.senderRelation && (
                              <span className="text-xs text-ink-secondary">
                                ({item.senderRelation})
                              </span>
                            )}
                            <span className="px-2.5 py-0.5 rounded bg-surface border border-line-subtle text-xs font-semibold text-gold">
                              {item.type === "TEXT"
                                ? "Doa Teks"
                                : "Video Ucapan"}
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5">
                            Dikirim: {formatDateWib(item.createdAtIso)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-md text-xs font-bold border ${
                              item.status === "PENDING_MODERATION"
                                ? "bg-brand text-brand-on border-line-gold"
                                : item.status === "PUBLISHED"
                                  ? "bg-surface text-gold border-line-gold"
                                  : "bg-surface text-ink-muted border-line-subtle"
                            }`}
                          >
                            {item.status === "PENDING_MODERATION"
                              ? "Perlu Moderasi Kata Kasar"
                              : item.status === "PUBLISHED"
                                ? "Disetujui (Tersimpan Privat)"
                                : "Disembunyikan"}
                          </span>
                        </div>
                      </div>

                      {item.flaggedWords.length > 0 && (
                        <div className="mb-3 rounded-lg bg-surface border border-line-gold px-3.5 py-2 text-xs text-gold font-semibold">
                          Kata terlarang terdeteksi:{" "}
                          <span className="font-mono underline">
                            {item.flaggedWords.join(", ")}
                          </span>
                        </div>
                      )}

                      {item.type === "TEXT" ? (
                        <blockquote className="rounded-xl bg-surface border border-line-subtle p-4 font-serif italic text-base sm:text-lg text-ink-primary mb-4">
                          &ldquo;{item.textContent}&rdquo;
                        </blockquote>
                      ) : (
                        <div className="rounded-xl bg-surface border border-line-subtle p-4 mb-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-secondary mb-3">
                            <span>
                              Berkas:{" "}
                              <strong className="text-ink-primary">
                                {item.videoFileName ??
                                  item.videoR2Key ??
                                  "video-ucapan.webm"}
                              </strong>
                            </span>
                            <span>
                              Durasi: {item.videoDurationSec ?? 15} detik
                            </span>
                          </div>

                          {item.videoSignedUrl ? (
                            <div className="w-full max-w-lg rounded-lg overflow-hidden border border-line-subtle bg-page aspect-video">
                              <video
                                src={item.videoSignedUrl}
                                controls
                                preload="metadata"
                                width={480}
                                height={270}
                                className="w-full h-full object-contain block"
                              />
                            </div>
                          ) : (
                            <p className="text-xs text-ink-muted">
                              Kunci penyimpanan:{" "}
                              <code className="font-mono text-gold">
                                {item.videoR2Key ?? "simulasi-lokal"}
                              </code>
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-2.5">
                        {item.status !== "PUBLISHED" && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleUpdateWishStatus(item.id, "PUBLISHED")
                            }
                            className="min-h-[44px] px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-brand-on text-xs font-semibold border border-line-gold"
                          >
                            Setujui Ucapan
                          </button>
                        )}

                        {item.status !== "HIDDEN" && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleUpdateWishStatus(item.id, "HIDDEN")
                            }
                            className="min-h-[44px] px-4 py-2 rounded-lg bg-surface hover:border-line-gold text-ink-primary text-xs font-semibold border border-line-subtle"
                          >
                            Sembunyikan
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => void handleDeleteWish(item.id)}
                          className="min-h-[44px] px-4 py-2 rounded-lg bg-surface hover:border-line-gold text-gold text-xs font-semibold border border-line-subtle"
                        >
                          Hapus Permanen
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {initialSection === "filter" && (
            <section aria-labelledby="admin-filter-heading">
              <div className="pb-5 mb-6 border-b border-line-subtle">
                <p className="text-xs uppercase tracking-wider text-gold font-semibold mb-1">
                  Layar Keputusan 2: Moderasi Bahasa Indonesia &amp; Aceh
                </p>
                <h1
                  id="admin-filter-heading"
                  className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary"
                >
                  Kamus Kata Kasar &amp; Simulator Filter
                </h1>
                <p className="text-xs sm:text-sm text-ink-secondary mt-1">
                  Kelola daftar kata maupun frasa dua kata (seperti{" "}
                  <code className="text-gold">pukoe lempap</code> dan{" "}
                  <code className="text-gold">ek boh</code>) yang otomatis
                  menahan ucapan teks ke antrean moderasi.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                <div className="lg:col-span-6 rounded-[14px] bg-card border border-line-gold p-5">
                  <h2 className="font-serif text-xl font-bold text-ink-primary mb-1">
                    Kotak Uji Kalimat Filter
                  </h2>
                  <p className="text-xs text-ink-secondary mb-4">
                    Ketik contoh kalimat untuk menguji apakah filter mendeteksi
                    kata kasar (termasuk variasi titik, strip, dan angka
                    leetspeak).
                  </p>

                  <label
                    htmlFor="sim-sentence"
                    className="block text-xs font-semibold text-ink-primary mb-1.5"
                  >
                    Kalimat Uji Coba
                  </label>
                  <textarea
                    id="sim-sentence"
                    rows={3}
                    value={testSentence}
                    onChange={(e) => setTestSentence(e.target.value)}
                    placeholder="Contoh: coba ketik puk03 l3mp4p atau e-k b-o-h..."
                    className="w-full rounded-lg bg-surface border border-line-subtle focus:border-line-gold p-3 text-sm text-ink-primary placeholder:text-ink-muted mb-3"
                  />

                  {liveProfanitySimulation ? (
                    <div
                      role="status"
                      className="rounded-xl bg-surface border border-line-gold p-3.5 text-xs"
                    >
                      {liveProfanitySimulation.flagged ? (
                        <div>
                          <p className="font-bold text-gold mb-1">
                            Hasil: DITAHAN KE MODERASI (PENDING_MODERATION)
                          </p>
                          <p className="text-ink-primary">
                            Kata terpicu:{" "}
                            <strong className="font-mono text-gold">
                              {liveProfanitySimulation.matchedWords.join(", ")}
                            </strong>
                          </p>
                        </div>
                      ) : (
                        <p className="font-bold text-ink-primary">
                          Hasil: LOLOS BERSIH (PUBLISHED) - Tidak ada kata
                          terlarang yang cocok.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-muted">
                      Masukkan teks di atas untuk melihat hasil evaluasi
                      langsung terhadap {bannedWords.length} kata di database.
                    </p>
                  )}
                </div>

                <form
                  onSubmit={handleAddBannedWord}
                  className="lg:col-span-6 rounded-[14px] bg-card border border-line-subtle p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <h2 className="font-serif text-xl font-bold text-ink-primary mb-1">
                      Tambah Kata / Frasa Terlarang Baru
                    </h2>
                    <p className="text-xs text-ink-secondary mb-4">
                      Mendukung kata tunggal maupun frasa ber-spasi.
                    </p>

                    <div className="flex flex-col gap-3.5">
                      <div>
                        <label
                          htmlFor="new-banned-word"
                          className="block text-xs font-semibold text-ink-primary mb-1"
                        >
                          Kata atau Frasa
                        </label>
                        <input
                          id="new-banned-word"
                          type="text"
                          required
                          value={newWord}
                          onChange={(e) => setNewWord(e.target.value)}
                          placeholder="Contoh: capok atau pukoe lempap"
                          className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor="new-word-lang"
                            className="block text-xs font-semibold text-ink-primary mb-1"
                          >
                            Bahasa
                          </label>
                          <select
                            id="new-word-lang"
                            value={newWordLang}
                            onChange={(e) =>
                              setNewWordLang(
                                e.target.value === "id" ? "id" : "aceh"
                              )
                            }
                            className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3 py-2 text-sm text-ink-primary"
                          >
                            <option value="aceh">Bahasa Aceh</option>
                            <option value="id">Bahasa Indonesia</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="new-word-match"
                            className="block text-xs font-semibold text-ink-primary mb-1"
                          >
                            Mode Pencocokan
                          </label>
                          <select
                            id="new-word-match"
                            value={newWordMatch}
                            onChange={(e) =>
                              setNewWordMatch(
                                e.target.value === "contains"
                                  ? "contains"
                                  : "exact"
                              )
                            }
                            className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3 py-2 text-sm text-ink-primary"
                          >
                            <option value="exact">
                              Exact (Batas Kata - Aman False Positive)
                            </option>
                            <option value="contains">
                              Contains (Sub-kalimat)
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full min-h-[46px] px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-brand-on text-xs sm:text-sm font-semibold border border-line-gold"
                  >
                    Simpan Kata ke Kamus Database
                  </button>
                </form>
              </div>

              <div className="rounded-[14px] bg-card border border-line-subtle p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-line-subtle">
                  <h2 className="font-serif text-xl font-bold text-ink-primary">
                    Daftar Kamus Aktif ({filteredDictionary.length} Kata)
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: "ALL", label: "Semua Bahasa" },
                        { id: "aceh", label: "Bahasa Aceh" },
                        { id: "id", label: "Bahasa Indonesia" },
                      ] as const
                    ).map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setDictLangFilter(b.id)}
                        aria-pressed={dictLangFilter === b.id}
                        className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                          dictLangFilter === b.id
                            ? "bg-brand text-brand-on border-line-gold"
                            : "bg-surface text-ink-secondary border-line-subtle hover:border-line-gold"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-line-subtle text-xs uppercase text-gold">
                        <th className="py-3 px-3">Kata / Frasa</th>
                        <th className="py-3 px-3">Bahasa</th>
                        <th className="py-3 px-3">Pencocokan</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-subtle text-xs sm:text-sm">
                      {filteredDictionary.map((row) => (
                        <tr key={row.id}>
                          <td className="py-3 px-3 font-mono font-bold text-ink-primary">
                            {row.word}
                          </td>
                          <td className="py-3 px-3 text-ink-secondary">
                            {row.language === "aceh"
                              ? "Bahasa Aceh"
                              : "Bahasa Indonesia"}
                          </td>
                          <td className="py-3 px-3 text-ink-secondary">
                            {row.match_type === "exact"
                              ? "Exact (Batas Kata)"
                              : "Contains"}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                                row.is_active
                                  ? "bg-surface text-gold border-line-gold"
                                  : "bg-surface text-ink-muted border-line-subtle"
                              }`}
                            >
                              {row.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  void handleToggleWord(row.id, row.is_active)
                                }
                                className="min-h-[44px] px-3 py-1.5 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs font-semibold text-ink-primary"
                              >
                                {row.is_active ? "Nonaktifkan" : "Aktifkan"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDeleteWord(row.id, row.word)
                                }
                                className="min-h-[44px] px-3 py-1.5 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs font-semibold text-gold"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {initialSection === "pengaturan" && (
            <section aria-labelledby="admin-pengaturan-heading">
              <div className="pb-5 mb-6 border-b border-line-subtle">
                <p className="text-xs uppercase tracking-wider text-gold font-semibold mb-1">
                  Layar Keputusan 3: Konfigurasi Acara &amp; Visual
                </p>
                <h1
                  id="admin-pengaturan-heading"
                  className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary"
                >
                  Pengaturan Resepsi Intat Linto Baro &amp; Galeri Foto
                </h1>
                <p className="text-xs sm:text-sm text-ink-secondary mt-1">
                  Perubahan yang Anda simpan di sini langsung memperbarui
                  tampilan halaman undangan publik tanpa menyentuh kode.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={handleSaveSettings}
                  className="lg:col-span-7 rounded-[14px] bg-card border border-line-gold p-5 sm:p-6 flex flex-col gap-4"
                >
                  <h2 className="font-serif text-xl font-bold text-ink-primary pb-2 border-b border-line-subtle">
                    Detail Jadwal Resepsi &amp; Tema Undangan
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="cfg-theme"
                        className="block text-xs font-semibold text-ink-primary mb-1"
                      >
                        Tema Visual Default
                      </label>
                      <select
                        id="cfg-theme"
                        value={themePreset}
                        onChange={(e) =>
                          setThemePreset(
                            e.target.value === "modern_elegan"
                              ? "modern_elegan"
                              : "klasik_megah"
                          )
                        }
                        className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3 py-2 text-sm text-ink-primary"
                      >
                        <option value="klasik_megah">
                          Klasik 1: Meuh &amp; Kasab (Kontras Tinggi)
                        </option>
                        <option value="modern_elegan">
                          Modern Elegan (Tombol Merah Marun)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="cfg-title"
                        className="block text-xs font-semibold text-ink-primary mb-1"
                      >
                        Judul Acara Utama
                      </label>
                      <input
                        id="cfg-title"
                        type="text"
                        required
                        value={scheduleTitle}
                        onChange={(e) => setScheduleTitle(e.target.value)}
                        className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3.5 py-2 text-sm text-ink-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="cfg-start"
                        className="block text-xs font-semibold text-ink-primary mb-1"
                      >
                        Jam Mulai (WIB)
                      </label>
                      <input
                        id="cfg-start"
                        type="text"
                        required
                        value={startTimeWib}
                        onChange={(e) => setStartTimeWib(e.target.value)}
                        className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3.5 py-2 text-sm text-ink-primary"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="cfg-end"
                        className="block text-xs font-semibold text-ink-primary mb-1"
                      >
                        Jam Selesai (WIB)
                      </label>
                      <input
                        id="cfg-end"
                        type="text"
                        required
                        value={endTimeWib}
                        onChange={(e) => setEndTimeWib(e.target.value)}
                        className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3.5 py-2 text-sm text-ink-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="cfg-venue"
                      className="block text-xs font-semibold text-ink-primary mb-1"
                    >
                      Nama Kediaman / Gedung Acara
                    </label>
                    <input
                      id="cfg-venue"
                      type="text"
                      required
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3.5 py-2 text-sm text-ink-primary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cfg-address"
                      className="block text-xs font-semibold text-ink-primary mb-1"
                    >
                      Alamat Lengkap Lokasi
                    </label>
                    <input
                      id="cfg-address"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3.5 py-2 text-sm text-ink-primary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cfg-maps"
                      className="block text-xs font-semibold text-ink-primary mb-1"
                    >
                      Tautan Google Maps Navigasi
                    </label>
                    <input
                      id="cfg-maps"
                      type="url"
                      required
                      value={googleMapsUrl}
                      onChange={(e) => setGoogleMapsUrl(e.target.value)}
                      className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3.5 py-2 text-sm text-ink-primary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cfg-verse"
                      className="block text-xs font-semibold text-ink-primary mb-1"
                    >
                      Kutipan Ayat Pembuka
                    </label>
                    <textarea
                      id="cfg-verse"
                      rows={2}
                      value={holyVerse}
                      onChange={(e) => setHolyVerse(e.target.value)}
                      className="w-full rounded-lg bg-surface border border-line-subtle focus:border-line-gold p-3 text-sm text-ink-primary"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cfg-post-msg"
                      className="block text-xs font-semibold text-ink-primary mb-1"
                    >
                      Pesan Terima Kasih Pasca Hari-H
                    </label>
                    <textarea
                      id="cfg-post-msg"
                      rows={2}
                      value={postEventMessage}
                      onChange={(e) => setPostEventMessage(e.target.value)}
                      className="w-full rounded-lg bg-surface border border-line-subtle focus:border-line-gold p-3 text-sm text-ink-primary"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <input
                      id="cfg-digital-gift"
                      type="checkbox"
                      checked={enableDigitalGift}
                      onChange={(e) => setEnableDigitalGift(e.target.checked)}
                      className="w-5 h-5 accent-gold"
                    />
                    <label
                      htmlFor="cfg-digital-gift"
                      className="text-xs sm:text-sm font-semibold text-ink-primary"
                    >
                      Tampilkan Seksi Amplop Digital &amp; Tanda Kasih di
                      Halaman Publik
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full min-h-[48px] px-5 py-3 rounded-lg bg-brand hover:bg-brand-hover text-brand-on text-sm font-semibold border border-line-gold mt-2"
                  >
                    Simpan Pengaturan Undangan
                  </button>
                </form>

                <div className="lg:col-span-5 rounded-[14px] bg-card border border-line-subtle p-5 sm:p-6 flex flex-col gap-5">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-ink-primary pb-2 border-b border-line-subtle mb-3">
                      Pengelola Galeri Foto ({galleryPhotos.length} Foto)
                    </h2>

                    <form
                      onSubmit={handleAddGalleryPhoto}
                      className="flex flex-col gap-3 mb-5"
                    >
                      <div>
                        <label
                          htmlFor="new-photo-url"
                          className="block text-xs font-semibold text-ink-primary mb-1"
                        >
                          Path atau URL Gambar
                        </label>
                        <input
                          id="new-photo-url"
                          type="text"
                          required
                          value={newPhotoUrl}
                          onChange={(e) => setNewPhotoUrl(e.target.value)}
                          placeholder="/images/gallery-01.svg"
                          className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3 py-2 text-xs sm:text-sm text-ink-primary"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="new-photo-caption"
                          className="block text-xs font-semibold text-ink-primary mb-1"
                        >
                          Judul / Keterangan Foto
                        </label>
                        <input
                          id="new-photo-caption"
                          type="text"
                          required
                          value={newPhotoCaption}
                          onChange={(e) => setNewPhotoCaption(e.target.value)}
                          placeholder="Contoh: Foto Pelaminan Intat Linto Baro"
                          className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3 py-2 text-xs sm:text-sm text-ink-primary placeholder:text-ink-muted"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-brand-on text-xs font-semibold border border-line-gold"
                      >
                        Tambahkan Foto ke Galeri
                      </button>
                    </form>

                    <div className="flex flex-col gap-2.5">
                      {galleryPhotos.map((photo) => (
                        <div
                          key={photo.id}
                          className="rounded-xl bg-surface border border-line-subtle p-3 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-ink-primary truncate">
                              {photo.caption}
                            </p>
                            <p className="text-[11px] font-mono text-ink-muted truncate">
                              {photo.storage_key}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteGalleryPhoto(photo.id)
                            }
                            className="min-h-[44px] px-3 py-1.5 rounded-lg bg-card border border-line-subtle hover:border-line-gold text-xs font-semibold text-gold shrink-0"
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {initialSection === "unduh" && (
            <section aria-labelledby="admin-unduh-heading">
              <div className="pb-5 mb-6 border-b border-line-subtle">
                <p className="text-xs uppercase tracking-wider text-gold font-semibold mb-1">
                  Layar Keputusan 4: Ekspor Arsip Kenang-Kenangan
                </p>
                <h1
                  id="admin-unduh-heading"
                  className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary"
                >
                  Unduh Doa Teks (.csv) &amp; Video Ucapan
                </h1>
                <p className="text-xs sm:text-sm text-ink-secondary mt-1">
                  Pilih ucapan tertentu menggunakan kotak centang atau langsung
                  unduh seluruh arsip kenang-kenangan pernikahan Anda.
                </p>
              </div>

              <div className="rounded-[14px] bg-card border border-line-gold p-5 mb-6 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm font-semibold text-ink-primary">
                    Terpilih:{" "}
                    <span className="text-gold font-mono">
                      {selectedWishIds.length}
                    </span>{" "}
                    dari {wishes.length} ucapan
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedWishIds(wishes.map((w) => w.id))
                      }
                      className="min-h-[44px] px-3.5 py-2 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs font-semibold text-ink-primary"
                    >
                      Pilih Semua ({wishes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedWishIds([])}
                      className="min-h-[44px] px-3.5 py-2 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs font-semibold text-ink-secondary"
                    >
                      Bersihkan Pilihan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-line-subtle">
                  <button
                    type="button"
                    disabled={selectedWishIds.length === 0}
                    onClick={() =>
                      exportCsvForWishes(
                        wishes.filter((w) => selectedWishIds.includes(w.id)),
                        "ucapan-terpilih-intat-linto.csv"
                      )
                    }
                    className="min-h-[46px] px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-hover disabled:opacity-50 text-brand-on text-xs font-semibold border border-line-gold"
                  >
                    Unduh Terpilih (.csv)
                  </button>

                  <button
                    type="button"
                    disabled={wishes.length === 0}
                    onClick={() =>
                      exportCsvForWishes(
                        wishes,
                        "semua-ucapan-intat-linto.csv"
                      )
                    }
                    className="min-h-[46px] px-4 py-2.5 rounded-lg bg-surface hover:border-line-gold disabled:opacity-50 text-ink-primary text-xs font-semibold border border-line-subtle"
                  >
                    Unduh Semua Ucapan (.csv)
                  </button>

                  <button
                    type="button"
                    disabled={selectedWishIds.length === 0}
                    onClick={() =>
                      void downloadVideosSequentially(
                        wishes.filter((w) => selectedWishIds.includes(w.id))
                      )
                    }
                    className="min-h-[46px] px-4 py-2.5 rounded-lg bg-surface hover:border-line-gold disabled:opacity-50 text-gold text-xs font-semibold border border-line-gold"
                  >
                    Unduh Video Terpilih
                  </button>

                  <button
                    type="button"
                    disabled={
                      wishes.filter((w) => w.type === "VIDEO").length === 0
                    }
                    onClick={() => void downloadVideosSequentially(wishes)}
                    className="min-h-[46px] px-4 py-2.5 rounded-lg bg-surface hover:border-line-gold disabled:opacity-50 text-gold text-xs font-semibold border border-line-subtle"
                  >
                    Unduh Semua Video (
                    {wishes.filter((w) => w.type === "VIDEO").length})
                  </button>
                </div>

                {downloadStatus && (
                  <p
                    role="status"
                    aria-live="polite"
                    className="text-xs font-semibold text-gold pt-1"
                  >
                    {downloadStatus}
                  </p>
                )}
              </div>

              <div className="rounded-[14px] bg-card border border-line-subtle p-5">
                {wishes.length === 0 ? (
                  <p className="text-xs sm:text-sm text-ink-secondary text-center py-6">
                    Belum ada arsip ucapan yang tersimpan di database untuk
                    diunduh.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {wishes.map((w) => {
                      const checked = selectedWishIds.includes(w.id);
                      return (
                        <label
                          key={w.id}
                          htmlFor={`chk-${w.id}`}
                          className={`rounded-xl p-3.5 border flex items-start gap-3 transition-colors ${
                            checked
                              ? "bg-surface border-line-gold"
                              : "bg-surface/60 border-line-subtle"
                          }`}
                        >
                          <input
                            id={`chk-${w.id}`}
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedWishIds((prev) => [...prev, w.id]);
                              } else {
                                setSelectedWishIds((prev) =>
                                  prev.filter((id) => id !== w.id)
                                );
                              }
                            }}
                            className="w-5 h-5 mt-0.5 accent-gold shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-bold text-ink-primary">
                                {w.senderName}{" "}
                                {w.senderRelation
                                  ? `(${w.senderRelation})`
                                  : ""}
                              </span>
                              <span className="text-xs font-mono text-gold">
                                {w.type} &bull; {w.status}
                              </span>
                            </div>
                            <p className="text-xs text-ink-secondary mt-1 truncate">
                              {w.type === "TEXT"
                                ? w.textContent
                                : `Berkas Video: ${
                                    w.videoFileName ?? w.videoR2Key
                                  } (${w.videoDurationSec ?? 15} dtk)`}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </AdminShell>
  );
}
