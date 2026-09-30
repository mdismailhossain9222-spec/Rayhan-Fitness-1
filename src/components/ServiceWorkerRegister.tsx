"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker (production only, after window load
 * so it never contends with first paint). Provides offline fallback
 * plus cache-first static-asset delivery. See public/sw.js.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support is progressive enhancement — never fatal.
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
