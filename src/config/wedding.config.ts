export type ThemePreset = "klasik_megah" | "modern_elegan";

export interface CouplePerson {
  fullName: string;
  nickname: string;
  roleLabel: string;
  fatherName: string;
  motherName: string;
  portraitSrc: string;
  portraitAlt: string;
  placeholderLabel: string;
}

export interface ReceptionSchedule {
  title: string;
  ceremonyBadge: string;
  description: string;
  dateDisplay: string;
  dayName: string;
  dayNumber: string;
  monthYearDisplay: string;
  startTimeIso: string;
  endTimeIso: string;
  timeRangeWib: string;
  venueName: string;
  address: string;
  city: string;
  googleMapsUrl: string;
  mapsEmbedUrl: string;
}

export interface GalleryPhotoItem {
  id: string;
  src: string;
  alt: string;
  caption: string;
  placeholderLabel: string;
  width: number;
  height: number;
  aspectClass: string;
  featured?: boolean;
}

export interface BankAccountGift {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface WeddingTemplateConfig {
  isTemplateDemo: boolean;
  themePreset: ThemePreset;
  eventTitle: "Intat Linto Baro";
  welcomeGreeting: string;
  ceremonyHeader: string;
  couple: {
    bride: CouplePerson;
    groom: CouplePerson;
    heroImageSrc: string;
    heroImageAlt: string;
    heroPlaceholderLabel: string;
  };
  holyVerse: {
    bismillah: string;
    translation: string;
    surahRef: string;
    hadihMaja: string;
    hadihMajaMeaning: string;
  };
  receptionSchedule: ReceptionSchedule;
  audioTrack: {
    title: "Ranup Lampuan";
    subtitle: string;
    sourceUrl: string;
    defaultVolume: number;
  };
  galleryPhotos: GalleryPhotoItem[];
  digitalGift: {
    enabled: boolean;
    sectionNote: string;
    accounts: BankAccountGift[];
    physicalGiftAddress: string;
  };
  postEventMessage: {
    title: string;
    body: string;
    closingGreeting: string;
  };
}

// Default seed uses explicit placeholder labels so template mode never fabricates final client assets (R-23, R-38).
export const weddingConfig: WeddingTemplateConfig = {
  isTemplateDemo: true,
  themePreset: "klasik_megah",
  eventTitle: "Intat Linto Baro",
  welcomeGreeting: "Saleum Teuka",
  ceremonyHeader: "Walimatul 'Ursy",
  couple: {
    bride: {
      fullName: "Cut Sarah Zahara, S.T.",
      nickname: "Cut Sarah",
      roleLabel: "Dara Baro (Mempelai Wanita)",
      fatherName: "Bapak Teuku H. Muhammad Yunus",
      motherName: "Ibu Cut Hj. Rohani",
      portraitSrc: "/images/placeholder-dara-baro.svg",
      portraitAlt: "Bingkai placeholder potret Dara Baro Cut Sarah Zahara",
      placeholderLabel: "[FOTO DARA BARO]",
    },
    groom: {
      fullName: "Teuku Faisal Reza, M.Sc.",
      nickname: "Teuku Faisal",
      roleLabel: "Linto Baro (Mempelai Pria)",
      fatherName: "Bapak Teuku H. Abdullah Usman",
      motherName: "Ibu Cut Hj. Maryam",
      portraitSrc: "/images/placeholder-linto-baro.svg",
      portraitAlt: "Bingkai placeholder potret Linto Baro Teuku Faisal Reza",
      placeholderLabel: "[FOTO LINTO BARO]",
    },
    heroImageSrc: "/images/hero-pelaminan-aceh.svg",
    heroImageAlt: "Ilustrasi arsitektur Pinto Aceh dan pelaminan Meuh Kasab",
    heroPlaceholderLabel: "[FOTO SAMPUL MEMPELAI - CONTOH TEMPLATE]",
  },
  holyVerse: {
    bismillah: "Bismillahirrahmanirrahim",
    translation:
      "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.",
    surahRef: "QS. Ar-Rum: 21",
    hadihMaja: "Udep saree, mate syahid; saboh hate, saboh langkah.",
    hadihMajaMeaning:
      "Hidup seiring sejalan dalam ridha Allah, bersatu hati dan langkah membangun keluarga.",
  },
  receptionSchedule: {
    title: "Resepsi Intat Linto Baro",
    ceremonyBadge: "Acara Utama",
    description:
      "Resepsi pernikahan adat Aceh di kediaman keluarga mempelai wanita (Dara Baro) untuk menyambut kedatangan rombongan mempelai pria (Linto Baro).",
    dateDisplay: "Sabtu, 15 Agustus 2026",
    dayName: "Sabtu",
    dayNumber: "15",
    monthYearDisplay: "Agustus 2026",
    startTimeIso: "2026-08-15T10:00:00+07:00",
    endTimeIso: "2026-08-15T16:00:00+07:00",
    timeRangeWib: "10.00 WIB s/d 16.00 WIB",
    venueName: "Kediaman Keluarga Besar Dara Baro (Balee Meuligoe)",
    address: "Jl. Teuku Nyak Arief No. 45, Gampong Lamnyong, Kec. Syiah Kuala",
    city: "Kota Banda Aceh, Aceh",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=5.5736,95.3583",
    mapsEmbedUrl:
      "https://www.openstreetmap.org/export/embed.html?bbox=95.3483%2C5.5656%2C95.3683%2C5.5816&layer=mapnik&marker=5.5736%2C95.3583",
  },
  audioTrack: {
    title: "Ranup Lampuan",
    subtitle: "Instrumen Tradisional Penyambutan Tamu Aceh",
    sourceUrl: "/audio/ranup-lampuan.mp3",
    defaultVolume: 1,
  },
  galleryPhotos: [
    {
      id: "gal-01",
      src: "/images/gallery-01.svg",
      alt: "Placeholder foto utama pelaminan adat Aceh",
      caption: "Busana Adat Meuh & Kasab Aceh (Contoh Template 01)",
      placeholderLabel: "[FOTO GALERI 01 - UTAMA]",
      width: 960,
      height: 640,
      aspectClass: "aspect-[3/2]",
      featured: true,
    },
    {
      id: "gal-02",
      src: "/images/gallery-02.svg",
      alt: "Placeholder foto potret Dara Baro dengan sunting Aceh",
      caption: "Detail Sunting & Kasab Dara Baro (Contoh Template 02)",
      placeholderLabel: "[FOTO GALERI 02 - POTRET]",
      width: 640,
      height: 800,
      aspectClass: "aspect-[4/5]",
    },
    {
      id: "gal-03",
      src: "/images/gallery-03.svg",
      alt: "Placeholder foto potret Linto Baro dengan kupiah meukeutop",
      caption: "Detail Kupiah Meukeutop & Rencong Linto Baro (Contoh Template 03)",
      placeholderLabel: "[FOTO GALERI 03 - POTRET]",
      width: 640,
      height: 800,
      aspectClass: "aspect-[4/5]",
    },
    {
      id: "gal-04",
      src: "/images/gallery-04.svg",
      alt: "Placeholder foto kebersamaan kedua mempelai",
      caption: "Potret Kebersamaan Mempelai (Contoh Template 04)",
      placeholderLabel: "[FOTO GALERI 04 - LANSKAP]",
      width: 960,
      height: 640,
      aspectClass: "aspect-[3/2]",
    },
  ],
  digitalGift: {
    enabled: true,
    sectionNote:
      "Doa restu Bapak/Ibu/Saudara/i merupakan karunia terindah bagi kami. Namun apabila ingin mengirimkan tanda kasih secara digital, dapat melalui rekening berikut:",
    accounts: [
      {
        id: "bsi-aceh",
        bankName: "Bank Syariah Indonesia (BSI)",
        accountNumber: "7182930415",
        accountHolder: "a.n. Cut Sarah Zahara (Contoh Template)",
      },
      {
        id: "bank-aceh",
        bankName: "Bank Aceh Syariah",
        accountNumber: "010020304050",
        accountHolder: "a.n. Teuku Faisal Reza (Contoh Template)",
      },
    ],
    physicalGiftAddress:
      "Jl. Teuku Nyak Arief No. 45, Gampong Lamnyong, Kec. Syiah Kuala, Kota Banda Aceh 23115",
  },
  postEventMessage: {
    title: "Alhamdulillah, Acara Resepsi Intat Linto Baro Telah Terlaksana",
    body: "Terima kasih yang tulus kami haturkan kepada seluruh keluarga, kerabat, dan sahabat yang telah hadir maupun mengirimkan doa serta video ucapan bagi kedua mempelai.",
    closingGreeting: "Teurimong Geunaseh",
  },
};
