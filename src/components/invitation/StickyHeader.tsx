"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import type { ThemePreset } from "@/config/wedding.config";

interface StickyHeaderProps {
  coupleShortTitle: string;
  eventTitle: string;
  theme: ThemePreset;
  onToggleTheme: () => void;
  showDigitalGift: boolean;
}

interface NavItem {
  href: string;
  label: string;
}

export function StickyHeader({
  coupleShortTitle,
  eventTitle,
  theme,
  onToggleTheme,
  showDigitalGift,
}: StickyHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  const navItems: NavItem[] = [
    { href: "#sambutan", label: "Sambutan" },
    { href: "#mempelai", label: "Mempelai" },
    { href: "#acara", label: "Intat Linto" },
    { href: "#galeri", label: "Galeri" },
    ...(showDigitalGift ? [{ href: "#tanda-kasih", label: "Tanda Kasih" }] : []),
    { href: "#ucapan", label: "Kirim Ucapan" },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    firstMenuLinkRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuTriggerRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    menuTriggerRef.current?.focus();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/95 backdrop-blur-md border-b border-line-subtle">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <a
          href="#sampul"
          className="flex items-center gap-2 text-ink-primary hover:text-gold transition-colors min-h-[44px] px-1"
        >
          <span className="font-serif font-bold text-lg tracking-wide">
            {coupleShortTitle}
          </span>
          <span className="hidden sm:inline-block text-xs text-gold border border-line-gold rounded px-2 py-0.5 font-medium">
            {eventTitle}
          </span>
        </a>

        <nav
          aria-label="Navigasi seksi undangan"
          className="hidden lg:flex items-center gap-1"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="min-h-[44px] px-3 inline-flex items-center text-xs font-medium text-ink-secondary hover:text-gold active:scale-[0.98] transition-all rounded-md"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === "klasik_megah"
                ? "Ganti ke tema Modern Elegan"
                : "Ganti ke tema Klasik Meuh dan Kasab"
            }
            className="min-h-[44px] px-3 rounded-lg bg-card border border-line-subtle hover:border-line-gold active:scale-[0.98] text-xs font-semibold text-ink-primary inline-flex items-center gap-1.5 transition-all"
          >
            <span
              className="w-2.5 h-2.5 rounded-full bg-gold shrink-0"
              aria-hidden="true"
            />
            <span>
              {theme === "klasik_megah" ? "Tema: Klasik" : "Tema: Modern"}
            </span>
          </button>

          <button
            ref={menuTriggerRef}
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-sheet"
            className="lg:hidden min-h-[44px] min-w-[44px] px-3 rounded-lg bg-card border border-line-subtle hover:border-line-gold active:scale-[0.98] text-xs font-semibold text-ink-primary inline-flex items-center gap-1.5 transition-all"
          >
            <svg
              className="w-4 h-4 text-gold"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h16M4 12h16M4 17h16"
                />
              )}
            </svg>
            <span>Menu</span>
          </button>
        </div>
      </div>

      <div
        className="w-full h-0.5 bg-line-subtle overflow-hidden"
        aria-hidden="true"
      >
        {prefersReducedMotion ? (
          <div className="h-full w-full bg-gold opacity-40" />
        ) : (
          <motion.div
            className="h-full bg-gold origin-left"
            style={{ scaleX }}
          />
        )}
      </div>

      {menuOpen && (
        <div
          id="mobile-nav-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi seksi undangan"
          className="lg:hidden border-b border-line-gold bg-card px-4 py-4 shadow-xl"
        >
          <div className="max-w-xl mx-auto flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2 border-b border-line-subtle">
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                Lompat ke Bagian Undangan
              </span>
              <button
                type="button"
                onClick={closeMenu}
                className="min-h-[44px] px-3 rounded-md text-xs font-semibold text-ink-secondary hover:text-ink-primary border border-line-subtle"
              >
                Tutup (Esc)
              </button>
            </div>
            <nav
              aria-label="Menu navigasi mobile"
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1"
            >
              {navItems.map((item, idx) => (
                <a
                  key={item.href}
                  ref={idx === 0 ? firstMenuLinkRef : undefined}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-surface border border-line-subtle hover:border-line-gold active:bg-card text-sm font-medium text-ink-primary flex items-center justify-between transition-colors"
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-gold font-semibold">Buka</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
