"use client";

/**
 * RAYHAN FITNESS — unified booking + notification data layer.
 * Supabase-first; when Supabase isn't configured (local preview) it falls
 * back to a localStorage demo store with the same shapes, so every UI
 * (member bookings, admin console, notification bell) works in both modes.
 */

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "completed"
  | "cancelled";

export interface BookingRow {
  id: string;
  user_id: string;
  trainer_id: string;
  branch_id: string;
  session_type: string;
  preferred_date: string;
  preferred_time_slot: string;
  note: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  // Joined display helpers (populated by list functions)
  trainer_name?: string;
  trainer_photo?: string | null;
  branch_name?: string;
  branch_slug?: string;
  member_name?: string;
  member_avatar?: string | null;
  member_phone?: string | null;
}

export interface NotificationRow {
  id: string;
  recipient_role: "admin" | "member";
  recipient_id: string | null;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface TrainerRow {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  specialty: string | null;
  branch_id: string | null;
  branch_slug?: string;
  branch_name?: string;
  bio: string | null;
  availability?: {
    days?: string[];
    slots?: string[];
  } | null;
  is_active?: boolean;
}

export const SESSION_TYPES = [
  "Personal Training",
  "Consultation",
  "Diet Planning",
  "Strength Assessment",
  "Recovery & Mobility",
] as const;

export const TIME_SLOTS = [
  "Morning (7:00 AM - 11:00 AM)",
  "Afternoon (3:00 PM - 5:00 PM)",
  "Evening (6:00 PM - 9:00 PM)",
] as const;

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function clean(v: string, max: number): string {
  return v.trim().replace(/<[^>]*>/g, "").slice(0, max);
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Demo fallback store (localStorage) — same shapes as Supabase rows
// ---------------------------------------------------------------------------
const LS_BOOKINGS = "rf_bookings_demo_v1";
const LS_NOTIFS = "rf_notifications_demo_v1";
const LS_TRAINERS = "rf_trainers_demo_v1";

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Notify same-tab listeners (admin bell) + other tabs via storage event.
    window.dispatchEvent(new CustomEvent("rf-demo-store", { detail: key }));
  } catch {
    // Storage full/blocked — non-fatal.
  }
}

export const DEMO_BRANCHES = [
  { id: "demo-branch-lalbagh", name: "Lalbagh Branch", slug: "lalbagh" },
  { id: "demo-branch-dhanmondi", name: "Dhanmondi Branch", slug: "dhanmondi" },
  { id: "demo-branch-mirpur", name: "Mirpur Branch", slug: "mirpur" },
] as const;

const DEMO_TRAINERS_SEED: TrainerRow[] = [
  {
    id: "demo-trainer-arif",
    name: "Arif Chowdhury",
    slug: "arif-chowdhury",
    photo_url:
      "https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600",
    specialty: "Strength & Powerlifting",
    branch_id: "demo-branch-lalbagh",
    branch_slug: "lalbagh",
    branch_name: "Lalbagh Branch",
    bio: "Head strength coach with 9 years under the bar.",
  },
  {
    id: "demo-trainer-nusrat",
    name: "Nusrat Jahan",
    slug: "nusrat-jahan",
    photo_url:
      "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600",
    specialty: "HIIT & Fat Loss",
    branch_id: "demo-branch-lalbagh",
    branch_slug: "lalbagh",
    branch_name: "Lalbagh Branch",
    bio: "Certified metabolic conditioning coach.",
  },
  {
    id: "demo-trainer-tanvir",
    name: "Tanvir Hasan",
    slug: "tanvir-hasan",
    photo_url:
      "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600",
    specialty: "Bodybuilding & Hypertrophy",
    branch_id: "demo-branch-dhanmondi",
    branch_slug: "dhanmondi",
    branch_name: "Dhanmondi Branch",
    bio: "Former national-level physique competitor.",
  },
  {
    id: "demo-trainer-mim",
    name: "Mim Akter",
    slug: "mim-akter",
    photo_url:
      "https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600",
    specialty: "Yoga & Mobility",
    branch_id: "demo-branch-dhanmondi",
    branch_slug: "dhanmondi",
    branch_name: "Dhanmondi Branch",
    bio: "E-RYT mobility specialist.",
  },
  {
    id: "demo-trainer-rakib",
    name: "Rakib Ahmed",
    slug: "rakib-ahmed",
    photo_url:
      "https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600",
    specialty: "CrossFit & Conditioning",
    branch_id: "demo-branch-mirpur",
    branch_slug: "mirpur",
    branch_name: "Mirpur Branch",
    bio: "CrossFit L2 trainer.",
  },
  {
    id: "demo-trainer-sadia",
    name: "Sadia Rahman",
    slug: "sadia-rahman",
    photo_url:
      "https://images.pexels.com/photos/3768918/pexels-photo-3768918.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=600",
    specialty: "Nutrition & Diet Planning",
    branch_id: "demo-branch-mirpur",
    branch_slug: "mirpur",
    branch_name: "Mirpur Branch",
    bio: "Sports nutritionist.",
  },
];

