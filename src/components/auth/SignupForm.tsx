"use client";

/**
 * <SignupForm /> — Supabase email/password sign-up with email verification.
 * Uses `signUp()` with `emailRedirectTo` → /auth/callback, passing the
 * member's name/phone/branch as metadata (consumed by the
 * `handle_new_user()` trigger to build the `profiles` row).
 */

import React, { useState } from "react";
import { User, Mail, Lock, Phone, Loader2, CheckCircle2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuthToast } from "./AuthToast";
import type { BranchSlug } from "@/lib/supabase/types";

function clean(v: string, max: number): string {
  return v.trim().replace(/<[^>]*>/g, "").slice(0, max);
}

export default function SignupForm() {
  const { notifyAuthError } = useAuthToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState<BranchSlug>("dhanmondi");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const checks = [
    { label: "8+ chars", pass: password.length >= 8 },
    { label: "A-Z", pass: /[A-Z]/.test(password) },
    { label: "a-z", pass: /[a-z]/.test(password) },
    { label: "0-9", pass: /[0-9]/.test(password) },
    { label: "Symbol", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const strong = checks.every((c) => c.pass);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      notifyAuthError(new Error("network"), "Sign-up unavailable in preview");
      return;
    }
    if (!strong) {
      notifyAuthError(
        new Error("weak password"),
        "Password doesn't meet the rules yet"
      );
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase().slice(0, 150),
        password: password.slice(0, 256),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: clean(name, 100),
            phone_number: clean(phone, 30),
            preferred_branch: branch,
          },
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      notifyAuthError(err, "Couldn't create your account");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4 py-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
        <h3 className="font-display text-3xl text-white tracking-wider uppercase">
          Check your inbox
        </h3>
        <p className="text-sm text-[#B3B3B3] leading-relaxed">
          We sent a verification link to{" "}
          <span className="text-white font-semibold">{email}</span>. Click it,
          then come back and sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sb-su-name" className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5">
            Full name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#B3B3B3] absolute left-3.5 top-3.5" />
            <input
              id="sb-su-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zayan Rahman"
              maxLength={100}
              className="w-full h-11 pl-10 pr-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white placeholder:text-[#B3B3B3]/50 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label htmlFor="sb-su-phone" className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5">
            Phone
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-[#B3B3B3] absolute left-3.5 top-3.5" />
            <input
              id="sb-su-phone"
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="017XX-XXXXXX"
              maxLength={30}
              className="w-full h-11 pl-10 pr-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white placeholder:text-[#B3B3B3]/50 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sb-su-email" className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#B3B3B3] absolute left-3.5 top-3.5" />
            <input
              id="sb-su-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={150}
              className="w-full h-11 pl-10 pr-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white placeholder:text-[#B3B3B3]/50 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label htmlFor="sb-su-branch" className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5">
            Preferred branch
          </label>
          <select
            id="sb-su-branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value as BranchSlug)}
            className="w-full h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white focus:border-[#D4AF37] focus:outline-none"
          >
            <option value="lalbagh">Lalbagh Branch</option>
            <option value="dhanmondi">Dhanmondi Branch</option>
            <option value="mirpur">Mirpur Branch</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="sb-su-pass" className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5">
          Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-[#B3B3B3] absolute left-3.5 top-3.5" />
          <input
            id="sb-su-pass"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Strong password"
            maxLength={256}
            className="w-full h-11 pl-10 pr-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white placeholder:text-[#B3B3B3]/50 focus:border-[#D4AF37] focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {checks.map((c, i) => (
            <span
              key={i}
              className={`text-[10px] font-mono-tech px-2 py-0.5 rounded-sm border ${
                c.pass
                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                  : "border-[#2A2A2A] text-[#B3B3B3]"
              }`}
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-crimson-primary w-full min-h-[48px] rounded-sm text-xs font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        <span>{loading ? "Creating account…" : "Create account"}</span>
      </button>
    </form>
  );
}
