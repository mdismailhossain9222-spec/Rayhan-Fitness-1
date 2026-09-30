"use client";

/**
 * QueryToast — renders one-shot toasts from URL query flags set by
 * middleware redirects (e.g. /?toast=unauthorized for blocked /admin
 * visits), then cleans the URL. Mounted once inside AuthToastProvider.
 */

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useAuthToast } from "./auth/AuthToast";

function QueryToastInner() {
  const params = useSearchParams();
  const pathname = usePathname();
  const { notify } = useAuthToast();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    const toast = params.get("toast");
    if (!toast || handled.current === `${pathname}?${toast}`) return;
    handled.current = `${pathname}?${toast}`;
    if (toast === "unauthorized") {
      notify(
        "error",
        "Unauthorized",
        "That area is restricted to Rayhan Fitness administrators."
      );
    } else if (toast === "signed-out") {
      notify("info", "Signed out", "You have been signed out securely.");
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("toast");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [params, pathname, notify]);

  return null;
}

export default function QueryToast() {
  return (
    <Suspense fallback={null}>
      <QueryToastInner />
    </Suspense>
  );
}