function demoTrainers(): TrainerRow[] {
  const stored = lsGet<TrainerRow[]>(LS_TRAINERS, []);
  if (stored.length > 0) return stored;
  lsSet(LS_TRAINERS, DEMO_TRAINERS_SEED);
  return [...DEMO_TRAINERS_SEED];
}

function demoBookings(): BookingRow[] {
  return lsGet<BookingRow[]>(LS_BOOKINGS, []);
}

function demoNotifs(): NotificationRow[] {
  return lsGet<NotificationRow[]>(LS_NOTIFS, []);
}

export function onDemoStoreChange(cb: (key: string) => void): () => void {
  const custom = (e: Event) =>
    cb((e as CustomEvent<string>).detail ?? "");
  const storage = (e: StorageEvent) => cb(e.key ?? "");
  window.addEventListener("rf-demo-store", custom);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener("rf-demo-store", custom);
    window.removeEventListener("storage", storage);
  };
}

// ---------------------------------------------------------------------------
// Trainers
// ---------------------------------------------------------------------------
export async function listTrainers(): Promise<TrainerRow[]> {
  if (isSupabaseConfigured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("trainers")
        .select("*, branches(id,name,slug)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((t) => {
        const b = (
          t as unknown as {
            branches: { id: string; name: string; slug: string } | null;
          }
        ).branches;
        const row = t as unknown as TrainerRow;
        return {
          ...row,
          branch_slug: b?.slug ?? row.branch_slug,
          branch_name: b?.name ?? row.branch_name,
        };
      });
    } catch {
      // Fall through to demo roster so the page never breaks.
    }
  }
  return demoTrainers();
}

// ---------------------------------------------------------------------------
// Bookings — member actions
// ---------------------------------------------------------------------------
export interface CreateBookingInput {
  trainer_id: string;
  branch_id: string;
  session_type: string;
  preferred_date: string;
  preferred_time_slot: string;
  note?: string;
}

