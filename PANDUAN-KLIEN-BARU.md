# Panduan Kustomisasi Template untuk Klien Baru

Dokumen ini menjelaskan langkah menyiapkan proyek undangan pernikahan adat Aceh (*Resepsi Intat Linto Baro*) untuk klien baru dalam waktu kurang dari satu jam.

## 1. Salin Proyek dan Pasang Paket

Salin folder proyek ini untuk klien baru, lalu jalankan instalasi paket di terminal:

```powershell
npm.cmd install
```

Buat berkas `.env.local` dari `.env.example` dan isi empat variabel berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
IP_HASH_SALT=isi-teks-acak-unik-per-klien
```

## 2. Siapkan Database dan Bucket Supabase Klien

1. Buat proyek baru di Supabase (wilayah Southeast Asia / Singapore).
2. Buka **SQL Editor** di dashboard Supabase, tempel seluruh isi berkas `supabase/migrations/20261125021500_initial_schema.sql`, lalu klik **Run**. Skrip ini membuat lima tabel (`site_settings`, `event_schedule`, `gallery_photos`, `wishes`, `banned_words`), mengaktifkan kebijakan Row Level Security (RLS), dan mengisi 22 kosakata filter Bahasa Indonesia serta Bahasa Aceh.
3. Buka menu **Storage**, buat satu bucket privat bernama `wishes-media` (`Public bucket: off`, batas ukuran berkas `50 MB`).
4. Buka menu **Authentication > Users > Add user > Create new user**, lalu masukkan alamat email dan kata sandi untuk kedua mempelai. Mereka akan memakai akun ini saat masuk ke `/admin/login`.

## 3. Ubah Data Mempelai, Rekening, dan Lagu di Kode

Buka berkas `src/config/wedding.config.ts` untuk mengganti data statis mempelai:

- **`isTemplateDemo`**: Ubah dari `true` menjadi `false` agar penanda `"Mode Pratinjau Template Portofolio Adat Aceh"` di bagian atas layar sampul tidak lagi ditampilkan.
- **`themePreset`**: Pilih `"klasik_megah"` (latar hitam obsidian `#070606`, teks putih `#FFFFFF`, aksen emas `#F5C842`, tombol merah marun `#8F161C`) atau `"modern_elegan"` (latar gading `#FAF7F2` dengan tombol merah marun `#8F161C`).
- **`couple.bride` dan `couple.groom`**: Ganti `fullName`, `nickname`, `fatherName`, dan `motherName`.
- **`receptionSchedule`**: Ganti `dateDisplay`, `dayName`, `dayNumber`, `monthYearDisplay`, `startTimeIso`, `endTimeIso`, `timeRangeWib`, `venueName`, `address`, `city`, `googleMapsUrl`, dan `mapsEmbedUrl`.
- **`digitalGift`**: Ubah `enabled` menjadi `true` atau `false`, lalu isi daftar rekening bank mempelai pada array `accounts`.

## 4. Ganti Foto Mempelai, Galeri, dan Musik Latar

Letakkan berkas media asli milik klien di dalam folder `public/`:

- **Foto Sampul & Potret Mempelai**: Simpan foto mempelai di `public/images/` (misalnya `public/images/sampul-klien.jpg`, `dara-baro.jpg`, `linto-baro.jpg`), lalu perbarui `heroImageSrc` dan `portraitSrc` di `src/config/wedding.config.ts`.
- **Foto Galeri**: Simpan foto galeri di `public/images/`, lalu perbarui daftarnya lewat `src/config/wedding.config.ts` atau langsung melalui halaman `/admin/pengaturan` setelah aplikasi berjalan.
- **Musik Latar**: Berkas `public/audio/ranup-lampuan.mp3` sudah langsung terpasang pada volume normal 100% mengikuti volume perangkat tamu. Jika klien meminta instrumen Aceh lain, timpa berkas tersebut atau ubah `audioTrack.sourceUrl` di `src/config/wedding.config.ts`.

## 5. Kelola Acara dan Unduh Ucapan Lewat Dashboard Admin

Setelah situs di-deploy ke Vercel:

- **Halaman Tamu**: `https://domain-klien.com/`
- **Login Mempelai**: `https://domain-klien.com/admin/login`
- **Moderasi & Video Tamu (`/admin`)**: Mempelai membaca seluruh doa teks dan memutar video ucapan tamu secara privat. Ucapan teks yang terdeteksi mengandung kata kasar otomatis masuk ke bagian paling atas dengan status `PENDING_MODERATION`.
- **Kamus Kata Kasar (`/admin/filter`)**: Mempelai dapat menguji kalimat dan menambah kata terlarang Bahasa Aceh atau Bahasa Indonesia baru kapan saja.
- **Pengaturan Acara & Galeri (`/admin/pengaturan`)**: Mempelai dapat mengubah jam resepsi, alamat gedung, tautan Google Maps, kutipan ayat, pesan pasca hari-H, tema, dan foto galeri tanpa menyentuh kode.
- **Unduh Arsip (`/admin/unduh`)**: Setelah acara selesai, mempelai dapat mengunduh seluruh doa teks dalam format `.csv` (siap dibuka di Microsoft Excel) serta mengunduh berkas video ucapan pilihan maupun semua.

## 6. Periksa Sebelum Rilis ke Klien

Jalankan tiga perintah ini di terminal sebelum menyerahkan domain ke klien:

```powershell
npm.cmd run test
npx.cmd tsc --noEmit
npm.cmd run build
```

Pastikan ketiganya lulus tanpa error.
