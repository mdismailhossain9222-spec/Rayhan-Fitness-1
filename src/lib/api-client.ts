/**
 * Central API client for all browser-side requests.
 * Automatically attaches:
 *  - X-Requested-With: RayhanFitnessClient (CSRF custom-header token)
 *  - X-CSRF-Token echoed from the double-submit cookie (when present)
 * Use this instead of raw `fetch()` for every /api/* call.
 */

export const CSRF_HEADER_NAME = "X-Requested-With";
export const CSRF_HEADER_VALUE = "RayhanFitnessClient";
export const CSRF_COOKIE_NAME = "rf_csrf_token";

export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    /(?:^|;\s*)rf_csrf_token=([^;]+)/
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (!headers.has(CSRF_HEADER_NAME)) {
    headers.set(CSRF_HEADER_NAME, CSRF_HEADER_VALUE);
  }
  const csrf = getCsrfTokenFromCookie();
  if (csrf && !headers.has("X-CSRF-Token")) {
    headers.set("X-CSRF-Token", csrf);
  }
  return fetch(input, { ...init, headers });
}
