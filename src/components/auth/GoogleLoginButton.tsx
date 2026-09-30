"use client";

/**
 * <GoogleLoginButton /> — matte-black + gold OAuth button.
 * Minimal scopes only (openid/email/profile — configured in Supabase).
 * Requests offline access + consent so a refresh token is issued.
 */

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuthToast } from "./AuthToast";

function GoogleIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export default function GoogleLoginButton({
  label = "Continue with Google",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const { notifyAuthError } = useAuthToast();

  const handleClick = async () => {
    if (!isSupabaseConfigured) {
      notifyAuthError(
        new Error("network"),
        "Social login unavailable in preview"
      );
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
      // Browser redirects to Google — loading state persists until unload.
    } catch (err) {
      setLoading(false);
      notifyAuthError(err, "Google sign-in failed");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`btn-matte-iron w-full min-h-[48px] px-5 rounded-sm text-xs font-bold uppercase tracking-[0.14em] flex items-center justify-center gap-2.5 disabled:opacity-60 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-[18px] h-[18px] animate-spin text-[#D4AF37]" />
      ) : (
        <GoogleIcon />
      )}
      <span>{loading ? "Connecting to Google…" : label}</span>
    </button>
  );
}
