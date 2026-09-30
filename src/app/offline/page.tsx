import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline | RAYHAN FITNESS",
  description:
    "You are offline. Reconnect to access Rayhan Fitness clubs, packages and your member dashboard.",
};

/**
 * Offline fallback page (server-rendered, zero client JS).
 * Served by the service worker when navigations fail with no connectivity.
 */
export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-[#0A0A0A]">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-sm bg-[#121212] border border-[#2A2A2A]">
        <div className="font-mono-tech text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
          Connection Lost
        </div>
        <h1 className="font-display text-5xl text-white tracking-wider uppercase">
          You&apos;re Offline
        </h1>
        <p className="text-sm text-[#B3B3B3] leading-relaxed">
          The iron can wait — your connection can&apos;t. Check your network
          and retry. Your membership data stays safe on our servers.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="btn-crimson-primary px-6 py-3.5 rounded-sm text-xs font-bold uppercase tracking-[0.18em]"
          >
            Retry Home
          </Link>
          <a
            href="tel:+8801736574900"
            className="btn-matte-iron px-6 py-3.5 rounded-sm text-xs font-bold uppercase tracking-[0.18em]"
          >
            Call 01736-574900
          </a>
        </div>
      </div>
    </div>
  );
}
