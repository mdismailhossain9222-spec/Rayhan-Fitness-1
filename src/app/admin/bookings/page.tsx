"use client";

/**
 * /admin/bookings — booking request management.
 * Filter by status/branch/trainer/date/search, expandable rows with member
 * notes + contact info, Confirm / Reject / Complete actions (each writes a
 * member notification). Deep-linkable via ?focus=<bookingId> from the bell.
 */

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  X,
  BadgeCheck,
  ChevronDown,
  Phone,
  Calendar,
  Clock,
  User,
  MapPin,
  Loader2,
  Filter,
} from "lucide-react";
import AdminGuard, { AdminSkeleton } from "@/components/admin/AdminGuard";
import StatusBadge from "@/components/admin/StatusBadge";
import { useAdminData } from "@/hooks/useAdminData";
import {
  updateBookingStatus,
  type BookingRow,
  type BookingStatus,
} from "@/lib/bookings";
import { useAuthToast } from "@/components/auth/AuthToast";

const STATUS_TABS: Array<"all" | BookingStatus> = [
  "all",
  "pending",
  "confirmed",
  "rejected",
  "completed",
  "cancelled",
];

function BookingsInner() {
  const params = useSearchParams();
  const focusId = params.get("focus");
  const { notify, notifyAuthError } = useAuthToast();
  const { loading, bookings, branches, trainers, refresh } = useAdminData();
  const [status, setStatus] = useState<string>("all");
  const [branchId, setBranchId] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    // Intentional: expand row when focusId prop changes (e.g., from URL)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (focusId) setExpanded(focusId);
  }, [focusId]);

  const filtered = useMemo(() => {
    let rows = [...bookings];
    if (status !== "all") rows = rows.filter((r) => r.status === status);
    if (branchId) {
      rows = rows.filter(
        (r) =>
          r.branch_id === branchId ||
          DEMO_SLUG(r.branch_slug) === branchId
      );
    }
    if (trainerId) rows = rows.filter((r) => r.trainer_id === trainerId);
    if (dateFrom) rows = rows.filter((r) => r.preferred_date >= dateFrom);
    if (dateTo) rows = rows.filter((r) => r.preferred_date <= dateTo);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.member_name ?? "").toLowerCase().includes(s) ||
          (r.trainer_name ?? "").toLowerCase().includes(s) ||
          (r.session_type ?? "").toLowerCase().includes(s)
      );
    }
    return rows;
  }, [bookings, status, branchId, trainerId, dateFrom, dateTo, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: bookings.length };
    bookings.forEach((b) => {
      c[b.status] = (c[b.status] ?? 0) + 1;
    });
    return c;
  }, [bookings]);

  const act = async (row: BookingRow, next: BookingStatus) => {
    setActing(`${row.id}:${next}`);
    try {
      await updateBookingStatus(row.id, next);
      notify(
        "success",
        `Booking ${next}`,
        `${row.member_name ?? "Member"} was notified in their dashboard.`
      );
      await refresh();
    } catch (err) {
      notifyAuthError(err, "Couldn't update booking");
    } finally {
      setActing(null);
    }
  };

  if (loading) return <AdminSkeleton />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
            {filtered.length} of {bookings.length} requests
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wider uppercase">
            Bookings
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="btn-matte-iron px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-bold uppercase tracking-widest"
        >
          Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`px-4 py-2.5 min-h-[44px] rounded-sm font-mono-tech text-xs font-bold uppercase tracking-wider border transition-all ${
              status === s
                ? "bg-[#D4AF37] border-[#E8C766] text-[#0A0A0A]"
                : "bg-[#121212] border-[#2A2A2A] text-[#B3B3B3] hover:text-white"
            }`}
          >
            {s} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-sm bg-[#111111] border border-[#2A2A2A]">
        <div className="col-span-2 lg:col-span-1 flex items-center gap-2 text-[11px] font-mono-tech uppercase tracking-widest text-[#B3B3B3]">
          <Filter className="w-4 h-4 text-[#D4AF37]" /> Filters
        </div>
        <select
          aria-label="Filter by branch"
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="h-11 px-3 rounded-sm bg-[#0D0D0D] border border-[#2A2A2A] text-xs text-white"
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by trainer"
          value={trainerId}
          onChange={(e) => setTrainerId(e.target.value)}
          className="h-11 px-3 rounded-sm bg-[#0D0D0D] border border-[#2A2A2A] text-xs text-white"
        >
          <option value="">All trainers</option>
          {trainers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="From date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-11 px-3 rounded-sm bg-[#0D0D0D] border border-[#2A2A2A] text-xs text-white [color-scheme:dark]"
        />
        <input
          type="text"
          aria-label="Search member or trainer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search member / trainer…"
          className="h-11 px-3 rounded-sm bg-[#0D0D0D] border border-[#2A2A2A] text-xs text-white placeholder:text-[#B3B3B3]/60"
        />
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-xs font-mono-tech text-[#B3B3B3] py-10">
            No bookings match these filters.
          </p>
        )}
        {filtered.map((b) => {
          const isOpen = expanded === b.id;
          return (
            <article
              key={b.id}
              className={`rounded-sm border overflow-hidden transition-colors ${
                focusId === b.id
                  ? "border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                  : "border-[#2A2A2A]"
              } bg-[#111111]`}
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : b.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 text-left min-h-[64px]"
              >
                {b.member_avatar ? (
                  <img
                    src={b.member_avatar}
                    alt={b.member_name ?? "Member"}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 rounded-sm object-cover border border-[#2A2A2A] shrink-0"
                  />
                ) : (
                  <span className="w-10 h-10 rounded-sm bg-[#1a1a1a] border border-[#2A2A2A] flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-[#D4AF37]" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-white truncate">
                    {b.member_name ?? "Member"}
                    <span className="text-[#B3B3B3] font-normal">
                      {" "}
                      → {b.trainer_name ?? "Trainer"}
                    </span>
                  </span>
                  <span className="block text-[11px] font-mono-tech text-[#B3B3B3] mt-0.5 truncate">
                    {b.branch_name} · {b.preferred_date} · {b.session_type}
                  </span>
                </span>
                <span className="hidden md:block">
                  <StatusBadge status={b.status} />
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[#B3B3B3] shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-[#222] space-y-4">
                  <div className="md:hidden pt-3">
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                    <span className="flex items-center gap-2 text-[#B3B3B3]">
                      <Calendar className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      {b.preferred_date}
                    </span>
                    <span className="flex items-center gap-2 text-[#B3B3B3]">
                      <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      {b.preferred_time_slot}
                    </span>
                    <span className="flex items-center gap-2 text-[#B3B3B3]">
                      <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      {b.branch_name}
                    </span>
                    {b.member_phone ? (
                      <a
                        href={`tel:${b.member_phone.replace(/[^+\d]/g, "")}`}
                        className="flex items-center gap-2 text-white hover:text-[#D4AF37] font-mono-tech"
                      >
                        <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                        {b.member_phone}
                      </a>
                    ) : (
                      <span className="flex items-center gap-2 text-[#B3B3B3]">
                        <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                        No phone on file
                      </span>
                    )}
                  </div>
                  {b.note && (
                    <p className="text-xs text-[#F5F5F5]/90 leading-relaxed p-3 rounded-sm bg-[#0D0D0D] border border-[#222]">
                      <span className="font-mono-tech text-[10px] uppercase tracking-widest text-[#D4AF37] block mb-1">
                        Member note
                      </span>
                      {b.note}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {(b.status === "pending" || b.status === "rejected") && (
                      <ActionButton
                        busy={acting === `${b.id}:confirmed`}
                        onClick={() => void act(b, "confirmed")}
                        className="bg-emerald-500/15 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/25"
                        icon={<Check className="w-4 h-4" />}
                        label="Confirm"
                      />
                    )}
                    {b.status === "pending" && (
                      <ActionButton
                        busy={acting === `${b.id}:rejected`}
                        onClick={() => void act(b, "rejected")}
                        className="bg-red-500/10 border-red-500/40 text-red-400/90 hover:bg-red-500/20"
                        icon={<X className="w-4 h-4" />}
                        label="Reject"
                      />
                    )}
                    {b.status === "confirmed" && (
                      <ActionButton
                        busy={acting === `${b.id}:completed`}
                        onClick={() => void act(b, "completed")}
                        className="bg-[#D4AF37]/15 border-[#D4AF37]/60 text-[#E8C766] hover:bg-[#D4AF37]/25"
                        icon={<BadgeCheck className="w-4 h-4" />}
                        label="Mark completed"
                      />
                    )}
                    {(b.status === "pending" || b.status === "confirmed") && (
                      <ActionButton
                        busy={acting === `${b.id}:cancelled`}
                        onClick={() => void act(b, "cancelled")}
                        className="bg-transparent border-[#2A2A2A] text-[#B3B3B3] hover:text-white"
                        icon={<X className="w-4 h-4" />}
                        label="Cancel"
                      />
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

/** Maps a branch slug back to a demo branch id for legacy-shaped rows. */
function DEMO_SLUG(slug: string | undefined): string {
  if (!slug) return "";
  return `demo-branch-${slug}`;
}

function ActionButton({
  busy,
  onClick,
  className,
  icon,
  label,
}: {
  busy: boolean;
  onClick: () => void;
  className: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`px-4 py-2.5 min-h-[44px] rounded-sm border text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50 ${className}`}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      <span>{label}</span>
    </button>
  );
}

export default function AdminBookingsPage() {
  return (
    <AdminGuard>
      <Suspense
        fallback={
          <div className="font-mono-tech text-xs text-[#D4AF37] py-10 text-center animate-pulse">
            Loading bookings…
          </div>
        }
      >
        <BookingsInner />
      </Suspense>
    </AdminGuard>
  );
}
