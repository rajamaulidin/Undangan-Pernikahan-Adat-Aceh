"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { BungongJeumpaEmblem } from "@/components/ornaments/AcehMotifs";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage("Email dan kata sandi wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setErrorMessage(
          `Gagal masuk: ${error.message}. Pastikan email dan kata sandi sesuai akun Supabase Auth.`
        );
        return;
      }

      router.push("/admin");
    } catch {
      setErrorMessage(
        "Terjadi gangguan jaringan saat menghubungi server autentikasi Supabase."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillDefaultAdmin = () => {
    setEmail("admin@undangan-aceh.id");
    setPassword("IntatLinto2026!");
    setErrorMessage(null);
  };

  return (
    <main className="min-h-[100dvh] bg-page text-ink-primary flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full rounded-[16px] bg-card border-2 border-line-gold p-6 sm:p-8 shadow-xl">
        <div className="text-center mb-6">
          <BungongJeumpaEmblem className="w-10 h-10 mx-auto mb-3 text-gold" />
          <p className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-1">
            Ruang Kerja Privat Mempelai
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-primary">
            Masuk Dashboard Admin
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1">
            Khusus mempelai untuk membaca doa tamu, memutar video ucapan, dan
            mengelola undangan Resepsi Intat Linto Baro.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl bg-surface border-2 border-line-gold p-4 mb-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">
              Autentikasi Gagal
            </p>
            <p className="text-xs sm:text-sm text-ink-primary">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSignIn} noValidate className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs sm:text-sm font-semibold text-ink-primary mb-1.5"
            >
              Alamat Email Admin
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@undangan-aceh.id"
              className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs sm:text-sm font-semibold text-ink-primary mb-1.5"
            >
              Kata Sandi
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi admin"
              className="w-full min-h-[44px] rounded-lg bg-surface border border-line-subtle focus:border-line-gold px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] px-5 py-3 rounded-lg bg-brand hover:bg-brand-hover active:scale-[0.99] disabled:opacity-60 text-brand-on text-sm font-semibold border border-line-gold transition-all mt-1"
          >
            {loading ? "Memverifikasi Sesi Supabase..." : "Masuk ke Dashboard"}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-line-subtle flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleFillDefaultAdmin}
            className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs font-semibold text-gold"
          >
            Isi Akun Demo Admin (admin@undangan-aceh.id)
          </button>

          <Link
            href="/"
            className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-surface border border-line-subtle hover:border-line-gold text-xs font-semibold text-ink-secondary flex items-center justify-center"
          >
            Kembali ke Halaman Undangan Publik
          </Link>
        </div>
      </div>
    </main>
  );
}
