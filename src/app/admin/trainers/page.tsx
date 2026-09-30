"use client";

/**
 * /admin/trainers — add / edit / remove trainer profiles + availability.
 * Supabase mode writes to the `trainers` table (RLS admin-only);
 * demo mode persists to the local store.
 */

import React, { useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Dumbbell } from "lucide-react";
import AdminGuard, { AdminSkeleton } from "@/components/admin/AdminGuard";
import { useAdminData } from "@/hooks/useAdminData";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  saveDemoTrainer,
  deleteDemoTrainer,
  TIME_SLOTS,
  type TrainerRow,
} from "@/lib/bookings";
import { useAuthToast } from "@/components/auth/AuthToast";

const EMPTY: TrainerRow = {
  id: "",
  name: "",
  slug: "",
  photo_url: "",
  specialty: "",
  branch_id: null,
  bio: "",
  availability: null,
  is_active: true,
};

export default function AdminTrainersPage() {
  return (
    <AdminGuard>
      <TrainersInner />
    </AdminGuard>
  );
}

function TrainersInner() {
  const { notify, notifyAuthError } = useAuthToast();
  const { loading, trainers, branches, refresh } = useAdminData();
  const [editing, setEditing] = useState<TrainerRow | null>(null);
  const [form, setForm] = useState<TrainerRow>(EMPTY);
  const [busy, setBusy] = useState(false);

  const openNew = () => {
    setEditing({ ...EMPTY, id: "new" });
    setForm({ ...EMPTY, branch_id: branches[0]?.id ?? null });
  };

  const openEdit = (t: TrainerRow) => {
    setEditing(t);
    setForm({ ...t });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim().replace(/<[^>]*>/g, "").slice(0, 120);
    if (!name) {
      notify("error", "Name required", "Give the trainer a display name.");
      return;
    }
    const slug =
      form.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const payload = {
      name,
      slug: slug.slice(0, 80),
      photo_url: form.photo_url?.trim().slice(0, 600) || null,
      specialty: form.specialty?.trim().slice(0, 120) || null,
      branch_id: form.branch_id || null,
      bio: form.bio?.trim().slice(0, 1200) || null,
      availability: { slots: [...TIME_SLOTS] },
      is_active: true,
    };
    setBusy(true);
    try {
      if (isSupabaseConfigured) {
        const supabase = createClient();
        if (editing && editing.id !== "new") {
          const { error } = await supabase
            .from("trainers")
            .update(payload)
            .eq("id", editing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("trainers").insert(payload);
          if (error) throw error;
        }
      } else {
        await saveDemoTrainer({
          ...(editing && editing.id !== "new" ? editing : {}),
          ...payload,
          id:
            editing && editing.id !== "new"
              ? editing.id
              : `demo-trainer-${Date.now()}`,
          availability: { slots: [...TIME_SLOTS] },
        } as TrainerRow);
      }
      notify("success", "Trainer saved", `${name} is live on the roster.`);
      setEditing(null);
      await refresh();
    } catch (err) {
      notifyAuthError(err, "Couldn't save trainer");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (t: TrainerRow) => {
    if (
      !window.confirm(
        `Remove ${t.name} from the roster? Existing bookings stay intact.`
      )
    )
      return;
    setBusy(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await createClient()
          .from("trainers")
          .delete()
          .eq("id", t.id);
        if (error) throw error;
      } else {
        await deleteDemoTrainer(t.id);
      }
      notify("success", "Trainer removed", `${t.name} left the roster.`);
      await refresh();
    } catch (err) {
      notifyAuthError(err, "Couldn't remove trainer");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <AdminSkeleton />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
            {trainers.length} coaches on roster
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wider uppercase">
            Trainers
          </h1>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="btn-crimson-primary px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-bold uppercase tracking-widest flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add trainer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {trainers.map((t) => (
          <article
            key={t.id}
            className="rounded-sm bg-[#111111] border border-[#2A2A2A] overflow-hidden flex flex-col"
          >
            <div className="flex items-center gap-3 p-4">
              {t.photo_url ? (
                <img
                  src={t.photo_url}
                  alt={t.name}
                  loading="lazy"
                  decoding="async"
                  className="w-14 h-14 rounded-sm object-cover border border-[#2A2A2A] shrink-0"
                />
              ) : (
                <span className="w-14 h-14 rounded-sm bg-[#1a1a1a] border border-[#2A2A2A] flex items-center justify-center shrink-0">
                  <Dumbbell className="w-6 h-6 text-[#D4AF37]" />
                </span>
              )}
              <div className="min-w-0">
                <div className="font-display text-xl text-white tracking-wider uppercase truncate">
                  {t.name}
                </div>
                <div className="text-[11px] font-mono-tech text-[#D4AF37] uppercase truncate">
                  {t.specialty ?? "Coach"}
                </div>
              </div>
            </div>
            {t.bio && (
              <p className="px-4 pb-3 text-xs text-[#B3B3B3] leading-relaxed line-clamp-2">
                {t.bio}
              </p>
            )}
            <div className="mt-auto flex border-t border-[#2A2A2A]">
              <button
                type="button"
                onClick={() => openEdit(t)}
                className="flex-1 flex items-center justify-center gap-2 py-3 min-h-[48px] text-xs font-bold uppercase tracking-widest text-[#B3B3B3] hover:text-[#D4AF37] hover:bg-[#151515] border-r border-[#2A2A2A]"
              >
                <Pencil className="w-4 h-4" /> Edit
              </button>
              <button
                type="button"
                onClick={() => void remove(t)}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 py-3 min-h-[48px] text-xs font-bold uppercase tracking-widest text-[#B3B3B3] hover:text-red-400 hover:bg-[#151515] disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditing(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Trainer editor"
        >
          <form
            onSubmit={save}
            className="relative w-full max-w-lg rounded-sm bg-[#0F0F0F] border border-[#D4AF37]/50 p-6 space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setEditing(null)}
              aria-label="Close editor"
              className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sm bg-[#151515] border border-[#2A2A2A] text-[#B3B3B3] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-display text-3xl text-white tracking-wider uppercase">
              {editing.id === "new" ? "Add trainer" : `Edit ${editing.name}`}
            </h2>
            <div>
              <label htmlFor="tr-name" className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1">
                Full name *
              </label>
              <input
                id="tr-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={120}
                className="w-full h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="tr-specialty" className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1">
                  Specialty
                </label>
                <input
                  id="tr-specialty"
                  value={form.specialty ?? ""}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  maxLength={120}
                  placeholder="e.g. HIIT & Fat Loss"
                  className="w-full h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white"
                />
              </div>
              <div>
                <label htmlFor="tr-branch" className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1">
                  Home branch
                </label>
                <select
                  id="tr-branch"
                  value={form.branch_id ?? ""}
                  onChange={(e) => setForm({ ...form, branch_id: e.target.value || null })}
                  className="w-full h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white"
                >
                  <option value="">All branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="tr-photo" className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1">
                Photo URL
              </label>
              <input
                id="tr-photo"
                value={form.photo_url ?? ""}
                onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                maxLength={600}
                placeholder="https://…"
                className="w-full h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="tr-bio" className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1">
                Bio
              </label>
              <textarea
                id="tr-bio"
                value={form.bio ?? ""}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                maxLength={1200}
                className="w-full p-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full btn-crimson-primary py-3.5 min-h-[48px] rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save trainer</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
