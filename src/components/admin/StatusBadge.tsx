import React from "react";
import type { BookingStatus } from "@/lib/bookings";

/**
 * Color-coded booking status badge (shared by member + admin UIs).
 * Pending = amber/gold glow · Confirmed = green · Rejected = muted red ·
 * Completed = gray · Cancelled = dim outline.
 */
const STYLES: Record<BookingStatus, string> = {
  pending:
    "bg-[#D4AF37]/15 border-[#D4AF37]/60 text-[#E8C766] shadow-[0_0_12px_rgba(212,175,55,0.3)]",
  confirmed: "bg-emerald-500/15 border-emerald-500/50 text-emerald-400",
  rejected: "bg-red-500/12 border-red-500/40 text-red-400/90",
  completed: "bg-[#2A2A2A]/60 border-[#3D3D3D] text-[#B3B3B3]",
  cancelled: "bg-transparent border-[#2A2A2A] text-[#B3B3B3]/70",
};

export default function StatusBadge({ status }: { status: BookingStatus }) {
  const pulse = status === "pending" ? "animate-pulse" : "";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border font-mono-tech text-[10px] font-bold uppercase tracking-widest ${STYLES[status]} ${pulse}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
