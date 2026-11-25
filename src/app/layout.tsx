import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Undangan Resepsi Intat Linto Baro - Cut Sarah & Teuku Faisal",
  description:
    "Undangan pernikahan digital adat Aceh Resepsi Intat Linto Baro dengan musik tradisional Ranup Lampuan serta fitur kirim doa dan video ucapan privat.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      data-theme="klasik_megah"
      className={`${cormorant.variable} ${jakarta.variable}`}
    >
      <body className="antialiased selection:bg-gold selection:text-page">
        {children}
      </body>
    </html>
  );
}
