"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

function ResetPasswordForm() {
  const params = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const checks = [
    { label: "8+ characters", pass: newPassword.length >= 8 },
    { label: "Uppercase (A-Z)", pass: /[A-Z]/.test(newPassword) },
    { label: "Lowercase (a-z)", pass: /[a-z]/.test(newPassword) },
    { label: "Digit (0-9)", pass: /[0-9]/.test(newPassword) },
    { label: "Symbol (!@#$)", pass: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-[#0A0A0A]">
      <div className="max-w-md w-full iron-glass-card rounded-sm p-8 space-y-6">
        <div className="space-y-2 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#151515] border border-[#D4AF37]/50 font-mono-tech text-xs text-[#D4AF37] uppercase tracking-[0.2em]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Password Reset</span>
          </span>
          <h1 className="font-display text-4xl text-white tracking-wider uppercase">
            Set New Password
          </h1>
          <p className="text-xs text-[#B3B3B3]">
            Single-use link • expires 15 minutes after issue • resets all
            sessions.
          </p>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-sm text-emerald-200">
              Password updated and all devices signed out.
            </p>
            <Link
              href="/login"
              className="block btn-crimson-primary py-3.5 rounded-sm text-center text-xs font-bold uppercase tracking-[0.18em]"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-sm bg-red-950/60 border border-red-500 text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#B3B3B3] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full h-11 px-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
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
            <button
              type="submit"
              disabled={loading || !token || !email}
              className="w-full btn-crimson-primary py-4 rounded-sm text-xs font-bold uppercase tracking-[0.18em] disabled:opacity-50"
            >
              {loading ? "UPDATING..." : "UPDATE PASSWORD"}
            </button>
            {!token && (
              <p className="text-[11px] font-mono-tech text-amber-400 text-center">
                Missing reset token — request a fresh link from the login page.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center font-mono-tech text-sm text-[#D4AF37]">
          LOADING SECURE RESET...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
