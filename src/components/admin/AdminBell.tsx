"use client";

/**
 * AdminBell — realtime notification bell for the admin top bar.
 * Gold unread-count badge, dropdown of recent arrivals, click-through
 * to the booking, mark-all-read, toast + subtle ping on new arrivals.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, CalendarClock, X } from "lucide-react";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useAuthToast } from "@/components/auth/AuthToast";

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ping() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
    window.setTimeout(() => void ctx.close(), 700);
  } catch {
    // Audio is optional garnish.
  }
}

export default function AdminBell() {
  const { notifications, unreadCount, markAllRead, flash, clearFlash } =
    useAdminNotifications(true);
  const { notify } = useAuthToast();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // New arrival → toast + ping (only while the panel is open/active).
  useEffect(() => {
    if (!flash) return;
    notify("info", flash.title, flash.message);
    ping();
    clearFlash();
  }, [flash, notify, clearFlash]);

  // Close dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        className="relative min-w-[44px] min-h-[44px] w-11 h-11 rounded-sm bg-[#151515] border border-[#2A2A2A] hover:border-[#D4AF37] flex items-center justify-center text-[#B3B3B3] hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#D4AF37] text-[#0A0A0A] text-[10px] font-mono-tech font-bold flex items-center justify-center shadow-[0_0_12px_rgba(212,175,55,0.7)] animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="admin-bell-dropdown"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+10px)] w-[340px] max-w-[calc(100vw-2rem)] rounded-sm bg-[#0F0F0F] border border-[#2A2A2A] shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]">
              <span className="font-mono-tech text-xs font-bold text-white uppercase tracking-widest">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-[#D4AF37]">{unreadCount} new</span>
                )}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  title="Mark all as read"
                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#B3B3B3] hover:text-[#D4AF37]"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#B3B3B3] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-4 py-8 text-center text-xs font-mono-tech text-[#B3B3B3]">
                  No notifications yet — new booking requests appear here live.
                </p>
              )}
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={
                    n.related_id
                      ? `/admin/bookings?focus=${n.related_id}`
                      : "/admin/bookings"
                  }
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3.5 border-b border-[#1c1c1c] hover:bg-[#D4AF37]/8 transition-colors ${
                    !n.is_read ? "bg-[#D4AF37]/6" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 w-8 h-8 rounded-sm shrink-0 flex items-center justify-center border ${
                      !n.is_read
                        ? "bg-[#D4AF37]/15 border-[#D4AF37]/50"
                        : "bg-[#151515] border-[#2A2A2A]"
                    }`}
                  >
                    <CalendarClock className="w-4 h-4 text-[#D4AF37]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-white leading-snug">
                      {n.title}
                    </span>
                    <span className="block text-[11px] text-[#B3B3B3] leading-snug mt-0.5 line-clamp-2">
                      {n.message}
                    </span>
                    <span className="block text-[10px] font-mono-tech text-[#D4AF37]/80 mt-1">
                      {timeAgo(n.created_at)}
                      {!n.is_read && " · unread"}
                    </span>
                  </span>
                  {!n.is_read && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.9)] shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
