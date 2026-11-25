# DESIGN.md: Template Website Undangan Pernikahan Adat Aceh

## 1. Design Read & Three Dials

> Reading this as: undangan pernikahan digital adat Aceh bertema Resepsi Intat Linto Baro untuk tamu keluarga dan kerabat via mobile WhatsApp, dengan bahasa visual editorial seremonial Meuh & Kasab, dial `ENERGY 2 / RHYTHM 3 / MOTION 2`.

| Dial | Nilai | Arti dalam Proyek Ini |
| :--- | :--- | :--- |
| **ENERGY** | **2 (Balanced Ceremonial)** | Wibawa adat Aceh yang hangat dan berkelas: kontras tipografi serif seremonial terhadap bidang obsidian pekat dan aksen benang emas kasab, tanpa efek pendar neon atau dekorasi berlebihan. |
| **RHYTHM** | **3 (Varied Editorial)** | Setiap seksi memiliki struktur komposisi yang berbeda sesuai fungsi kontennya: layar sambutan penuh berbingkai kasab, kutipan pembuka terpusat, profil mempelai asimetris, kartu agung jadwal tunggal Intat Linto Baro berdampingan dengan peta dan hitung mundur, galeri foto rasio editorial bertingkat, serta modul pengiriman doa privat bertab. |
| **MOTION** | **2 (Scroll-Reveal & Subtle Progress)** | Gerak hanya hadir untuk menuntun pembacaan saat tamu menggulir layar (*scroll-reveal* sekali jalan dan garis progres vertikal bermotif Pinto Aceh). Nol animasi *loop* tanpa henti, dan seluruh gerak non-esensial berhenti otomatis pada `prefers-reduced-motion: reduce`. |

---

## 2. Five Liveliness Levers

1. **One focal point per screen**:
   - Layar Pembuka: Nama kedua mempelai dan tombol utama `"Buka Undangan"`.
   - Seksi Mempelai: Kartu profil *Dara Baro* dan *Linto Baro* beserta silsilah orang tua.
   - Seksi Acara: Kartu jadwal tunggal **Resepsi Intat Linto Baro** beserta penunjuk waktu hitung mundur.
   - Seksi Galeri: Bingkai foto utama berukuran editorial yang dapat dibuka ke dalam Lightbox.
   - Seksi Ucapan Privat: Form tab kirim doa teks atau video ucapan dengan penanda privasi mempelai.
2. **Hierarchical contrast**:
   - Perbedaan tegas antara huruf *display serif* (*Cormorant Garamond*) untuk nama mempelai dan tajuk adat terhadap huruf *humanist sans* (*Plus Jakarta Sans*) untuk jam acara, alamat lokasi, dan kolom input formulir.
3. **Whitespace as structure**:
   - Jeda vertikal antarseksi divariasikan secara struktural menggunakan skala ruang yang menyusut proporsional di layar ponsel dan meluas di layar tablet serta desktop.
4. **One deliberate accent**:
   - Warna emas Aceh (*Meuh Kasab* `#D4AF37` pada tema Klasik, *Burnished Gold* `#7C5A1E` / `#C5A059` pada tema Modern) hanya digunakan pada garis motif *Pinto Aceh*, penanda status aktif, dan angka hitung mundur utama.
5. **Identity motif**:
   - Ornamen garis tipis vektor **Pinto Aceh** dan kelopak **Bungong Jeumpa** menjadi motif identitas berulang pada bingkai sambutan, pembatas seksi, serta penunjuk progres gulir.

---

## 3. Sistem Palet Warna & Verifikasi Kontras WCAG AA (R-25, R-29, R-34)

Setiap tema dibatasi pada 2 warna inti + 1 aksen di luar warna dasar netral, dan seluruh pasangan teks terhadap latar wajib melampaui rasio kontras WCAG AA (minimal **4.5:1** untuk teks normal, **3:1** untuk teks besar >= 18px).

### Tema Utama: Klasik 1 - Meuh & Kasab (`klasik_megah` - Kontras Tinggi)
Terinspirasi dari sulaman benang emas (*kasab*) cerah di atas kain beludru hitam pekat dan merah marun terang pakaian adat *Dara Baro & Linto Baro*.

