"use client";

/**
 * AdminGuard — page-level access control (defense in depth).
 * Middleware gates first; this handles UX states: loading skeletons,
 * Supabase sign-in/admin prompts, and demo-mode guidance.
 */

import React from "react";
import Link from "next/link";
import { ShieldAlert, CloudOff, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";

export function AdminSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="animate-pulse h-10 w-64 rounded-sm bg-[#1c1c1c]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse h-32 rounded-sm bg-[#141414]" />
        ))}
      </div>
      <div className="animate-pulse h-64 rounded-sm bg-[#141414]" />
    </div>
  );
}

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading, configured } = useUser();

  if (loading) return <AdminSkeleton />;

  // Supabase connected → hard admin requirement.
  if (configured) {
    if (!user) {
      return (
        <div className="max-w-md mx-auto py-20 text-center space-y-5">
          <ShieldAlert className="w-12 h-12 text-[#D4AF37] mx-auto" />
          <h1 className="font-display text-4xl text-white tracking-wider uppercase">
            Sign in required
          </h1>
          <Link
            href="/login"
            className="inline-block btn-crimson-primary px-8 py-3.5 min-h-[48px] rounded-sm text-xs font-bold uppercase tracking-[0.18em]"
          >
            Go to login
          </Link>
        </div>
      );
    }
    if (role !== "admin") {
      return (
        <div className="max-w-md mx-auto py-20 text-center space-y-5">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="font-display text-4xl text-white tracking-wider uppercase">
            Admins only
          </h1>
          <p className="text-sm text-[#B3B3B3]">
            Your account doesn&apos;t have admin clearance.
          </p>
          <Link
            href="/dashboard"
            className="inline-block btn-matte-iron px-8 py-3.5 min-h-[48px] rounded-sm text-xs font-bold uppercase tracking-[0.18em]"
          >
            Back to dashboard
          </Link>
        </div>
      );
    }
  }

  return <>{children}</>;
}

export function DemoNotice({ onLogin }: { onLogin: () => Promise<boolean> }) {
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-sm bg-[#141414] border border-[#D4AF37]/40">
      <CloudOff className="w-5 h-5 text-[#D4AF37] shrink-0" />
      <p className="text-xs text-[#B3B3B3] flex-1 leading-relaxed">
        <strong className="text-white">Preview mode</strong> — Supabase
        isn&apos;t connected, so member/payment rows come from the built-in
        demo API. Sign in as the demo admin to unlock the full dataset.
        {failed && (
          <span className="block text-red-400 mt-1">
            Demo sign-in failed — is the API running?
          </span>
        )}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setFailed(false);
          const ok = await onLogin();
          if (!ok) setFailed(true);
          setBusy(false);
        }}
        className="btn-crimson-primary px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60 shrink-0"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        <span>{busy ? "Signing in…" : "Sign in as demo admin"}</span>
      </button>
    </div>
  );
}
