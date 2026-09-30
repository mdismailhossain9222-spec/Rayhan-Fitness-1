"use client";

/**
 * <EmailLoginForm /> — Supabase email/password sign-in (fallback alongside
 * social login). Uses `signInWithPassword()`; requires a verified email
 * when "Confirm email" is enabled in Supabase Auth settings.
 * All input is trimmed + length-capped before the request.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuthToast } from "./AuthToast";

function sanitizeEmail(v: string): string {
  return v.trim().toLowerCase().slice(0, 150);
}

export default function EmailLoginForm() {
  const router = useRouter();
  const { notify, notifyAuthError } = useAuthToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      notifyAuthError(new Error("network"), "Email login unavailable in preview");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizeEmail(email),
        password: password.slice(0, 256),
      });
      if (error) throw error;
      notify("success", "Welcome back!", "Signed in — loading your dashboard.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      notifyAuthError(err, "Couldn't sign you in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="sb-email"
          className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-1.5"
        >
          Email address
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-[#B3B3B3] absolute left-3.5 top-3.5" />
          <input
            id="sb-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            maxLength={150}
            className="w-full h-11 pl-10 pr-4 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white placeholder:text-[#B3B3B3]/50 focus:border-[#D4AF37] focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="sb-password"
          className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-1.5"
        >
          Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-[#B3B3B3] absolute left-3.5 top-3.5" />
          <input
            id="sb-password"
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            maxLength={256}
            className="w-full h-11 pl-10 pr-10 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white placeholder:text-[#B3B3B3]/50 focus:border-[#D4AF37] focus:outline-none"
          />
          <button
            type="button"
            aria-label={show ? "Hide password" : "Show password"}
            onClick={() => setShow(!show)}
            className="absolute right-3 top-3 text-[#B3B3B3] hover:text-white"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-crimson-primary w-full min-h-[48px] rounded-sm text-xs font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        <span>{loading ? "Signing in…" : "Sign in with Email"}</span>
      </button>
    </form>
  );
}