| Token CSS | Hex | Peruntukan | Rasio Kontras & Status WCAG |
| :--- | :--- | :--- | :--- |
| `--bg-page` | `#070606` | Latar dasar halaman (*Deep Pitch Obsidian*) | Dasar referensi |
| `--bg-surface` | `#12100E` | Permukaan seksi sekunder (*Dark Obsidian*) | Dasar permukaan |
| `--bg-card` | `#1D1916` | Permukaan kartu konten & form | Dasar kartu |
| `--text-primary` | `#FFFFFF` | Teks utama (*Crisp Pure White*) | **20.1:1** di atas `#070606`, **17.4:1** di atas `#1D1916` (Lolos AAA) |
| `--text-secondary` | `#EBE3D8` | Teks sekunder & keterangan | **16.2:1** di atas `#070606`, **14.0:1** di atas `#1D1916` (Lolos AAA) |
| `--text-muted` | `#CFC4B4` | Keterangan tambahan & penghitung karakter | **11.8:1** di atas `#070606`, **10.2:1** di atas `#1D1916` (Lolos AAA) |
| `--brand-primary` | `#8F161C` | Warna tombol utama & lencana acara (*Vibrant Royal Maroon*) | **7.6:1** dengan teks `#FFFFFF` (Lolos AAA) |
| `--brand-primary-hover` | `#AB1C24` | Warna tombol utama saat hover/aktif | **6.1:1** dengan teks `#FFFFFF` (Lolos AA/AAA) |
| `--accent-gold` | `#F5C842` | Teks aksen & garis motif Pinto Aceh (*Luminous Meuh Kasab*) | **13.1:1** di atas `#070606`, **11.3:1** di atas `#1D1916` (Lolos AAA) |
| `--border-subtle` | `#4F4234` | Garis tepi kartu & pemisah bidang kontras tegas | Non-teks struktural |
| `--border-gold` | `#D4A72C` | Garis tepi aksen kartu utama emas terang | Non-teks struktural |

### Tema Pendamping: Modern Elegan (`modern_elegan`)
Disertakan sebagai opsi tema terang gading yang tetap menggunakan **warna tombol utama merah marun yang sama dengan tema Klasik (`#8F161C`)** sesuai keputusan pemilik produk.

| Token CSS | Hex | Peruntukan | Rasio Kontras & Status WCAG |
| :--- | :--- | :--- | :--- |
| `--bg-page` | `#FAF7F2` | Latar dasar halaman (*Warm Ivory*) | Dasar referensi |
| `--bg-surface` | `#F2ECE1` | Permukaan seksi sekunder (*Soft Sand*) | Dasar permukaan |
| `--bg-card` | `#FFFFFF` | Permukaan kartu konten & form | Dasar kartu |
| `--text-primary` | `#1B221F` | Teks utama (*Deep Charcoal*) | **14.9:1** di atas `#FAF7F2` (Lolos AAA) |
| `--text-secondary` | `#353D39` | Teks sekunder & keterangan | **10.2:1** di atas `#FAF7F2` (Lolos AAA) |
| `--text-muted` | `#525C56` | Keterangan tambahan & penghitung karakter | **6.4:1** di atas `#FAF7F2` (Lolos AA) |
| `--brand-primary` | `#8F161C` | Warna tombol utama mengikuti tema Klasik (*Vibrant Royal Maroon*) | **7.6:1** dengan teks `#FFFFFF` (Lolos AAA) |
| `--brand-primary-hover` | `#AB1C24` | Warna tombol utama saat hover/aktif | **6.1:1** dengan teks `#FFFFFF` (Lolos AA/AAA) |
| `--accent-gold` | `#7A5618` | Teks aksen emas perunggu di atas latar terang | **6.1:1** di atas `#FAF7F2` (Lolos AA) |
| `--border-subtle` | `#D5C9B8` | Garis tepi kartu & pemisah bidang | Non-teks struktural |
| `--border-gold` | `#B89446` | Garis tepi aksen kartu utama | Non-teks struktural |

---

## 4. Tipografi & Skala Fluida (`antislop-layoutmobile`)

- **Display & Heading (`--font-serif`)**: *Cormorant Garamond* (bobot 500, 600, 700, italic). Digunakan untuk nama mempelai, judul seksi adat, dan kutipan ayat agar menghadirkan nuansa naskah seremonial Aceh.
- **Body & UI Controls (`--font-sans`)**: *Plus Jakarta Sans* (bobot 400, 500, 600, 700). Digunakan untuk tanggal, waktu, alamat, navigasi, label formulir, dan tombol aksi agar angka dan petunjuk lokasi tajam di layar ponsel.
- **Skala Tipografi Fluida (`clamp()`)**:
  - Nama Mempelai Hero (`h1`): `clamp(2.25rem, 5vw + 1rem, 4.25rem)`, line-height `1.1`.
  - Judul Seksi (`h2`): `clamp(1.75rem, 3vw + 0.85rem, 2.75rem)`, line-height `1.2`.
  - Subjudul Kartu / Nama Lengkap (`h3`): `clamp(1.35rem, 2vw + 0.75rem, 1.85rem)`, line-height `1.25`.
  - Teks Tubuh (`body`): `clamp(0.9375rem, 0.4vw + 0.85rem, 1.0625rem)`, line-height `1.65`.

---

## 5. Strategi Reflow 3-Tahap Lintas Layar (`antislop-layoutmobile`)

Tata letak dirancang dengan tiga kondisi reflow nyata berdasarkan titik patah konten (bukan sekadar menyempitkan tampilan desktop):

1. **Kondisi Ponsel (`< 640px`)**:
   - Komposisi satu kolom penuh dengan padding seksi terukur (`py-12 px-5`), tinggi hero menggunakan `min-h-[100dvh]` agar presisi terhadap bilah alamat peramban mobile.
   - Navigasi atas ringkas (`56px`) dengan tombol berlabel `"Menu"` (`>= 44x44px`) yang membuka lembar navigasi (*bottom/top sheet*) berdukungan tombol `Escape`.
   - Bilah kontrol audio `"Ranup Lampuan"` diposisikan aman dan ruang bawah halaman (`pb-28`) dicadangkan agar tidak ada tombol atau teks penutup yang tertutup.
