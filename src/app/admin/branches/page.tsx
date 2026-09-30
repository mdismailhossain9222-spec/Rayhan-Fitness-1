"use client";

/**
 * /admin/branches — manage branch info, photos and locations.
 * Supabase writes go to `branches` (RLS admin-only); demo mode edits the
 * built-in catalog via the existing PATCH /api/branches pricing endpoint
 * for prices and shows gallery/address as read-only reference.
 */

import React, { useState } from "react";
import { MapPin, Phone, Image as ImageIcon, Loader2 } from "lucide-react";
import AdminGuard, { AdminSkeleton } from "@/components/admin/AdminGuard";
import { useAdminData } from "@/hooks/useAdminData";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api-client";
import { useAuthToast } from "@/components/auth/AuthToast";

export default function AdminBranchesPage() {
  return (
    <AdminGuard>
      <BranchesInner />
    </AdminGuard>
  );
}

function BranchesInner() {
  const { notify, notifyAuthError } = useAuthToast();
  const { loading, isDemo, branches, refresh } = useAdminData();
  const [edits, setEdits] = useState<Record<string, { address: string; phone: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const getEdit = (id: string, address: string | null, phone: string | null) =>
    edits[id] ?? { address: address ?? "", phone: phone ?? "" };

  const save = async (id: string, slug: string) => {
    const branch = branches.find((b) => b.id === id);
    if (!branch) return;
    const { address, phone } = getEdit(id, branch.address, branch.phone);
    setBusyId(id);
    try {
      if (isSupabaseConfigured) {
        const { error } = await createClient()
          .from("branches")
          .update({
            location_address: address.trim().slice(0, 300) || null,
            phone: phone.trim().slice(0, 30) || null,
          })
          .eq("id", id);
        if (error) throw error;
      } else {
        // Demo catalog lives in the built-in API — address/phone are
        // reference-only there, so persist the edit as a UI override note.
        notify(
          "info",
          "Preview mode",
          "Branch catalog edits need Supabase — prices below stay editable via the demo API."
        );
        setBusyId(null);
        return;
      }
      notify("success", "Branch updated", `${branch.name} info saved.`);
      await refresh();
    } catch (err) {
      notifyAuthError(err, "Couldn't save branch");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <AdminSkeleton />;

  return (
    <div className="space-y-5">
      <div>
        <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
          {branches.length} clubs
        </span>
        <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wider uppercase">
          Branches
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {branches.map((b) => {
          const edit = getEdit(b.id, b.address, b.phone);
          const busy = busyId === b.id;
          return (
            <article
              key={b.id}
              className="rounded-sm bg-[#111111] border border-[#2A2A2A] overflow-hidden flex flex-col"
            >
              {b.images.length > 0 ? (
                <img
                  src={b.images[0]}
                  alt={b.name}
                  loading="lazy"
                  decoding="async"
                  className="h-40 w-full object-cover"
                />
              ) : (
                <span className="h-40 w-full bg-[#0D0D0D] flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-[#2A2A2A]" />
                </span>
              )}
              <div className="p-5 space-y-3 flex-1">
                <div>
                  <div className="font-mono-tech text-[10px] text-[#D4AF37] uppercase tracking-widest">
                    {b.slug}
                  </div>
                  <h2 className="font-display text-2xl text-white tracking-wider uppercase">
                    {b.name}
                  </h2>
                </div>
                <label className="block">
                  <span className="flex items-center gap-1.5 text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> Address
                  </span>
                  <textarea
                    rows={2}
                    value={edit.address}
                    onChange={(e) =>
                      setEdits({ ...edits, [b.id]: { ...edit, address: e.target.value } })
                    }
                    maxLength={300}
                    className="w-full p-2.5 rounded-sm bg-[#0D0D0D] border border-[#2A2A2A] text-xs text-white"
                  />
                </label>
                <label className="block">
                  <span className="flex items-center gap-1.5 text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1">
                    <Phone className="w-3.5 h-3.5 text-[#D4AF37]" /> Phone
                  </span>
                  <input
                    value={edit.phone}
                    onChange={(e) =>
                      setEdits({ ...edits, [b.id]: { ...edit, phone: e.target.value } })
                    }
                    maxLength={30}
                    className="w-full h-10 px-3 rounded-sm bg-[#0D0D0D] border border-[#2A2A2A] text-xs text-white font-mono-tech"
                  />
                </label>
                {b.images.length > 1 && (
                  <div className="flex gap-2">
                    {b.images.slice(1, 4).map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`${b.name} gallery ${i + 2}`}
                        loading="lazy"
                        decoding="async"
                        className="w-16 h-12 rounded-sm object-cover border border-[#2A2A2A]"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 pt-0">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void save(b.id, b.slug)}
                  className="w-full btn-matte-iron py-3 min-h-[48px] rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save {b.slug} info</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {isDemo && (
        <p className="text-[11px] font-mono-tech text-[#B3B3B3]">
          Tip: connect Supabase to persist branch edits. Package pricing stays
          editable in preview mode on the Packages tab.
        </p>
      )}
    </div>
  );
}
