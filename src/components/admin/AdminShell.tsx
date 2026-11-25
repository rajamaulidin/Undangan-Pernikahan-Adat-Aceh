"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

export type AdminSectionId = "moderasi" | "filter" | "pengaturan" | "unduh";

interface AdminShellProps {
  activeSection: AdminSectionId;
  adminEmail: string;
  pendingCount: number;
  onSignOut: () => void;
  children: React.ReactNode;
}

interface NavGroup {
  groupLabel: string;
  items: {
    id: AdminSectionId;
    href: string;
    label: string;
    shortBadge: string;
    badgeCount?: number;
  }[];
}

export function AdminShell({
  activeSection,
  adminEmail,
  pendingCount,
  onSignOut,
  children,
}: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileCloseRef = useRef<HTMLButtonElement | null>(null);

  const navGroups: NavGroup[] = [
    {
      groupLabel: "Ucapan & Moderasi",
      items: [
        {
          id: "moderasi",
          href: "/admin",
          label: "Moderasi & Video Tamu",
          shortBadge: "MOD",
          badgeCount: pendingCount > 0 ? pendingCount : undefined,
        },
        {
          id: "filter",
          href: "/admin/filter",
          label: "Kamus Kata Kasar",
          shortBadge: "FIL",
        },
        {
          id: "unduh",
          href: "/admin/unduh",
          label: "Unduh Arsip Ucapan",
          shortBadge: "UND",
        },
      ],
    },
    {
      groupLabel: "Pengaturan Undangan",
      items: [
        {
          id: "pengaturan",
          href: "/admin/pengaturan",
          label: "Acara, Tema & Galeri",
          shortBadge: "SET",
        },
      ],
    },
  ];

  useEffect(() => {
    if (!mobileOpen) return;
    mobileCloseRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        mobileTriggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const closeMobileDrawer = () => {
    setMobileOpen(false);
    mobileTriggerRef.current?.focus();
  };

  return (
    <div className="min-h-[100dvh] bg-page text-ink-primary flex flex-col lg:flex-row">
      <header className="lg:hidden sticky top-0 z-40 bg-surface border-b border-line-subtle px-4 py-2.5 min-h-[64px] flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gold font-semibold">
            Panel Privat Mempelai
          </p>
          <p className="font-serif text-lg font-bold text-ink-primary leading-tight">
            Resepsi Intat Linto Baro
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="min-h-[44px] px-3 rounded-lg bg-card border border-line-subtle hover:border-line-gold text-xs font-semibold text-ink-secondary inline-flex items-center"
          >
            Lihat Web
          </Link>
          <button
            ref={mobileTriggerRef}
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-expanded={mobileOpen}
            aria-controls="admin-mobile-drawer"
            className="min-h-[44px] px-3.5 rounded-lg bg-brand text-brand-on border border-line-gold text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <span>Menu Admin</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-page text-gold font-mono text-[11px]">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div
          id="admin-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi Dashboard Admin"
          className="lg:hidden fixed inset-0 z-50 bg-page/90 backdrop-blur-md flex flex-col justify-between p-5"
        >
          <div className="rounded-[16px] bg-card border-2 border-line-gold p-5 flex flex-col gap-5 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line-subtle">
              <div>
                <p className="text-xs uppercase tracking-wider text-gold font-semibold">
                  Navigasi Ruang Kerja
                </p>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Masuk sebagai: {adminEmail}
                </p>
              </div>
              <button
                ref={mobileCloseRef}
                type="button"
                onClick={closeMobileDrawer}
                className="min-h-[44px] px-3 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs font-semibold text-ink-primary"
              >
                Tutup (Esc)
              </button>
            </div>

            <nav aria-label="Navigasi admin mobile" className="flex flex-col gap-4">
              {navGroups.map((group) => (
                <div key={group.groupLabel} className="flex flex-col gap-1.5">
                  <p className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold px-2">
                    {group.groupLabel}
                  </p>
                  {group.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={`min-h-[46px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          isActive
                            ? "bg-brand text-brand-on border-line-gold font-bold"
                            : "bg-surface text-ink-primary border-line-subtle hover:border-line-gold font-medium"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 text-sm">
                          <span
                            className={`w-1.5 h-5 rounded-full ${
                              isActive ? "bg-gold" : "bg-transparent"
                            }`}
                            aria-hidden="true"
                          />
                          <span>{item.label}</span>
                        </span>
                        {item.badgeCount !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-page text-gold font-mono text-xs font-bold border border-line-gold">
                            {item.badgeCount} tertahan
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="pt-3 border-t border-line-subtle flex items-center justify-between gap-3">
              <Link
                href="/"
                className="min-h-[44px] px-4 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs font-semibold text-ink-primary inline-flex items-center"
              >
                Buka Halaman Tamu
              </Link>
              <button
                type="button"
                onClick={onSignOut}
                className="min-h-[44px] px-4 rounded-lg bg-surface border border-line-gold text-xs font-semibold text-gold hover:bg-page"
              >
                Keluar Sesi Admin
              </button>
            </div>
          </div>
        </div>
      )}

      <aside
        aria-label="Navigasi samping Dashboard Admin"
        className={`hidden lg:flex flex-col justify-between shrink-0 bg-surface border-r border-line-subtle transition-all ${
          collapsed ? "w-24" : "w-72"
        }`}
      >
        <div className="p-4 flex flex-col gap-6">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-line-subtle">
            {!collapsed && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gold font-semibold">
                  Panel Privat Mempelai
                </p>
                <p className="font-serif text-xl font-bold text-ink-primary">
                  Intat Linto Baro
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-expanded={!collapsed}
              aria-label={
                collapsed
                  ? "Perluas bilah navigasi samping"
                  : "Ciutkan bilah navigasi samping"
              }
              className="min-h-[44px] min-w-[44px] px-2.5 rounded-lg bg-card border border-line-subtle hover:border-line-gold text-xs font-semibold text-ink-primary flex items-center justify-center"
            >
              {collapsed ? ">>" : "<<"}
            </button>
          </div>

          <nav aria-label="Menu utama Dashboard Admin" className="flex flex-col gap-5">
            {navGroups.map((group) => (
              <div key={group.groupLabel} className="flex flex-col gap-1.5">
                {!collapsed && (
                  <p className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold px-2.5">
                    {group.groupLabel}
                  </p>
                )}
                {group.items.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      title={collapsed ? item.label : undefined}
                      className={`min-h-[46px] px-3 py-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isActive
                          ? "bg-brand text-brand-on border-line-gold font-bold shadow-sm"
                          : "bg-card text-ink-primary border-line-subtle hover:border-line-gold font-medium"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {/* Shape + weight + color active indicator that survives icon-only collapse */}
                        <span
                          className={`w-1.5 h-5 rounded-full shrink-0 ${
                            isActive ? "bg-gold" : "bg-line-subtle"
                          }`}
                          aria-hidden="true"
                        />
                        {collapsed ? (
                          <span className="text-xs font-mono font-bold tracking-tight">
                            {item.shortBadge}
                          </span>
                        ) : (
                          <span className="text-xs sm:text-sm">{item.label}</span>
                        )}
                      </span>

                      {!collapsed && item.badgeCount !== undefined && (
                        <span className="px-2 py-0.5 rounded bg-page text-gold font-mono text-xs font-bold border border-line-gold">
                          {item.badgeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-line-subtle flex flex-col gap-2.5">
          {!collapsed && (
            <div className="px-2 py-1">
              <p className="text-[11px] text-ink-muted">Akun Mempelai Aktif:</p>
              <p className="text-xs font-semibold text-ink-primary truncate">
                {adminEmail}
              </p>
            </div>
          )}

          <Link
            href="/"
            aria-label="Buka halaman undangan publik"
            className="min-h-[44px] px-3 rounded-lg bg-card border border-line-subtle hover:border-line-gold text-xs font-semibold text-ink-primary flex items-center justify-center"
          >
            {collapsed ? "WEB" : "Lihat Halaman Undangan"}
          </Link>

          <button
            type="button"
            onClick={onSignOut}
            aria-label="Keluar dari Dashboard Admin"
            className="min-h-[44px] px-3 rounded-lg bg-card border border-line-gold hover:bg-page text-xs font-semibold text-gold flex items-center justify-center"
          >
            {collapsed ? "OUT" : "Keluar Sesi Admin"}
          </button>
        </div>
      </aside>

      <main id="admin-main" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
