"use client";

/**
 * useAdminNotifications() — LIVE admin bell feed.
 * Supabase mode: subscribes via Realtime (`postgres_changes` on INSERT
 * into `bookings`) + polls the `notifications` table for the dropdown.
 * Demo mode: listens to the localStorage-backed store events.
 * Returns { notifications, unreadCount, loading, refresh, markAllRead,
 *          flash } — `flash` pulses true on every NEW arrival so the UI
 * can toast + ping.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  listAdminNotifications,
  markNotificationsRead,
  onDemoStoreChange,
  type NotificationRow,
} from "@/lib/bookings";

export function useAdminNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<NotificationRow | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const rows = await listAdminNotifications(30);
      // Detect genuinely NEW arrivals (skip everything on first load).
      if (!firstLoad.current) {
        const fresh = rows.find((r) => !seenIds.current.has(r.id));
        if (fresh) setFlash(fresh);
      }
      firstLoad.current = false;
      rows.forEach((r) => seenIds.current.add(r.id));
      setNotifications(rows);
    } catch {
      // Bell stays quiet on failure — never breaks the panel.
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    // Intentional: manage loading state and subscriptions when enabled changes
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    void refresh();

    if (isSupabaseConfigured) {
      // LIVE: new booking row → refresh the admin queue instantly.
      const supabase = createClient();
      const channel = supabase
        .channel("rf-admin-bookings")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "bookings" },
          () => void refresh()
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          () => void refresh()
        )
        .subscribe();
      // Safety net poll (30s) in case the socket drops silently.
      const poll = window.setInterval(() => void refresh(), 30000);
      return () => {
        window.clearInterval(poll);
        void supabase.removeChannel(channel);
      };
    }
    // Demo mode: same-tab + cross-tab store events.
    return onDemoStoreChange((key) => {
      if (key.includes("notifications") || key.includes("bookings")) {
        void refresh();
      }
    });
  }, [enabled, refresh]);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unread.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markNotificationsRead(unread);
    } catch {
      // Optimistic UI already applied.
    }
  }, [notifications]);

  const clearFlash = useCallback(() => setFlash(null), []);

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.is_read).length,
    loading,
    refresh,
    markAllRead,
    flash,
    clearFlash,
  };
}
