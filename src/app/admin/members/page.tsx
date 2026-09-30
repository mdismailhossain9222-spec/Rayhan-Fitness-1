"use client";

/**
 * /admin/members — searchable / filterable member table + role management.
 */

import React, { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, User, Loader2 } from "lucide-react";
import AdminGuard, { AdminSkeleton, DemoNotice } from "@/components/admin/AdminGuard";
import { useAdminData } from "@/hooks/useAdminData";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuthToast } from "@/components/auth/AuthToast";

function MembersInner() {
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const { notify, notifyAuthError } = useAuthToast();
  const { loading, isDemo, members, legacyAdmin, refresh, demoAdminLogin } =
    useAdminData();
  const [q, setQ] = useState(initialQ);
  const [roleFilter, setRoleFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let rows = [...members];
    if (roleFilter !== "all") rows = rows.filter((m) => m.role === roleFilter);
    if (branchFilter !== "all")
      rows = rows.filter(
        (m) => (m.branch ?? "").toLowerCase() === branchFilter
      );
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      rows = rows.filter(
        (m) =>
          (m.full_name ?? "").toLowerCase().includes(s) ||
          (m.phone ?? "").toLowerCase().includes(s)
      );
    }
    return rows;
  }, [members, q, roleFilter, branchFilter]);

  const setRole = async (id: string, role: string) => {
    if (!isSupabaseConfigured) {
      notify("info", "Preview mode", "Role changes need the Supabase backend.");
      return;
    }
    setBusyId(id);
    try {
      const { error } = await createClient()
        .from("profiles")
        .update({ role: role as "member" | "trainer" | "admin" })
        .eq("id", id);
      if (error) throw error;
      notify("success", "Role updated", `Member is now ${role}.`);
      await refresh();
    } catch (err) {
      notifyAuthError(err, "Couldn't update role");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <AdminSkeleton />;

  return (
    <div className="space-y-5">
      <div>
        <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
          {filtered.length} of {members.length} members
        </span>
        <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wider uppercase">
          Members
        </h1>
      </div>

      {isDemo && !legacyAdmin && <DemoNotice onLogin={demoAdminLogin} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#B3B3B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or phone…"
            aria-label="Search members"
            className="w-full h-11 pl-10 pr-4 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white placeholder:text-[#B3B3B3]/60 focus:border-[#D4AF37] focus:outline-none"
          />
        </div>
        <select
          aria-label="Filter by role"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-xs text-white"
        >
          <option value="all">All roles</option>
          <option value="member">Members</option>
          <option value="trainer">Trainers</option>
          <option value="admin">Admins</option>
        </select>
        <select
          aria-label="Filter by branch"
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-xs text-white"
        >
          <option value="all">All branches</option>
          <option value="lalbagh">Lalbagh</option>
          <option value="dhanmondi">Dhanmondi</option>
          <option value="mirpur">Mirpur</option>
        </select>
      </div>

      <div className="rounded-sm bg-[#111111] border border-[#2A2A2A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-tech min-w-[760px]">
            <thead>
              <tr className="border-b border-[#2A2A2A] text-[#B3B3B3]">
                <th className="p-4">MEMBER</th>
                <th className="p-4">PHONE</th>
                <th className="p-4">BRANCH</th>
                <th className="p-4">JOINED</th>
                <th className="p-4">ROLE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-[#D4AF37]/5 transition-colors">
                  <td className="p-4">
                    <span className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-sm bg-[#1a1a1a] border border-[#2A2A2A] flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-[#D4AF37]" />
                      </span>
                      <span>
                        <span className="block text-white font-bold">
                          {m.full_name ?? "Unnamed member"}
                        </span>
                        <span className="block text-[10px] text-[#B3B3B3]">
                          {String(m.id).slice(0, 8)}…
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="p-4 text-[#B3B3B3]">{m.phone ?? "—"}</td>
                  <td className="p-4 text-[#D4AF37] uppercase">{m.branch ?? "—"}</td>
                  <td className="p-4 text-[#B3B3B3]">
                    {m.created_at
                      ? new Date(m.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-2">
                      <select
                        aria-label={`Role for ${m.full_name ?? "member"}`}
                        value={m.role}
                        disabled={busyId === m.id}
                        onChange={(e) => void setRole(m.id, e.target.value)}
                        className="h-10 px-2 rounded-sm bg-[#1A1A1A] border border-[#333] text-white text-xs disabled:opacity-60"
                      >
                        {(["member", "trainer", "admin"] as const).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      {busyId === m.id && (
                        <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                      )}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#B3B3B3]">
                    No members match — try clearing the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminMembersPage() {
  return (
    <AdminGuard>
      <Suspense
        fallback={
          <div className="font-mono-tech text-xs text-[#D4AF37] py-10 text-center animate-pulse">
            Loading members…
          </div>
        }
      >
        <MembersInner />
      </Suspense>
    </AdminGuard>
  );
}