export async function createBooking(
  input: CreateBookingInput,
  member: { id: string; name: string }
): Promise<BookingRow> {
  const payload = {
    trainer_id: clean(input.trainer_id, 60),
    branch_id: clean(input.branch_id, 60),
    session_type: clean(input.session_type, 60),
    preferred_date: clean(input.preferred_date, 12),
    preferred_time_slot: clean(input.preferred_time_slot, 80),
    note: input.note ? clean(input.note, 600) : null,
  };
  if (!payload.trainer_id || !payload.branch_id || !payload.session_type) {
    throw new Error("Please complete every required field.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.preferred_date)) {
    throw new Error("Please pick a valid date.");
  }
  if (payload.preferred_date < todayISO()) {
    throw new Error("Bookings can't be made for past dates.");
  }
  if (!payload.preferred_time_slot) {
    throw new Error("Please choose a time slot.");
  }

  if (isSupabaseConfigured) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bookings")
      .insert({ ...payload, user_id: member.id, status: "pending" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as BookingRow;
  }

  const trainers = demoTrainers();
  const trainer = trainers.find((t) => t.id === payload.trainer_id);
  const branch =
    DEMO_BRANCHES.find((b) => b.id === payload.branch_id) ??
    DEMO_BRANCHES.find((b) => b.slug === payload.branch_id);
  const now = new Date().toISOString();
  const row: BookingRow = {
    id: uid(),
    user_id: member.id,
    ...payload,
    status: "pending",
    created_at: now,
    updated_at: now,
    trainer_name: trainer?.name ?? "Trainer",
    trainer_photo: trainer?.photo_url ?? null,
    branch_name: branch?.name ?? "Branch",
    branch_slug: branch?.slug,
    member_name: member.name,
  };
  const all = demoBookings();
  all.unshift(row);
  lsSet(LS_BOOKINGS, all);

  // Mirror the DB trigger: admin notification for the new request.
  const notifs = demoNotifs();
  notifs.unshift({
    id: uid(),
    recipient_role: "admin",
    recipient_id: null,
    type: "new_booking",
    title: `New booking request from ${member.name}`,
    message: `${member.name} requested ${payload.session_type} with ${
      trainer?.name ?? "a trainer"
    } on ${payload.preferred_date} (${payload.preferred_time_slot}).`,
    related_id: row.id,
    is_read: false,
    created_at: now,
  });
  lsSet(LS_NOTIFS, notifs);
  return row;
}

export async function listMyBookings(memberId: string): Promise<BookingRow[]> {
  if (isSupabaseConfigured) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "*, trainers(id,name,photo_url), branches(id,name,slug)"
      )
      .eq("user_id", memberId)
      .order("preferred_date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((b) => {
      const r = b as unknown as BookingRow & {
        trainers: { name: string; photo_url: string | null } | null;
        branches: { name: string; slug: string } | null;
      };
      return {
        ...r,
        trainer_name: r.trainers?.name,
        trainer_photo: r.trainers?.photo_url ?? null,
        branch_name: r.branches?.name,
        branch_slug: r.branches?.slug,
      };
    });
  }
  return demoBookings()
    .filter((b) => b.user_id === memberId)
    .sort((a, b) => a.preferred_date.localeCompare(b.preferred_date));
}

export async function cancelBooking(
  bookingId: string,
  memberId: string
): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = createClient();
    const { data: existing, error: fetchErr } = await supabase
      .from("bookings")
      .select("id,user_id,status")
      .eq("id", bookingId)
      .single();
    if (fetchErr || !existing) throw new Error("Booking not found.");
    const row = existing as unknown as BookingRow;
    if (row.user_id !== memberId) throw new Error("Not your booking.");
    if (row.status !== "pending" && row.status !== "confirmed") {
      throw new Error("Only pending or confirmed bookings can be cancelled.");
    }
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);
    if (error) throw new Error(error.message);
    return;
  }
  const all = demoBookings();
  const idx = all.findIndex(
    (b) => b.id === bookingId && b.user_id === memberId
  );
  if (idx < 0) throw new Error("Booking not found.");
  if (all[idx].status !== "pending" && all[idx].status !== "confirmed") {
    throw new Error("Only pending or confirmed bookings can be cancelled.");
  }
  all[idx] = {
    ...all[idx],
    status: "cancelled",
    updated_at: new Date().toISOString(),
  };
  lsSet(LS_BOOKINGS, all);
}

