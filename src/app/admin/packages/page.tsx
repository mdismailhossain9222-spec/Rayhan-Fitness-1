"use client";

/**
 * /admin/packages — pricing per branch.
 * Supabase mode edits the `packages` table; demo mode uses the existing
 * PATCH /api/branches pricing endpoint (live on the public site instantly).
 */

import React, { useState } from "react";
import { Plus, Trash2, Loader2, Tags } from "lucide-react";
import AdminGuard, { AdminSkeleton } from "@/components/admin/AdminGuard";
import { useAdminData } from "@/hooks/useAdminData";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api-client";
import { useAuthToast } from "@/components/auth/AuthToast";

export default function AdminPackagesPage() {
  return (
    <AdminGuard>
      <PackagesInner />
    </AdminGuard>
  );
}

function PackagesInner() {
  const { notify, notifyAuthError } = useAuthToast();
  const { loading, isDemo, branches, packages, refresh } = useAdminData();
  const [prices, setPrices] = useState<Record<string, { p3: string; p6: string; p12: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState({ branch: "", months: "6", price: "" });

  const current = (branchId: string, months: number, fallback: number) => {
    const key = months === 3 ? "p3" : months === 6 ? "p6" : "p12";
    return prices[branchId]?.[key] ?? String(fallback);
  };

  const saveBranch = async (branchId: string, slug: string) => {
    const branchPkgs = packages.filter((p) => p.branch_id === branchId);
    const pick = (months: number, fb: number) => {
      const raw = current(branchId, months, fb);
      const n = Math.round(Number(raw));
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    const p3 = pick(3, branchPkgs.find((p) => p.duration_months === 3)?.price_tk ?? 0);
    const p6 = pick(6, branchPkgs.find((p) => p.duration_months === 6)?.price_tk ?? 0);
    const p12 = pick(12, branchPkgs.find((p) => p.duration_months === 12)?.price_tk ?? 0);
    if (p3 === null || p6 === null || p12 === null) {
      notify("error", "Check the prices", "All three tiers need a value above ৳0.");
      return;
    }
    setBusy(branchId);
    try {
      if (isSupabaseConfigured) {
        const supabase = createClient();
        for (const [months, price] of [
          [3, p3],
          [6, p6],
          [12, p12],
        ] as const) {
          const existing = branchPkgs.find((p) => p.duration_months === months);
          if (existing) {
            const { error } = await supabase
              .from("packages")
              .update({ price_tk: price })
              .eq("id", existing.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("packages").insert({
              branch_id: branchId,
              duration_months: months,
              price_tk: price,
              features: [],
              is_popular: months === 6,
            });
            if (error) throw error;
          }
        }
      } else {
        const res = await apiFetch("/api/branches", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            price3Months: p3,
            price6Months: p6,
            price12Months: p12,
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => null);
          throw new Error(d?.error ?? "Demo pricing update failed.");
        }
      }
      notify("success", "Pricing updated", "New tariffs are live on the site.");
      await refresh();
    } catch (err) {
      notifyAuthError(err, "Couldn't save pricing");
    } finally {
      setBusy(null);
    }
  };

  const addCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      notify("info", "Preview mode", "Custom packages need the Supabase backend.");
      return;
    }
    const price = Math.round(Number(adding.price));
    const months = Number(adding.months);
    if (!adding.branch || ![3, 6, 12].includes(months) || !Number.isFinite(price) || price <= 0) {
      notify("error", "Check the fields", "Pick a branch, duration and a price above ৳0.");
      return;
    }
    setBusy("add");
    try {
      const { error } = await createClient().from("packages").insert({
        branch_id: adding.branch,
        duration_months: months,
        price_tk: price,
        features: [],
        is_popular: false,
      });
      if (error) throw error;
      notify("success", "Package added");
      setAdding({ branch: "", months: "6", price: "" });
      await refresh();
    } catch (err) {
      notifyAuthError(err, "Couldn't add package");
    } finally {
      setBusy(null);
    }
  };

  const removePackage = async (id: string) => {
    if (!isSupabaseConfigured) {
      notify("info", "Preview mode", "Package removal needs the Supabase backend.");
      return;
    }
    if (!window.confirm("Delete this package row?")) return;
    setBusy(id);
    try {
      const { error } = await createClient().from("packages").delete().eq("id", id);
      if (error) throw error;
      notify("success", "Package deleted");
      await refresh();
    } catch (err) {
      notifyAuthError(err, "Couldn't delete package");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <AdminSkeleton />;

  return (
    <div className="space-y-5">
      <div>
        <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
          {packages.length} package rows
        </span>
        <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wider uppercase">
          Packages
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {branches.map((b) => {
          const rows = packages
            .filter((p) => p.branch_id === b.id)
            .sort((a, c) => a.duration_months - c.duration_months);
          const isBusy = busy === b.id;
          return (
            <article
              key={b.id}
              className="rounded-sm bg-[#111111] border border-[#2A2A2A] p-5 space-y-4"
            >
              <div>
                <div className="font-mono-tech text-[10px] text-[#D4AF37] uppercase tracking-widest">
                  {b.slug}
                </div>
                <h2 className="font-display text-2xl text-white tracking-wider uppercase">
                  {b.name}
                </h2>
              </div>
              {([3, 6, 12] as const).map((m) => {
                const key = m === 3 ? "p3" : m === 6 ? "p6" : "p12";
                const fb =
                  rows.find((p) => p.duration_months === m)?.price_tk ?? 0;
                return (
                  <label key={m} className="block">
                    <span className="text-[11px] font-mono-tech uppercase text-[#B3B3B3]">
                      {m} months (৳)
                      {m === 6 && (
                        <span className="ml-2 text-[#D4AF37]">· popular</span>
                      )}
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={current(b.id, m, fb)}
                      onChange={(e) =>
                        setPrices({
                          ...prices,
                          [b.id]: {
                            p3: m === 3 ? e.target.value : current(b.id, 3, rows.find((p) => p.duration_months === 3)?.price_tk ?? 0),
                            p6: m === 6 ? e.target.value : current(b.id, 6, rows.find((p) => p.duration_months === 6)?.price_tk ?? 0),
                            p12: m === 12 ? e.target.value : current(b.id, 12, rows.find((p) => p.duration_months === 12)?.price_tk ?? 0),
                          },
                        })
                      }
                      className="mt-1 w-full h-11 px-3 rounded-sm bg-[#0D0D0D] border border-[#2A2A2A] text-sm text-white font-mono-tech"
                    />
                  </label>
                );
              })}
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void saveBranch(b.id, b.slug)}
                className="w-full btn-matte-iron py-3 min-h-[48px] rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save {b.slug} pricing</span>
              </button>
              {rows.length > 3 && (
                <div className="pt-2 border-t border-[#2A2A2A] space-y-2">
                  <div className="text-[10px] font-mono-tech uppercase tracking-widest text-[#B3B3B3]">
                    Extra rows
                  </div>
                  {rows.slice(3).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs font-mono-tech text-white"
                    >
                      <span>
                        {p.duration_months}M · ৳{Number(p.price_tk).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        aria-label="Delete package row"
                        disabled={busy === p.id}
                        onClick={() => void removePackage(p.id)}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#B3B3B3] hover:text-red-400 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <form
        onSubmit={addCustom}
        className="rounded-sm bg-[#111111] border border-[#2A2A2A] p-5 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
      >
        <div className="sm:col-span-4 font-mono-tech text-xs text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
          <Tags className="w-4 h-4" /> Add custom package row (Supabase)
        </div>
        <select
          aria-label="Branch"
          value={adding.branch}
          onChange={(e) => setAdding({ ...adding, branch: e.target.value })}
          className="h-11 px-3 rounded-sm bg-[#0D0D0D] border border-[#2A2A2A] text-sm text-white"
        >
          <option value="">Select branch</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Duration"
          value={adding.months}
          onChange={(e) => setAdding({ ...adding, months: e.target.value })}
          className="h-11 px-3 rounded-sm bg-[#0D0D0D] border border-[#2A2A2A] text-sm text-white"
        >
          <option value="3">3 months</option>
          <option value="6">6 months</option>
          <option value="12">12 months</option>
        </select>
        <input
          type="number"
          min={1}
          aria-label="Price in taka"
          value={adding.price}
          onChange={(e) => setAdding({ ...adding, price: e.target.value })}
          placeholder="Price (৳)"
          className="h-11 px-3 rounded-sm bg-[#0D0D0D] border border-[#2A2A2A] text-sm text-white"
        />
        <button
          type="submit"
          disabled={busy === "add"}
          className="btn-crimson-primary h-11 rounded-sm text-xs font-bold uppercase tracking-widest disabled:opacity-60"
        >
          Add row
        </button>
      </form>

      {isDemo && (
        <p className="text-[11px] font-mono-tech text-[#B3B3B3]">
          Preview mode: the three tier prices above save through the demo API
          and go live instantly. Custom rows need Supabase.
        </p>
      )}
    </div>
  );
}