2. **Kondisi Tablet & Layar Menengah (`640px - 1023px`)**:
   - Profil *Dara Baro* dan *Linto Baro* bertransisi menjadi grid 2 kolom sejajar yang seimbang.
   - Kotak hitung mundur dan tombol aksi kalender/peta tersusun berdampingan dalam 2 kolom proporsional.
   - Galeri foto menyusun ulang kartu ke dalam grid 2 kolom berirama dengan foto utama membentang penuh (`col-span-2`).
3. **Kondisi Desktop (`>= 1024px`)**:
   - Kontainer editorial terpusat (`max-w-5xl`) dengan komposisi asimetris: pada Seksi Acara, kartu utama **Resepsi Intat Linto Baro** dan hitung mundur berada di kolom kiri (`7/12`), sedangkan peta interaktif Google Maps dan panduan lokasi berada di kolom kanan (`5/12`).
   - Galeri foto membentuk komposisi editorial 3 kolom bertingkat.
   - Navigasi utama tampil langsung sebagai tautan seksi dengan penanda aktif emas kasab.

---

## 6. Decision Reason Ledger (R-31 & Purpose-Gate)

| Elemen / Teknik | Keputusan Desain | Alasan Satu Baris (R-31) |
| :--- | :--- | :--- |
| **Palet Meuh & Kasab (R-01, R-21)** | Latar Obsidian `#0F0E0E`, permukaan `#1F1C1A`, aksen Maroon `#661418`, dan emas `#D4AF37` | Merepresentasikan kain adat Aceh beludru hitam/marun bersulam benang emas (*kasab*) pada busana pernikahan *Linto Baro* dan *Dara Baro*. |
| **Pasangan Tipografi (R-06)** | *Cormorant Garamond* untuk tajuk seremonial + *Plus Jakarta Sans* untuk informasi acara dan formulir | Serif memberi wibawa budaya pada nama mempelai, sementara sans-serif humanis memastikan keterbacaan alamat, angka waktu, dan input tamu di layar kecil. |
| **Rhythm Seksi Bervariasi (R-05, R-14)** | Komposisi berbeda di tiap seksi (Cover berbingkai, Ayat terpusat, Profil 2-kolom, Jadwal + Maps asimetris, Galeri editorial, Form bertab) | Mencegah kebosanan pola template kartu seragam sehingga halaman terasa seperti buku acara pernikahan yang dikurasi khusus. |
| **Ornamen Vektor Aceh (R-07, R-22)** | Motif SVG tipis *Pinto Aceh* dan *Bungong Jeumpa* pada pembatas seksi dan sudut bingkai | Memberikan identitas visual asli budaya Aceh tanpa mengandalkan ilustrasi stok generik atau pola latar grid. |
| **Ikon Fungsional (R-04, R-08)** | Ikon SVG hanya untuk fungsi nyata (speaker audio, kalender, pin lokasi, kamera, unggah, kunci privasi, salin) | Memperjelas maksud tombol aksi penting tanpa dekorasi ikon bintang/kilau AI atau panah di setiap tombol. |
| **Lencana Status (R-09)** | Lencana `"Acara Utama"` pada kartu Intat Linto Baro dan `"Privat untuk Mempelai"` pada form ucapan | Menandai status fungsional nyata (fokus acara tunggal dan jaminan privasi ucapan tamu), bukan lencana pemasaran dekoratif. |
| **Glassmorphism Terbatas (R-10)** | `backdrop-blur-md` dibatasi hanya pada bilah navigasi atas dan modal Lightbox foto | Menjaga keterbacaan kontrol mengambang di atas konten yang digulir tanpa membuat seluruh kartu halaman terlihat buram seragam. |
| **Radius & Bayangan (R-11, R-12, R-13)** | Radius bertingkat (`8px` tombol/input, `14px` kartu, `18px` bingkai utama); bayangan hanya pada kontrol mengambang; nol pendar neon | Membedakan fungsi elemen input, kartu, dan tombol melalui bentuk tegas dan hierarki permukaan datar berbingkai emas tipis. |
| **Gerak Scroll & Audio (R-19, R-37 Override R-39)** | Animasi *scroll-reveal* sekali jalan + musik *Ranup Lampuan* volume normal 100% tanpa tombol pause mengambang (override eksplisit pemilik produk atas R-39) dan tetap *auto-pause* saat rekam/putar video | Menjaga tampilan layar bersih dari tombol audio mengambang sesuai instruksi pemilik produk, sambil tetap menjeda musik otomatis saat tamu merekam video ucapan. |
| **Placeholder Jujur (R-23, R-38)** | Bingkai potret dan galeri pada mode template menggunakan penanda eksplisit `[FOTO DARA BARO]`, `[FOTO LINTO BARO]`, `[FOTO GALERI 01..04]` | Menjaga kejujuran visual pada mode template portofolio hingga pemilik mengunggah foto asli mempelai. |
