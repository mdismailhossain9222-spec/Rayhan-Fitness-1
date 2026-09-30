"use client";

import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api-client";

/**
 * Session hygiene for authenticated users:
 * 1. Silent refresh-token rotation every `refreshMinutes` (keeps active
 *    users logged in without ever touching localStorage).
 * 2. Automatic logout after `idleMinutes` of zero interaction, with a
 *    redirect to /login?reason=timeout.
 * The component self-disables when no authenticated session exists.
 */
export default function SessionTimeout({
  idleMinutes = 30,
  refreshMinutes = 14,
}: {
  idleMinutes?: number;
  refreshMinutes?: number;
}) {
  const lastActivity = useRef<number>(0);
  const enabled = useRef<boolean>(false);

  // Initialize ref lazily in useEffect to avoid impure Date.now() during render
  useEffect(() => {
    if (lastActivity.current === 0) lastActivity.current = Date.now();
  }, []);

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setInterval> | null = null;
    let idleTimer: ReturnType<typeof setInterval> | null = null;

    const markActivity = () => {
      // Throttle writes: only refresh the timestamp every 5s.
      const now = Date.now();
      if (now - lastActivity.current > 5000) {
        lastActivity.current = now;
      }
    };

    const doLogout = async (reason: string) => {
      try {
        await apiFetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch {
        // Continue to redirect even if the call fails.
      }
      window.location.href = `/login?reason=${reason}`;
    };

    const boot = async () => {
      try {
        const res = await apiFetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (!data?.user) return; // not logged in — stay dormant.
      } catch {
        return;
      }

      enabled.current = true;
      lastActivity.current = Date.now();

      window.addEventListener("mousemove", markActivity, { passive: true });
      window.addEventListener("keydown", markActivity);
      window.addEventListener("touchstart", markActivity, { passive: true });
      window.addEventListener("click", markActivity, { passive: true });

      // Silent rotation keeps the 15-minute access token fresh.
      refreshTimer = setInterval(
        () => {
          if (!enabled.current) return;
          apiFetch("/api/auth/refresh", { method: "POST" }).catch(() => {});
        },
        Math.max(5, refreshMinutes) * 60 * 1000
      );

      // Inactivity watchdog (checked every 30s).
      idleTimer = setInterval(
        () => {
          if (!enabled.current) return;
          if (Date.now() - lastActivity.current > idleMinutes * 60 * 1000) {
            enabled.current = false;
            doLogout("timeout");
          }
        },
        30 * 1000
      );
    };

    boot();

    return () => {
      enabled.current = false;
      if (refreshTimer) clearInterval(refreshTimer);
      if (idleTimer) clearInterval(idleTimer);
      window.removeEventListener("mousemove", markActivity);
      window.removeEventListener("keydown", markActivity);
      window.removeEventListener("touchstart", markActivity);
      window.removeEventListener("click", markActivity);
    };
  }, [idleMinutes, refreshMinutes]);

  return null;
}
