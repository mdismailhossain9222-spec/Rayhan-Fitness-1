"use client";

/**
 * <FacebookLoginButton /> — matte-black + gold OAuth button.
 * Minimal scopes only (email + public_profile — configured in Supabase).
 */

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuthToast } from "./AuthToast";

function FacebookBrandIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="#1877F2" className={className} aria-hidden="true">
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5z" />
    </svg>
  );
}

export default function FacebookLoginButton({
  label = "Continue with Facebook",
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
        provider: "facebook",
        options: {
          redirectTo: `${origin}/auth/callback`,
          scopes: "email,public_profile",
        },
      });
      if (error) throw error;
      // Browser redirects to Facebook — loading state persists until unload.
    } catch (err) {
      setLoading(false);
      notifyAuthError(err, "Facebook sign-in failed");
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
        <FacebookBrandIcon />
      )}
      <span>{loading ? "Connecting to Facebook…" : label}</span>
    </button>
  );
}
