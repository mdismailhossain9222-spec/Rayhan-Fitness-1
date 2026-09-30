"use client";

/**
 * AuthToast — friendly toast notifications for auth events.
 * NEVER renders raw error dumps: Supabase messages are mapped to
 * human-readable copy (failed logins, OAuth cancellations, expired
 * sessions, network errors).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message: string;
}

interface ToastContextValue {
  notify: (kind: ToastKind, title: string, message?: string) => void;
  /** Maps a raw Supabase/auth error into friendly copy + shows it. */
  notifyAuthError: (err: unknown, fallbackTitle?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function friendlyAuthError(err: unknown): {
  title: string;
  message: string;
} {
  const raw =
    (typeof err === "object" && err !== null && "message" in err
      ? String((err as { message: unknown }).message)
      : String(err ?? "")) || "";
  const lower = raw.toLowerCase();

  if (!raw || lower.includes("failed to fetch") || lower.includes("network")) {
    return {
      title: "Connection problem",
      message:
        "We couldn't reach the authentication service. Check your connection and try again.",
    };
  }
  if (lower.includes("popup closed") || lower.includes("cancelled") || lower.includes("canceled") || lower.includes("access_denied")) {
    return {
      title: "Sign-in cancelled",
      message: "The social sign-in window was closed before finishing. Try again whenever you're ready.",
    };
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
    return {
      title: "Couldn't sign you in",
      message: "That email/password combination doesn't match our records.",
    };
  }
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return {
      title: "Verify your email first",
      message: "We sent you a confirmation link — click it, then sign in.",
    };
  }
  if (lower.includes("expired") || lower.includes("session") || lower.includes("refresh_token")) {
    return {
      title: "Session expired",
      message: "For your security, please sign in again to continue.",
    };
  }
  if (lower.includes("rate") || lower.includes("too many")) {
    return {
      title: "Too many attempts",
      message: "Please wait a moment before trying again.",
    };
  }
  if (lower.includes("already registered") || lower.includes("already exists") || lower.includes("user_already_exists")) {
    return {
      title: "Account already exists",
      message: "This email is already registered — try signing in instead.",
    };
  }
  if (lower.includes("weak") || lower.includes("password")) {
    return {
      title: "Password too weak",
      message: "Use at least 8 characters with upper/lowercase, a number and a symbol.",
    };
  }
  return {
    title: "Something went wrong",
    message: "Please try again. If it keeps happening, contact 01736-574900.",
  };
}

export function AuthToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (kind: ToastKind, title: string, message = "") => {
      const id = idRef.current++;
      setToasts((prev) => [...prev.slice(-2), { id, kind, title, message }]);
      window.setTimeout(() => dismiss(id), 5200);
    },
    [dismiss]
  );

  const notifyAuthError = useCallback(
    (err: unknown, fallbackTitle?: string) => {
      const friendly = friendlyAuthError(err);
      notify("error", fallbackTitle ?? friendly.title, friendly.message);
    },
    [notify]
  );

  const value = useMemo(
    () => ({ notify, notifyAuthError }),
    [notify, notifyAuthError]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[calc(100%-2rem)] max-w-md space-y-2 pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-sm border backdrop-blur-xl shadow-2xl ${
                t.kind === "success"
                  ? "bg-[#0d1510]/95 border-emerald-500/50"
                  : t.kind === "error"
                    ? "bg-[#170d0d]/95 border-red-500/50"
                    : "bg-[#12100a]/95 border-[#D4AF37]/50"
              }`}
            >
              {t.kind === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : t.kind === "error" ? (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">{t.title}</div>
                {t.message && (
                  <div className="text-xs text-[#B3B3B3] mt-0.5 leading-relaxed">
                    {t.message}
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                className="p-1 text-[#B3B3B3] hover:text-white shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useAuthToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useAuthToast must be used inside AuthToastProvider");
  return ctx;
}