// ---------------------------------------------------------------------------
// Bookings — admin actions
// ---------------------------------------------------------------------------
export interface BookingFilters {
  status?: string;
  branchId?: string;
  trainerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export async function listAllBookings(
  filters: BookingFilters = {}
): Promise<BookingRow[]> {
  if (isSupabaseConfigured) {
    const supabase = createClient();
    let q = supabase
      .from("bookings")
      .select(
        "*, trainers(id,name,photo_url), branches(id,name,slug), profiles!bookings_user_id_fkey(id,full_name,avatar_url,phone_number)"
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (filters.status && filters.status !== "all")
      q = q.eq("status", filters.status as BookingStatus);
    if (filters.branchId) q = q.eq("branch_id", filters.branchId);
    if (filters.trainerId) q = q.eq("trainer_id", filters.trainerId);
    if (filters.dateFrom) q = q.gte("preferred_date", filters.dateFrom);
    if (filters.dateTo) q = q.lte("preferred_date", filters.dateTo);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    let rows = (data ?? []).map((b) => {
      const r = b as unknown as BookingRow & {
        trainers: { name: string; photo_url: string | null } | null;
        branches: { name: string; slug: string } | null;
        profiles: {
          full_name: string | null;
          avatar_url: string | null;
          phone_number: string | null;
        } | null;
      };
      return {
        ...r,
        trainer_name: r.trainers?.name,
        trainer_photo: r.trainers?.photo_url ?? null,
        branch_name: r.branches?.name,
        branch_slug: r.branches?.slug,
        member_name: r.profiles?.full_name ?? "Member",
        member_avatar: r.profiles?.avatar_url ?? null,
        member_phone: r.profiles?.phone_number ?? null,
      };
    });
    if (filters.search) {
      const s = filters.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.member_name ?? "").toLowerCase().includes(s) ||
          (r.trainer_name ?? "").toLowerCase().includes(s) ||
          (r.session_type ?? "").toLowerCase().includes(s)
      );
    }
    return rows;
  }
  let rows = [...demoBookings()].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
  if (filters.status && filters.status !== "all") {
    rows = rows.filter((r) => r.status === filters.status);
  }
  if (filters.branchId) rows = rows.filter((r) => r.branch_id === filters.branchId);
  if (filters.trainerId) rows = rows.filter((r) => r.trainer_id === filters.trainerId);
  if (filters.dateFrom) rows = rows.filter((r) => r.preferred_date >= filters.dateFrom!);
  if (filters.dateTo) rows = rows.filter((r) => r.preferred_date <= filters.dateTo!);
  if (filters.search) {
    const s = filters.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.member_name ?? "").toLowerCase().includes(s) ||
        (r.trainer_name ?? "").toLowerCase().includes(s)
    );
  }
  return rows;
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: "booking_confirmed",
  rejected: "booking_rejected",
  completed: "booking_completed",
  cancelled: "booking_cancelled",
};

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  if (!["confirmed", "rejected", "completed", "cancelled"].includes(status)) {
    throw new Error("Invalid status transition.");
  }
  if (isSupabaseConfigured) {
    const supabase = createClient();
    const { data: existing, error: fetchErr } = await supabase
      .from("bookings")
      .select("id,user_id,session_type,preferred_date")
      .eq("id", bookingId)
      .single();
    if (fetchErr || !existing) throw new Error("Booking not found.");
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId);
    if (error) throw new Error(error.message);
    // Member-facing notification (visible instantly in their dashboard).
    const row = existing as unknown as {
      user_id: string;
      session_type: string;
      preferred_date: string;
    };
    await supabase.from("notifications").insert({
      recipient_role: "member",
      recipient_id: row.user_id,
      type: STATUS_LABEL[status] ?? "booking_updated",
      title: `Booking ${status}`,
      message: `Your ${row.session_type} session on ${row.preferred_date} was ${status}.`,
      related_id: bookingId,
    });
    return;
  }
  const all = demoBookings();
  const idx = all.findIndex((b) => b.id === bookingId);
  if (idx < 0) throw new Error("Booking not found.");
  all[idx] = {
    ...all[idx],
    status,
    updated_at: new Date().toISOString(),
  };
  lsSet(LS_BOOKINGS, all);
  const notifs = demoNotifs();
  notifs.unshift({
    id: uid(),
    recipient_role: "member",
    recipient_id: all[idx].user_id,
    type: STATUS_LABEL[status] ?? "booking_updated",
    title: `Booking ${status}`,
    message: `Your ${all[idx].session_type} session on ${all[idx].preferred_date} was ${status}.`,
    related_id: bookingId,
    is_read: false,
    created_at: new Date().toISOString(),
  });
  lsSet(LS_NOTIFS, notifs);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export async function listAdminNotifications(
  limit = 30
): Promise<NotificationRow[]> {
  if (isSupabaseConfigured) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_role", "admin")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as NotificationRow[];
  }
  return demoNotifs()
    .filter((n) => n.recipient_role === "admin")
    .slice(0, limit);
}

