import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Bebas_Neue, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Preloader from "@/components/Preloader";
import WebVitalsReporter from "@/components/WebVitalsReporter";
import SessionTimeout from "@/components/SessionTimeout";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import BackToTop from "@/components/BackToTop";
import QueryToast from "@/components/QueryToast";
import { AuthToastProvider } from "@/components/auth/AuthToast";
import { preconnect } from "react-dom";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: "RAYHAN FITNESS | Dhaka's Premier Strength & Conditioning Clubs",
  description:
    "Forged at Midnight. Elite strength, hypertrophy, powerlifting, and athletic conditioning across Lalbagh, Dhanmondi, and Mirpur branches in Dhaka. Packages starting at ৳1,700.",
  keywords: [
    "Rayhan Fitness",
    "Gym in Dhaka",
    "Lalbagh Gym",
    "Dhanmondi Gym",
    "Mirpur Gym",
    "Powerlifting Bangladesh",
    "Fitness Center Dhaka",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/favicon.svg",
      },
    ],
  },
  openGraph: {
    title: "RAYHAN FITNESS — Forged at Midnight (Lalbagh • Dhanmondi • Mirpur)",
    description:
      "3 Elite Clubs in Dhaka. Imported Hammer Strength & Eleiko equipment, biometric access, and certified master coaches.",
    type: "website",
    images: [
      {
        url: "/images/rayhan-fitness-logo-cropped.png",
        width: 1200,
        height: 816,
        alt: "Rayhan Fitness — Official Gold Crest",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Warm the image-CDN connection before first paint (LCP assist).
  preconnect("https://images.pexels.com");
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="bg-[#0A0A0A] text-[#F5F5F5] antialiased min-h-screen flex flex-col selection:bg-[#D4AF37] selection:text-[#0A0A0A]">
        <div className="film-grain-overlay" aria-hidden="true" />
        <Preloader />
        <WebVitalsReporter />
        <SessionTimeout />
        <ServiceWorkerRegister />
        <Navbar />
        <AuthToastProvider>
          <QueryToast />
          <main className="flex-1 pt-20">{children}</main>
        </AuthToastProvider>
        <Footer />
        <BackToTop />
      </body>
    </html>
  );
}
