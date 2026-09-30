import { NextRequest, NextResponse } from "next/server";
import {
  sanitizeString,
  checkRateLimit,
  getClientIp,
} from "@/lib/security";

const ALLOWED_METRICS = new Set(["CLS", "INP", "LCP", "FCP", "TTFB"]);

/**
 * POST /api/vitals — Real-User Monitoring (RUM) ingest for Core Web Vitals.
 * Deliberately CSRF-exempt (sendBeacon can't set custom headers): it mutates
 * no state, requires no auth, is strictly validated + rate-limited, and only
 * appends to server logs (forward to GA/Vercel Analytics in production).
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`vitals:${ip}`, 120, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Rate limited." }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const name = sanitizeString(
      (body as Record<string, unknown>).name,
      8
    ).toUpperCase();
    const value = Number((body as Record<string, unknown>).value);
    const rating = sanitizeString(
      (body as Record<string, unknown>).rating,
      12
    );
    const page = sanitizeString((body as Record<string, unknown>).page, 200);

    if (!ALLOWED_METRICS.has(name) || !Number.isFinite(value)) {
      return NextResponse.json({ error: "Invalid metric." }, { status: 400 });
    }

    // Server-side log line (ship to your APM via stdout collector).
    // TODO (production): forward to Google Analytics / Vercel Analytics.
    console.log(
      `[WebVitals] ${name}=${Math.round(value * 100) / 100} rating=${rating || "n/a"} page=${page || "/"}`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/vitals error:", err);
    return NextResponse.json({ error: "Ingest failed." }, { status: 500 });
  }
}
