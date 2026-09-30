"use client";
import { apiFetch } from "@/lib/api-client";

import { useEffect } from "react";

/**
 * Real-User Monitoring: reports CLS / INP / LCP / FCP / TTFB to /api/vitals.
 * The `web-vitals` library is dynamically imported AFTER hydration so it
 * never blocks first paint or inflates the initial bundle.
 */
export default function WebVitalsReporter() {
  useEffect(() => {
    let cancelled = false;

    const send = (metric: {
      name: string;
      value: number;
      rating?: string;
    }) => {
      try {
        const body = JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating || "",
          page: window.location.pathname,
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            "/api/vitals",
            new Blob([body], { type: "application/json" })
          );
        } else {
          apiFetch("/api/vitals", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Requested-With": "RayhanFitnessClient",
            },
            body,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // Telemetry must never break the app.
      }
    };

    import("web-vitals")
      .then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
        if (cancelled) return;
        onCLS(send);
        onINP(send);
        onLCP(send);
        onFCP(send);
        onTTFB(send);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