export async function listMemberNotifications(
  memberId: string,
  limit = 30
): Promise<NotificationRow[]> {
  if (isSupabaseConfigured) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", memberId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as NotificationRow[];
  }
  return demoNotifs()
    .filter((n) => n.recipient_id === memberId)
    .slice(0, limit);
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  if (isSupabaseConfigured) {
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids);
    if (error) throw new Error(error.message);
    return;
  }
  lsSet(
    LS_NOTIFS,
    demoNotifs().map((n) =>
      ids.includes(n.id) ? { ...n, is_read: true } : n
    )
  );
}

// ---------------------------------------------------------------------------
// Trainers — admin mutations (demo store; Supabase via direct queries)
// ---------------------------------------------------------------------------
export async function saveDemoTrainer(
  trainer: TrainerRow
): Promise<TrainerRow[]> {
  const all = demoTrainers();
  const idx = all.findIndex((t) => t.id === trainer.id);
  if (idx >= 0) all[idx] = trainer;
  else all.push(trainer);
  lsSet(LS_TRAINERS, all);
  return all;
}

export async function deleteDemoTrainer(id: string): Promise<TrainerRow[]> {
  const all = demoTrainers().filter((t) => t.id !== id);
  lsSet(LS_TRAINERS, all);
  return all;
}

export function seedDemoBookingsIfEmpty(memberId: string, memberName: string): void {
  if (isSupabaseConfigured) return;
  if (demoBookings().length > 0) return;
  const trainers = demoTrainers();
  const now = new Date().toISOString();
  const mk = (
    partial: Partial<BookingRow> & { trainer_id: string; branch_id: string }
  ): BookingRow => {
    const trainer = trainers.find((t) => t.id === partial.trainer_id);
    const branch = DEMO_BRANCHES.find((b) => b.id === partial.branch_id);
    return {
      id: uid(),
      user_id: memberId,
      session_type: "Personal Training",
      preferred_date: todayISO(),
      preferred_time_slot: TIME_SLOTS[2],
      note: null,
      status: "pending",
      created_at: now,
      updated_at: now,
      trainer_name: trainer?.name,
      trainer_photo: trainer?.photo_url ?? null,
      branch_name: branch?.name,
      branch_slug: branch?.slug,
      member_name: memberName,
      ...partial,
    } as BookingRow;
  };
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  lsSet(LS_BOOKINGS, [
    mk({
      trainer_id: "demo-trainer-tanvir",
      branch_id: "demo-branch-dhanmondi",
      session_type: "Personal Training",
      preferred_date: tomorrow,
      note: "First time, want to focus on chest + arms.",
      status: "pending",
    }),
    mk({
      trainer_id: "demo-trainer-sadia",
      branch_id: "demo-branch-mirpur",
      session_type: "Diet Planning",
      preferred_date: nextWeek,
      note: "Vegetarian cutting plan for Ramadan schedule.",
      status: "confirmed",
    }),
  ]);
}
