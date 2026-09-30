"use client";

/**
 * /admin/settings — admin profile, session controls, backend status.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, ShieldCheck, Database, CloudOff } from "lucide-react";
import AdminGuard from "@/components/admin/AdminGuard";
import { useUser } from "@/hooks/useUser";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuthToast } from "@/components/auth/AuthToast";

export default function AdminSettingsPage() {
  return (
    <AdminGuard>
      <SettingsInner />
    </AdminGuard>
  );
}

function SettingsInner() {
  const router = useRouter();
  const { notify } = useAuthToast();
  const { user, profile, signOut, signOutEverywhere } = useUser();
  const [busy, setBusy] = useState(false);

  const logout = async (everywhere: boolean) => {
    setBusy(true);
    try {
      if (everywhere) await signOutEverywhere();
      else await signOut();
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "RayhanFitnessClient",
          },
          body: JSON.stringify({}),
        });
      } catch {
        // Supabase sign-out already done.
      }
      notify("info", "Signed out", "You have been signed out securely.");
      router.push("/?toast=signed-out");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
          Console preferences
        </span>
        <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wider uppercase">
          Settings
        </h1>
      </div>

      <div className="rounded-sm bg-[#111111] border border-[#2A2A2A] p-6 space-y-4">
        <h2 className="font-display text-2xl text-white tracking-wider uppercase flex items-center gap-2">
          <User className="w-5 h-5 text-[#D4AF37]" /> Admin profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono-tech">
          <div className="p-3 rounded-sm bg-[#0D0D0D] border border-[#222]">
            <div className="text-[10px] text-[#B3B3B3] uppercase">Name</div>
            <div className="text-white font-bold mt-0.5">
              {profile?.full_name ?? "Administrator"}
            </div>
          </div>
          <div className="p-3 rounded-sm bg-[#0D0D0D] border border-[#222]">
            <div className="text-[10px] text-[#B3B3B3] uppercase">Email</div>
            <div className="text-white font-bold mt-0.5 break-all">
              {user?.email ?? "—"}
            </div>
          </div>
          <div className="p-3 rounded-sm bg-[#0D0D0D] border border-[#222]">
            <div className="text-[10px] text-[#B3B3B3] uppercase">Role</div>
            <div className="text-[#D4AF37] font-bold mt-0.5 uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              {profile?.role ?? "admin"}
            </div>
          </div>
          <div className="p-3 rounded-sm bg-[#0D0D0D] border border-[#222]">
            <div className="text-[10px] text-[#B3B3B3] uppercase">Backend</div>
            <div className="text-white font-bold mt-0.5 flex items-center gap-1.5">
              {isSupabaseConfigured ? (
                <>
                  <Database className="w-3.5 h-3.5 text-emerald-400" /> Supabase
                  cloud
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-[#D4AF37]" /> Preview
                  demo
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-sm bg-[#111111] border border-[#2A2A2A] p-6 space-y-4">
        <h2 className="font-display text-2xl text-white tracking-wider uppercase flex items-center gap-2">
          <LogOut className="w-5 h-5 text-[#D4AF37]" /> Session
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void logout(false)}
            className="flex-1 btn-matte-iron py-3 min-h-[48px] rounded-sm text-xs font-bold uppercase tracking-widest disabled:opacity-60"
          >
            Sign out this device
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void logout(true)}
            className="flex-1 btn-crimson-primary py-3 min-h-[48px] rounded-sm text-xs font-bold uppercase tracking-widest disabled:opacity-60"
          >
            Sign out everywhere
          </button>
        </div>
        <p className="text-[11px] font-mono-tech text-[#B3B3B3] leading-relaxed">
          “Everywhere” revokes all Supabase refresh tokens globally and clears
          the local session cookies.
        </p>
      </div>
    </div>
  );
}
