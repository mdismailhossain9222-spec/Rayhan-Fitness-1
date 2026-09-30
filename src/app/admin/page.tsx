"use client";

/**
 * /admin — overview dashboard: key stat cards, pending-booking spotlight,
 * members-per-branch chart, recent bookings. Data via useAdminData.
 */

import React from "react";
import Link from "next/link";
import {
  Users,
  Flame,
  CalendarClock,
  Banknote,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import AdminGuard, { AdminSkeleton, DemoNotice } from "@/components/admin/AdminGuard";
import StatusBadge from "@/components/admin/StatusBadge";
import { useAdminData } from "@/hooks/useAdminData";

function Overview() {
  const {
    loading,
    isDemo,
    members,
    memberships,
    bookings,
    payments,
    legacyAdmin,
    refresh,
    demoAdminLogin,
  } = useAdminData();

  if (loading) return <AdminSkeleton />;

  const activeMemberships = memberships.filter((m) => m.status === "active").length;
  const pending = bookings.filter((b) => b.status === "pending");
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const revenueMonth = payments
    .filter(
      (p) =>
        p.status === "paid" &&
        p.created_at &&
        new Date(p.created_at) >= monthStart
    )
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const branchCounts = ["lalbagh", "dhanmondi", "mirpur"].map((slug) => ({
    slug,
    label: slug === "lalbagh" ? "Lalbagh" : slug === "dhanmondi" ? "Dhanmondi" : "Mirpur",
    count: members.filter((m) => (m.branch ?? "").toLowerCase() === slug).length,
  }));
  const maxCount = Math.max(1, ...branchCounts.map((b) => b.count));

  const stats = [
    {
      icon: Users,
      label: "Total Members",
      value: String(members.length),
      sub: "registered profiles",
      href: "/admin/members",
      urgent: false,
    },
    {
      icon: Flame,
      label: "Active Memberships",
      value: String(activeMemberships),
      sub: "currently training",
      href: "/admin/payments",
      urgent: false,
    },
    {
      icon: CalendarClock,
      label: "Pending Bookings",
      value: String(pending.length),
      sub: pending.length > 0 ? "needs your review" : "all clear",
      href: "/admin/bookings",
      urgent: pending.length > 0,
    },
    {
      icon: Banknote,
      label: "Revenue This Month",
      value: `৳${revenueMonth.toLocaleString()}`,
      sub: "paid transactions",
      href: "/admin/payments",
      urgent: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
            Command overview
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wider uppercase">
            Dashboard
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="btn-matte-iron px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-bold uppercase tracking-widest"
        >
          Refresh data
        </button>
      </div>

      {isDemo && !legacyAdmin && <DemoNotice onLogin={demoAdminLogin} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`group p-5 rounded-sm border transition-all hover:-translate-y-0.5 ${
              s.urgent
                ? "bg-[#1a1408] border-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.3)] animate-pulse"
                : "bg-[#111111] border-[#2A2A2A] hover:border-[#D4AF37]/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <s.icon
                className={`w-6 h-6 ${s.urgent ? "text-[#D4AF37]" : "text-[#D4AF37]/80"}`}
              />
              <ArrowUpRight className="w-4 h-4 text-[#B3B3B3] group-hover:text-[#D4AF37] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <div className="font-display text-4xl text-white mt-3">{s.value}</div>
            <div className="text-xs font-bold text-white uppercase tracking-widest mt-1">
              {s.label}
            </div>
            <div className="text-[11px] font-mono-tech text-[#B3B3B3]">{s.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Members per branch */}
        <div className="p-5 sm:p-6 rounded-sm bg-[#111111] border border-[#2A2A2A] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-white tracking-wider uppercase">
              Members per branch
            </h2>
            <Link
              href="/admin/members"
              className="text-[11px] font-mono-tech uppercase tracking-widest text-[#D4AF37] hover:text-white flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {branchCounts.map((b) => (
              <div key={b.slug}>
                <div className="flex justify-between text-xs font-mono-tech mb-1.5">
                  <span className="text-white uppercase">{b.label}</span>
                  <span className="text-[#D4AF37] font-bold">
                    {b.count} member{b.count === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-[#1c1c1c] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#8A6D1F] via-[#D4AF37] to-[#E8C766] transition-all duration-700"
                    style={{ width: `${Math.max(4, (b.count / maxCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent bookings */}
        <div className="p-5 sm:p-6 rounded-sm bg-[#111111] border border-[#2A2A2A] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-white tracking-wider uppercase">
              Latest booking requests
            </h2>
            <Link
              href="/admin/bookings"
              className="text-[11px] font-mono-tech uppercase tracking-widest text-[#D4AF37] hover:text-white flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {bookings.length === 0 && (
            <p className="text-xs font-mono-tech text-[#B3B3B3] py-6 text-center">
              No booking requests yet.
            </p>
          )}
          <div className="space-y-2">
            {bookings.slice(0, 5).map((b) => (
              <Link
                key={b.id}
                href={`/admin/bookings?focus=${b.id}`}
                className="flex items-center gap-3 p-3 rounded-sm bg-[#0D0D0D] border border-[#222] hover:border-[#D4AF37]/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">
                    {b.member_name ?? "Member"} → {b.trainer_name ?? "Trainer"}
                  </div>
                  <div className="text-[11px] font-mono-tech text-[#B3B3B3] mt-0.5">
                    {b.preferred_date} · {b.session_type}
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  return (
    <AdminGuard>
      <Overview />
    </AdminGuard>
  );
}
