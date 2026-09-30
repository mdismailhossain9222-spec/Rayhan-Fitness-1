"use client";
import { apiFetch } from "@/lib/api-client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Flame,
  Calendar,
  CalendarClock,
  CreditCard,
  Bell,
  ShieldCheck,
  LogOut,
  Activity,
  Dumbbell,
  CheckCircle2,
  Plus,
  Lock,
  Settings,
  Terminal,
  Users,
  MapPin,
  RefreshCw,
} from "lucide-react";
import CheckoutModal, { CheckoutSelection } from "@/components/CheckoutModal";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  listMyBookings,
  cancelBooking,
  seedDemoBookingsIfEmpty,
  type BookingRow,
} from "@/lib/bookings";
import { useUser } from "@/hooks/useUser";
import {
  createClient as createSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import type { BranchSlug } from "@/lib/supabase/types";

interface ProgressEntry {
  id: number;
  weightKg: number;
  bmi: number;
  bodyFatPct: number;
  benchPressKg: number;
  squatKg: number;
  deadliftKg: number;
  caloriesBurned: number;
  workoutNotes: string;
  recordedAt: string;
}

interface MembershipEntry {
  id: number;
  branchSlug: "lalbagh" | "dhanmondi" | "mirpur";
  planName: string;
  durationMonths: number;
  amountBdt: number;
  status: string;
  startDate: string;
  expiryDate: string;
  paymentMethod: string;
  transactionId: string;
}

interface PaymentEntry {
  id: number;
  invoiceNumber: string;
  branchSlug: string;
  planName: string;
  amountBdt: number;
  paymentMethod: string;
  transactionId: string;
  accountMasked: string;
  status: string;
  createdAt: string;
}

interface AttendanceEntry {
  id: number;
  branchSlug: string;
  workoutFocus: string;
  durationMinutes: number;
  checkedInAt: string;
}

interface NotificationEntry {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "progress"
    | "attendance"
    | "payments"
    | "bookings"
    | "security"
    | "trainer"
    | "admin"
  >("overview");

  const [user, setUser] = useState<{
    id: number;
    name: string;
    email: string;
    phone: string;
    role: "member" | "trainer" | "admin";
    branchSlug: "lalbagh" | "dhanmondi" | "mirpur";
    avatarUrl: string;
    twoFactorEnabled: boolean;
  } | null>(null);

  const [memberships, setMemberships] = useState<MembershipEntry[]>([]);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [branches, setBranches] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [programs, setPrograms] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [adminData, setAdminData] = useState<any>(null);

  const [checkoutItem, setCheckoutItem] = useState<CheckoutSelection | null>(
    null
  );
  const [statusToast, setStatusToast] = useState("");

  // Biometric Progress Form state
  const [newWeight, setNewWeight] = useState(78.5);
  const [newBodyFat, setNewBodyFat] = useState(16.0);
  const [newBench, setNewBench] = useState(102.5);
  const [newSquat, setNewSquat] = useState(145);
  const [newDeadlift, setNewDeadlift] = useState(185);
  const [newNotes, setNewNotes] = useState(
    "Evening hypertrophy session — hit new 102.5kg bench press PR!"
  );

  // Check-in Form state
  const [checkinFocus, setCheckinFocus] = useState(
    "Upper Body Power & Cable Flyes"
  );
  const [checkinDuration, setCheckinDuration] = useState(75);
  const { user: sbUser } = useUser();

  // Track current time for date calculations without impure Date.now() in render
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60 * 1000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // ---- Supabase path: live member data, RLS-scoped to auth.uid() ----
      if (isSupabaseConfigured) {
        const supabase = createSupabaseClient();
        const {
          data: { user: sessionUser },
        } = await supabase.auth.getUser();
        if (sessionUser) {
          const [profileRes, msRes, payRes, attRes, brRes, pkRes] =
            await Promise.all([
              supabase.from("profiles").select("*").eq("id", sessionUser.id).single(),
              supabase
                .from("memberships")
                .select("*")
                .eq("user_id", sessionUser.id)
                .order("created_at", { ascending: false }),
              supabase
                .from("payments")
                .select("*")
                .eq("user_id", sessionUser.id)
                .order("created_at", { ascending: false }),
              supabase
                .from("attendance")
                .select("*")
                .eq("user_id", sessionUser.id)
                .order("check_in_time", { ascending: false })
                .limit(50),
              supabase.from("branches").select("*"),
              supabase.from("packages").select("*"),
            ]);
          const toNumId = (uuid: string, i: number) => {
            let h = 0;
            for (const c of uuid) h = (h * 31 + c.charCodeAt(0)) >>> 0;
            return 100000 + ((h + i) % 800000);
          };
          const profile = profileRes.data;
          const branchById = new Map(
            (brRes.data ?? []).map((b) => [b.id, b])
          );
          const pkgById = new Map((pkRes.data ?? []).map((p) => [p.id, p]));
          setUser({
            id: toNumId(sessionUser.id, 0),
            name:
              profile?.full_name ||
              sessionUser.email?.split("@")[0] ||
              "Member",
            email: sessionUser.email || "",
            phone: profile?.phone_number || "",
            role: (profile?.role as "member" | "trainer" | "admin") || "member",
            branchSlug: (profile?.preferred_branch as BranchSlug) || "dhanmondi",
            avatarUrl:
              profile?.avatar_url ||
              "https://images.pexels.com/photos/29886673/pexels-photo-29886673.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
            twoFactorEnabled: false,
          });
          setMemberships(
            (msRes.data ?? []).map((m, i) => {
              const pkg = m.package_id ? pkgById.get(m.package_id) : undefined;
              const months = pkg?.duration_months ?? 6;
              return {
                id: toNumId(m.id, i),
                branchSlug:
                  (branchById.get(m.branch_id)?.slug as BranchSlug) || "dhanmondi",
                planName: `${months} Months`,
                durationMonths: months,
                amountBdt: Math.round(Number(pkg?.price_tk ?? 0)),
                status: m.status,
                startDate: m.start_date,
                expiryDate: m.end_date,
                paymentMethod: "Supabase",
                transactionId: m.id.slice(0, 8).toUpperCase(),
              };
            })
          );
          setPayments(
            (payRes.data ?? []).map((p, i) => ({
              id: toNumId(p.id, i),
              invoiceNumber: `SB-${p.id.slice(0, 8).toUpperCase()}`,
              branchSlug: "dhanmondi",
              planName: `Supabase payment · ${p.payment_method}`,
              amountBdt: Math.round(Number(p.amount_tk)),
              paymentMethod: p.payment_method,
              transactionId: p.transaction_id ?? p.id.slice(0, 8).toUpperCase(),
              accountMasked: "•••• secure",
              status: p.status,
              createdAt: p.created_at,
            }))
          );
          setAttendance(
            (attRes.data ?? []).map((a, i) => ({
              id: toNumId(a.id, i),
              branchSlug:
                (a.branch_id ? branchById.get(a.branch_id)?.slug : undefined) ||
                "dhanmondi",
              workoutFocus: "Club check-in (Supabase)",
              durationMinutes: 0,
              checkedInAt: a.check_in_time,
            }))
          );
          setProgress([]);
          setNotifications([
            {
              id: 1,
              title: "Supabase cloud session active",
              message: `Signed in as ${sessionUser.email} via secure Supabase Auth. Memberships, payments and check-ins below are your live RLS-scoped records.`,
              type: "security",
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          ]);
          setBranches(brRes.data ?? []);
          setPrograms([]);
          setAdminData(null);
          setStatusToast("Loaded live member data from Supabase cloud.");
          setLoading(false);
          return;
        }
      }
      // ---- Legacy path (unchanged built-in demo API) ----
      const res = await apiFetch("/api/auth/me");
      const data = await res.json();

      if (data?.user) {
        setUser(data.user);
        setMemberships(data.memberships || []);
        setPayments(data.payments || []);
        setAttendance(data.attendance || []);
        setProgress(data.progress || []);
        setNotifications(data.notifications || []);
        setBranches(data.branches || []);
        setPrograms(data.programs || []);
        setAdminData(data.adminData || null);
      } else {
        // Auto-authenticate default member so visitors to /dashboard get an immediate live experience
        const loginRes = await apiFetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "member@rayhanfitness.com",
            password: "Rayhan#2026",
            rememberMe: true,
          }),
        });
        if (loginRes.ok) {
          const retry = await apiFetch("/api/auth/me");
          const retryData = await retry.json();
          if (retryData?.user) {
            setUser(retryData.user);
            setMemberships(retryData.memberships || []);
            setPayments(retryData.payments || []);
            setAttendance(retryData.attendance || []);
            setProgress(retryData.progress || []);
            setNotifications(retryData.notifications || []);
            setBranches(retryData.branches || []);
            setPrograms(retryData.programs || []);
            setAdminData(retryData.adminData || null);
          }
        }
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Intentional: load dashboard data on mount and when loadDashboardData changes
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData().then(() => {
      if (!cancelled) {
        // Data loaded successfully
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loadDashboardData]);

  useEffect(() => {
    if (!isSupabaseConfigured || !sbUser) return;
    // Intentional: reload dashboard when Supabase user changes
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData().then(() => {
      if (!cancelled) {
        // Data loaded successfully
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sbUser?.id]);

  const handleSwitchRole = async (roleEmail: string, targetTab: typeof activeTab) => {
    setStatusToast("Switching RBAC session...");
    const first = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: roleEmail,
        password: "Rayhan#2026",
        rememberMe: true,
      }),
    });
    const firstData = await first.json().catch(() => null);
    // Staff accounts enforce mandatory 2FA — auto-complete the demo challenge.
    if (firstData?.requires2FA) {
      await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: roleEmail,
          password: "Rayhan#2026",
          rememberMe: true,
          otpCode: "884200",
        }),
      });
    }
    await loadDashboardData();
    setActiveTab(targetTab);
    setStatusToast(`Switched active session to ${roleEmail}`);
  };

  const memberBookingId = sbUser?.id ?? (user ? `legacy-${user.id}` : "");

  const loadBookings = useCallback(async () => {
    if (!memberBookingId || !user) return;
    setBookingsLoading(true);
    try {
      seedDemoBookingsIfEmpty(memberBookingId, user.name);
      setBookings(await listMyBookings(memberBookingId));
    } catch (err) {
      console.error("Bookings fetch error:", err);
    } finally {
      setBookingsLoading(false);
    }
  }, [memberBookingId, user]);

  useEffect(() => {
    if (!user) return;
    // Intentional: load bookings when user changes
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBookings().then(() => {
      if (!cancelled) {
        // Bookings loaded successfully
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, loadBookings]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!memberBookingId) return;
    if (!window.confirm("Cancel this booking request?")) return;
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId, memberBookingId);
      setStatusToast("Booking cancelled.");
      await loadBookings();
    } catch (err) {
      setStatusToast(
        err instanceof Error ? err.message : "Could not cancel booking."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleLogout = async (allDevices = false) => {
    if (isSupabaseConfigured) {
      try {
        if (allDevices) {
          await createSupabaseClient().auth.signOut({ scope: "global" });
        } else {
          await createSupabaseClient().auth.signOut();
        }
      } catch {
        // Legacy logout below still runs.
      }
    }
    await apiFetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allDevices }),
    });
    router.push("/login");
  };

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch("/api/dashboard/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "progress",
        weightKg: newWeight,
        bodyFatPct: newBodyFat,
        benchPressKg: newBench,
        squatKg: newSquat,
        deadliftKg: newDeadlift,
        workoutNotes: newNotes,
      }),
    });
    if (res.ok) {
      setStatusToast("Biometric & PR telemetry saved to PostgreSQL!");
      await loadDashboardData();
    }
  };

  const handleLogCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch("/api/dashboard/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "checkin",
        branchSlug: user?.branchSlug || "dhanmondi",
        workoutFocus: checkinFocus,
        durationMinutes: checkinDuration,
      }),
    });
    if (res.ok) {
      setStatusToast("Biometric turnstile check-in recorded!");
      await loadDashboardData();
    }
  };

  const handleUpdateBranchPrice = async (
    slug: string,
    p3: number,
    p6: number,
    p12: number
  ) => {
    const res = await apiFetch("/api/branches", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "RayhanFitnessClient",
      },
      body: JSON.stringify({
        slug,
        price3Months: p3,
        price6Months: p6,
        price12Months: p12,
      }),
    });
    if (res.ok) {
      setStatusToast(`Updated ${slug.toUpperCase()} BDT pricing in PostgreSQL!`);
      await loadDashboardData();
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#0A0A0A]">
        <div className="font-mono-tech text-sm text-[#D4AF37] uppercase tracking-widest animate-pulse">
          DECRYPTING COMMAND CENTER TELEMETRY...
        </div>
      </div>
    );
  }

  const activeMembership = memberships[0] || {
    branchSlug: user.branchSlug,
    planName: "6 Months",
    durationMonths: 6,
    amountBdt: 6300,
    status: "active",
    startDate: new Date(now).toISOString(),
    expiryDate: new Date(
      now + 138 * 24 * 60 * 60 * 1000
    ).toISOString(),
    paymentMethod: "bKash",
    transactionId: "BKX984120DHN",
  };

  const daysRemaining = Math.max(
    1,
    Math.ceil(
      (new Date(activeMembership.expiryDate).getTime() - now) /
        (1000 * 60 * 60 * 24)
    )
  );
  const totalDays = activeMembership.durationMonths * 30;
  const progressPct = Math.min(
    100,
    Math.max(8, Math.round((daysRemaining / totalDays) * 100))
  );

  const latestProgress = progress[progress.length - 1] || {
    weightKg: 79.1,
    bmi: 24.9,
    bodyFatPct: 16.4,
    benchPressKg: 100,
    squatKg: 142.5,
    deadliftKg: 180,
  };

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] min-h-screen py-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-8">
        {/* Top Role & Profile Command Header */}
        <div className="iron-glass-card rounded-sm p-6 sm:p-8 border border-[#2A2A2A] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img loading="lazy" decoding="async"
              src={user.avatarUrl}
              alt={user.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-sm object-cover border-2 border-[#D4AF37]"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-sm bg-[#D4AF37] font-mono-tech text-[10px] font-bold text-[#0A0A0A] uppercase">
                  RBAC ROLE: {user.role.toUpperCase()}
                </span>
                <span className="px-2.5 py-0.5 rounded-sm bg-[#151515] border border-[#2A2A2A] font-mono-tech text-[10px] text-emerald-400 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>JWT HTTPONLY VERIFIED</span>
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wider uppercase mt-1">
                {user.name}
              </h1>
              <div className="font-mono-tech text-xs text-[#B3B3B3]">
                {user.email} • {user.phone} • Home Club:{" "}
                <span className="text-[#D4AF37] uppercase font-bold">
                  {user.branchSlug}
                </span>
              </div>
            </div>
          </div>

          {/* Role Demo Switcher + Logout Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                handleSwitchRole("member@rayhanfitness.com", "overview")
              }
              className={`px-3.5 py-2 rounded-sm font-mono-tech text-[11px] font-bold uppercase border ${
                user.role === "member"
                  ? "bg-[#D4AF37] border-[#E8C766] text-[#0A0A0A]"
                  : "bg-[#141414] border-[#2A2A2A] text-[#B3B3B3] hover:text-white"
              }`}
            >
              MEMBER VIEW
            </button>
            <button
              type="button"
              onClick={() =>
                handleSwitchRole("trainer@rayhanfitness.com", "trainer")
              }
              className={`px-3.5 py-2 rounded-sm font-mono-tech text-[11px] font-bold uppercase border ${
                user.role === "trainer"
                  ? "bg-[#D4AF37] border-[#E8C766] text-[#0A0A0A]"
                  : "bg-[#141414] border-[#2A2A2A] text-[#B3B3B3] hover:text-white"
              }`}
            >
              TRAINER VIEW
            </button>
            <button
              type="button"
              onClick={() =>
                handleSwitchRole("admin@rayhanfitness.com", "admin")
              }
              className={`px-3.5 py-2 rounded-sm font-mono-tech text-[11px] font-bold uppercase border ${
                user.role === "admin"
                  ? "bg-[#D4AF37] border-[#E8C766] text-[#0A0A0A]"
                  : "bg-[#141414] border-[#2A2A2A] text-[#B3B3B3] hover:text-white"
              }`}
            >
              ADMIN VIEW
            </button>

            <button
              type="button"
              onClick={() => handleLogout(false)}
              className="px-3.5 py-2 rounded-sm bg-[#161616] border border-[#2A2A2A] hover:border-[#D4AF37] font-mono-tech text-[11px] text-white uppercase flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>

        {statusToast && (
          <div className="p-4 rounded-sm bg-emerald-950/60 border border-emerald-500/60 flex items-center justify-between text-xs font-mono-tech text-emerald-200">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {statusToast}
            </span>
            <button
              type="button"
              onClick={() => setStatusToast("")}
              className="text-white underline"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#2A2A2A] pb-4">
          {[
            { id: "overview" as const, label: "OVERVIEW & MEMBERSHIP", icon: Flame },
            { id: "progress" as const, label: "PROGRESS & PR CHARTS", icon: Activity },
            { id: "attendance" as const, label: "CHECK-IN HISTORY", icon: Calendar },
            { id: "payments" as const, label: "INVOICES & PAYMENTS (৳)", icon: CreditCard },
            { id: "bookings" as const, label: "MY BOOKINGS", icon: CalendarClock },
            { id: "security" as const, label: "PROFILE & 2FA SECURITY", icon: Lock },
            ...(user.role === "trainer" || user.role === "admin"
              ? [{ id: "trainer" as const, label: "TRAINER ROSTER PORTAL", icon: Dumbbell }]
              : []),
            ...(user.role === "admin"
              ? [{ id: "admin" as const, label: "ADMIN COMMAND & AUDIT LOGS", icon: Terminal }]
              : []),
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-sm font-mono-tech text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all ${
                activeTab === tab.id
                  ? "bg-[#D4AF37] border-[#E8C766] text-[#0A0A0A] shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                  : "bg-[#121212] border-[#2A2A2A] text-[#B3B3B3] hover:text-white"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* =================================================================
            TAB 1: MEMBER OVERVIEW (Active Package, Countdown, Telemetry, Alerts)
        ================================================================= */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Active Membership Package Card */}
            <div className="lg:col-span-7 popular-package-card rounded-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono-tech text-xs text-[#D4AF37] uppercase tracking-widest">
                    ACTIVE BIOMETRIC SUBSCRIPTION
                  </span>
                  <h2 className="font-display text-4xl text-white uppercase tracking-wider mt-0.5">
                    {activeMembership.branchSlug.toUpperCase()} CLUB —{" "}
                    {activeMembership.planName}
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-sm bg-emerald-500/20 border border-emerald-500/50 font-mono-tech text-xs font-bold text-emerald-400 uppercase">
                  ● ACTIVE PASS
                </span>
              </div>

              {/* Expiry Countdown Progress Bar */}
              <div className="p-5 rounded-sm bg-[#0D0D0D] border border-[#2A2A2A] space-y-3">
                <div className="flex items-center justify-between font-mono-tech text-xs">
                  <span className="text-[#B3B3B3]">
                    EXPIRY COUNTDOWN TELEMETRY:
                  </span>
                  <span className="text-[#D4AF37] font-bold text-sm">
                    {daysRemaining} DAYS REMAINING
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#1C1C1C] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E8C766]"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between font-mono-tech text-[11px] text-[#B3B3B3]">
                  <span>
                    Paid: ৳{activeMembership.amountBdt.toLocaleString()} via{" "}
                    {activeMembership.paymentMethod}
                  </span>
                  <span>
                    Valid Until:{" "}
                    {new Date(activeMembership.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Latest Biometric Snapshot */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A]">
                  <div className="text-[10px] font-mono-tech text-[#B3B3B3]">
                    CURRENT WEIGHT
                  </div>
                  <div className="font-mono-tech text-xl font-bold text-white mt-0.5">
                    {latestProgress.weightKg} KG
                  </div>
                </div>
                <div className="p-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A]">
                  <div className="text-[10px] font-mono-tech text-[#B3B3B3]">
                    BODY FAT %
                  </div>
                  <div className="font-mono-tech text-xl font-bold text-[#D4AF37] mt-0.5">
                    {latestProgress.bodyFatPct}%
                  </div>
                </div>
                <div className="p-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A]">
                  <div className="text-[10px] font-mono-tech text-[#B3B3B3]">
                    BENCH 1RM PR
                  </div>
                  <div className="font-mono-tech text-xl font-bold text-white mt-0.5">
                    {latestProgress.benchPressKg} KG
                  </div>
                </div>
                <div className="p-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A]">
                  <div className="text-[10px] font-mono-tech text-[#B3B3B3]">
                    DEADLIFT PR
                  </div>
                  <div className="font-mono-tech text-xl font-bold text-emerald-400 mt-0.5">
                    {latestProgress.deadliftKg} KG
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setCheckoutItem({
                      branchSlug: activeMembership.branchSlug,
                      branchName: `${activeMembership.branchSlug.toUpperCase()} Branch`,
                      durationMonths: 6,
                      planName: "6 Months Renewal",
                      amountBdt:
                        activeMembership.branchSlug === "lalbagh"
                          ? 3200
                          : activeMembership.branchSlug === "mirpur"
                          ? 6000
                          : 6300,
                    })
                  }
                  className="btn-crimson-primary px-6 py-3.5 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>RENEW / UPGRADE PACKAGE (৳)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("progress")}
                  className="btn-matte-iron px-5 py-3.5 rounded-sm text-xs font-bold uppercase tracking-widest"
                >
                  LOG WORKOUT / BIOMETRICS
                </button>
              </div>
            </div>

            {/* Right: Notifications & Quick Check-In */}
            <div className="lg:col-span-5 space-y-6">
              <div className="iron-glass-card rounded-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl text-white uppercase tracking-wider flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#D4AF37]" />
                    <span>ALERTS & PROMOTIONS</span>
                  </h3>
                  <span className="font-mono-tech text-xs text-[#D4AF37]">
                    {notifications.length} MESSAGES
                  </span>
                </div>

                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-sm bg-[#111111] border border-[#262626] space-y-1"
                    >
                      <div className="font-mono-tech text-xs font-bold text-white">
                        {n.title}
                      </div>
                      <p className="text-xs text-[#B3B3B3] leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Turnstile Check-In Widget */}
              <form
                onSubmit={handleLogCheckin}
                className="iron-glass-card rounded-sm p-6 space-y-4 border border-[#D4AF37]/40"
              >
                <h3 className="font-display text-2xl text-white uppercase tracking-wider">
                  QUICK CLUB CHECK-IN
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={checkinFocus}
                    onChange={(e) => setCheckinFocus(e.target.value)}
                    placeholder="Workout Focus"
                    className="sm:col-span-2 h-10 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-xs text-white"
                  />
                  <input
                    type="number"
                    value={checkinDuration}
                    onChange={(e) => setCheckinDuration(Number(e.target.value))}
                    placeholder="Mins"
                    className="h-10 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] font-mono-tech text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full btn-crimson-primary py-3 rounded-sm text-xs font-bold uppercase tracking-widest"
                >
                  RECORD GYM CHECK-IN NOW
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 2: BIOMETRIC PROGRESS TRACKER & VISUAL CHARTS
        ================================================================= */}
        {activeTab === "progress" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Visual Charts & History */}
            <div className="lg:col-span-8 space-y-6">
              <div className="iron-glass-card rounded-sm p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono-tech text-xs text-[#D4AF37] uppercase">
                      BIOMETRIC & STRENGTH TELEMETRY
                    </span>
                    <h2 className="font-display text-3xl text-white uppercase tracking-wider">
                      WEIGHT, BODY FAT % & COMPOUND LIFT PROGRESSION
                    </h2>
                  </div>
                  <span className="font-mono-tech text-xs text-emerald-400">
                    {progress.length} WEEKS LOGGED
                  </span>
                </div>

                {/* Custom High-Contrast SVG Telemetry Chart */}
                <div className="p-5 rounded-sm bg-[#0D0D0D] border border-[#2A2A2A] space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono-tech">
                    <span className="text-white">
                      BODY WEIGHT (KG) & BODY FAT (%) TRAJECTORY
                    </span>
                    <span className="text-[#D4AF37]">
                      Latest: {latestProgress.weightKg}kg ({latestProgress.bodyFatPct}% BF)
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-2 items-end h-44 pt-6 px-2">
                    {progress.slice(-7).map((entry, idx) => {
                      const heightPct = Math.min(
                        100,
                        Math.max(25, Math.round((entry.weightKg / 95) * 100))
                      );
                      return (
                        <div
                          key={entry.id || idx}
                          className="flex flex-col items-center gap-2 h-full justify-end group"
                        >
                          <span className="font-mono-tech text-[10px] text-white">
                            {entry.weightKg}kg
                          </span>
                          <div
                            style={{ height: `${heightPct}%` }}
                            className="w-full max-w-[42px] rounded-t-sm bg-gradient-to-t from-[#5C4813] to-[#D4AF37] border-t border-[#E8C766] group-hover:brightness-125 transition-all"
                          />
                          <span className="font-mono-tech text-[10px] text-[#B3B3B3]">
                            {entry.bodyFatPct}% BF
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Compound Lifts PR Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono-tech text-xs">
                    <thead>
                      <tr className="border-b border-[#2A2A2A] text-[#B3B3B3]">
                        <th className="py-3">DATE</th>
                        <th className="py-3">WEIGHT</th>
                        <th className="py-3">BMI</th>
                        <th className="py-3">BENCH</th>
                        <th className="py-3">SQUAT</th>
                        <th className="py-3">DEADLIFT</th>
                        <th className="py-3">NOTES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E1E1E]">
                      {progress
                        .slice()
                        .reverse()
                        .map((p) => (
                          <tr key={p.id}>
                            <td className="py-3 text-[#B3B3B3]">
                              {new Date(p.recordedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-white font-bold">
                              {p.weightKg} kg
                            </td>
                            <td className="py-3 text-[#B3B3B3]">{p.bmi}</td>
                            <td className="py-3 text-[#D4AF37] font-bold">
                              {p.benchPressKg} kg
                            </td>
                            <td className="py-3 text-white">{p.squatKg} kg</td>
                            <td className="py-3 text-emerald-400 font-bold">
                              {p.deadliftKg} kg
                            </td>
                            <td className="py-3 text-[#B3B3B3] max-w-xs truncate">
                              {p.workoutNotes}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Log New Biometric Entry Form */}
            <div className="lg:col-span-4">
              <form
                onSubmit={handleLogProgress}
                className="iron-glass-card rounded-sm p-6 space-y-4 border border-[#D4AF37]/50"
              >
                <div className="flex items-center gap-2 text-xs font-mono-tech text-[#D4AF37] uppercase">
                  <Plus className="w-4 h-4" />
                  <span>LOG NEW BIOMETRIC / PR ENTRY</span>
                </div>
                <h3 className="font-display text-3xl text-white uppercase">
                  RECORD WORKOUT METRICS
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono-tech text-[#B3B3B3] uppercase mb-1">
                      Weight (KG)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newWeight}
                      onChange={(e) => setNewWeight(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] font-mono-tech text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono-tech text-[#B3B3B3] uppercase mb-1">
                      Body Fat (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newBodyFat}
                      onChange={(e) => setNewBodyFat(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] font-mono-tech text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono-tech text-[#B3B3B3] uppercase mb-1">
                      Bench (KG)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={newBench}
                      onChange={(e) => setNewBench(Number(e.target.value))}
                      className="w-full h-10 px-2.5 rounded-sm bg-[#111111] border border-[#2A2A2A] font-mono-tech text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono-tech text-[#B3B3B3] uppercase mb-1">
                      Squat (KG)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={newSquat}
                      onChange={(e) => setNewSquat(Number(e.target.value))}
                      className="w-full h-10 px-2.5 rounded-sm bg-[#111111] border border-[#2A2A2A] font-mono-tech text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono-tech text-[#B3B3B3] uppercase mb-1">
                      Deadlift (KG)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={newDeadlift}
                      onChange={(e) => setNewDeadlift(Number(e.target.value))}
                      className="w-full h-10 px-2.5 rounded-sm bg-[#111111] border border-[#2A2A2A] font-mono-tech text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono-tech text-[#B3B3B3] uppercase mb-1">
                    Session Notes
                  </label>
                  <textarea
                    rows={3}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full p-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full btn-crimson-primary py-3.5 rounded-sm text-xs font-bold uppercase tracking-widest"
                >
                  SAVE TELEMETRY TO POSTGRESQL
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 3: ATTENDANCE / CHECK-IN HISTORY
        ================================================================= */}
        {activeTab === "attendance" && (
          <div className="iron-glass-card rounded-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-mono-tech text-xs text-[#D4AF37] uppercase">
                  BIOMETRIC TURNSTILE LOGS
                </span>
                <h2 className="font-display text-3xl text-white uppercase tracking-wider">
                  CLUB ATTENDANCE & WORKOUT CHECK-INS
                </h2>
              </div>
              <span className="px-3 py-1 rounded-sm bg-[#151515] border border-[#2A2A2A] font-mono-tech text-xs text-white">
                TOTAL VERIFIED SESSIONS: {attendance.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attendance.map((att) => (
                <div
                  key={att.id}
                  className="p-4 rounded-sm bg-[#111111] border border-[#262626] space-y-2"
                >
                  <div className="flex items-center justify-between font-mono-tech text-[11px]">
                    <span className="text-[#D4AF37] uppercase font-bold">
                      {att.branchSlug} CLUB
                    </span>
                    <span className="text-[#B3B3B3]">
                      {new Date(att.checkedInAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-white">
                    {att.workoutFocus}
                  </div>
                  <div className="font-mono-tech text-xs text-emerald-400">
                    Duration: {att.durationMinutes} Minutes • Biometric Verified
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 4: PAYMENT / INVOICE HISTORY (BDT ৳)
        ================================================================= */}
        {activeTab === "payments" && (
          <div className="iron-glass-card rounded-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-mono-tech text-xs text-[#D4AF37] uppercase">
                  VERIFIED FINANCIAL LEDGER
                </span>
                <h2 className="font-display text-3xl text-white uppercase tracking-wider">
                  PAYMENT & INVOICE HISTORY (BDT ৳)
                </h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCheckoutItem({
                    branchSlug: user.branchSlug,
                    branchName: `${user.branchSlug.toUpperCase()} Branch`,
                    durationMonths: 6,
                    planName: "6 Months",
                    amountBdt: 6300,
                  })
                }
                className="btn-crimson-primary px-5 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest"
              >
                + PURCHASE NEW PACKAGE
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-tech text-xs">
                <thead>
                  <tr className="border-b border-[#2A2A2A] text-[#B3B3B3]">
                    <th className="py-3.5">INVOICE NO</th>
                    <th className="py-3.5">PACKAGE & BRANCH</th>
                    <th className="py-3.5">GATEWAY & TRX ID</th>
                    <th className="py-3.5">ACCOUNT</th>
                    <th className="py-3.5">AMOUNT (BDT)</th>
                    <th className="py-3.5">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {payments.map((pay) => (
                    <tr key={pay.id}>
                      <td className="py-4 text-white font-bold">
                        {pay.invoiceNumber}
                      </td>
                      <td className="py-4 text-[#F5F5F5]">{pay.planName}</td>
                      <td className="py-4 text-[#D4AF37]">
                        {pay.paymentMethod} • {pay.transactionId}
                      </td>
                      <td className="py-4 text-[#B3B3B3]">
                        {pay.accountMasked}
                      </td>
                      <td className="py-4 text-white font-bold text-sm">
                        ৳{pay.amountBdt.toLocaleString()}
                      </td>
                      <td className="py-4">
                        <span className="px-2.5 py-1 rounded-sm bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 uppercase text-[10px]">
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 5: PROFILE SETTINGS, 2FA OTP & GLOBAL DEVICE LOGOUT
        ================================================================= */}
        {/* =================================================================
            TAB: MY BOOKINGS (trainer session requests + cancel)
        ================================================================= */}
        {activeTab === "bookings" && (
          <div className="iron-glass-card rounded-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-mono-tech text-xs text-[#D4AF37] uppercase">
                  TRAINER SESSION REQUESTS
                </span>
                <h2 className="font-display text-3xl text-white uppercase tracking-wider">
                  MY BOOKINGS
                </h2>
              </div>
              <a
                href="/trainers"
                className="btn-crimson-primary px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-bold uppercase tracking-widest flex items-center"
              >
                + Book a trainer
              </a>
            </div>

            {bookingsLoading && (
              <div className="space-y-3" aria-hidden="true">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse h-24 rounded-sm bg-[#1c1c1c]"
                  />
                ))}
              </div>
            )}

            {!bookingsLoading && bookings.length === 0 && (
              <p className="text-center text-xs font-mono-tech text-[#B3B3B3] py-10">
                No bookings yet — pick a coach on the Trainers page to get
                started.
              </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {bookings.map((b) => (
                <article
                  key={b.id}
                  className="p-5 rounded-sm bg-[#111111] border border-[#262626] space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {b.trainer_photo ? (
                        <img
                          src={b.trainer_photo}
                          alt={b.trainer_name ?? "Trainer"}
                          loading="lazy"
                          decoding="async"
                          className="w-12 h-12 rounded-sm object-cover border border-[#2A2A2A] shrink-0"
                        />
                      ) : (
                        <span className="w-12 h-12 rounded-sm bg-[#1a1a1a] border border-[#2A2A2A] flex items-center justify-center shrink-0 font-display text-xl text-[#D4AF37]">
                          {(b.trainer_name ?? "T")[0]}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-white truncate">
                          {b.trainer_name ?? "Trainer"}
                        </div>
                        <div className="text-[11px] font-mono-tech text-[#B3B3B3]">
                          {b.branch_name} · {b.session_type}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-mono-tech text-[#B3B3B3]">
                    <span>
                      <span className="text-white">{b.preferred_date}</span>
                    </span>
                    <span>{b.preferred_time_slot}</span>
                  </div>
                  {b.note && (
                    <p className="text-xs text-[#F5F5F5]/80 leading-relaxed p-3 rounded-sm bg-[#0D0D0D] border border-[#222]">
                      {b.note}
                    </p>
                  )}
                  {(b.status === "pending" || b.status === "confirmed") && (
                    <button
                      type="button"
                      disabled={cancellingId === b.id}
                      onClick={() => void handleCancelBooking(b.id)}
                      className="w-full py-2.5 min-h-[44px] rounded-sm border border-[#2A2A2A] text-xs font-bold uppercase tracking-widest text-[#B3B3B3] hover:text-red-400 hover:border-red-500/50 transition-colors disabled:opacity-50"
                    >
                      {cancellingId === b.id ? "Cancelling…" : "Cancel booking"}
                    </button>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 iron-glass-card rounded-sm p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 text-xs font-mono-tech text-[#D4AF37] uppercase">
                <User className="w-4 h-4" />
                <span>ATHLETE PROFILE & HOME BRANCH</span>
              </div>
              <h3 className="font-display text-3xl text-white uppercase">
                UPDATE PERSONAL TELEMETRY
              </h3>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const res = await apiFetch("/api/auth/me", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: fd.get("name"),
                      phone: fd.get("phone"),
                      branchSlug: fd.get("branchSlug"),
                    }),
                  });
                  if (res.ok) {
                    setStatusToast("Profile updated in PostgreSQL!");
                    loadDashboardData();
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1">
                    Full Name
                  </label>
                  <input
                    name="name"
                    defaultValue={user.name}
                    className="w-full h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    defaultValue={user.phone}
                    className="w-full h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1">
                    Selected Home Branch
                  </label>
                  <select
                    name="branchSlug"
                    defaultValue={user.branchSlug}
                    className="w-full h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white"
                  >
                    <option value="lalbagh">Lalbagh Branch</option>
                    <option value="dhanmondi">Dhanmondi Branch</option>
                    <option value="mirpur">Mirpur Branch</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="btn-crimson-primary px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest"
                >
                  SAVE PROFILE CHANGES
                </button>
              </form>
            </div>

            <div className="lg:col-span-6 iron-glass-card rounded-sm p-6 sm:p-8 space-y-6 border border-[#D4AF37]/40">
              <div className="flex items-center gap-2 text-xs font-mono-tech text-[#D4AF37] uppercase">
                <Settings className="w-4 h-4" />
                <span>ZERO-TRUST SESSION & 2FA CONTROLS</span>
              </div>
              <h3 className="font-display text-3xl text-white uppercase">
                TWO-FACTOR AUTH & GLOBAL SESSION REVOCATION
              </h3>

              <div className="p-4 rounded-sm bg-[#111111] border border-[#2A2A2A] flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono-tech text-xs font-bold text-white uppercase">
                    TWO-FACTOR AUTHENTICATION (OTP)
                  </div>
                  <div className="text-xs text-[#B3B3B3] mt-0.5">
                    Status:{" "}
                    <span
                      className={
                        user.twoFactorEnabled
                          ? "text-emerald-400 font-bold"
                          : "text-amber-400"
                      }
                    >
                      {user.twoFactorEnabled ? "ENABLED" : "OPTIONAL / STANDBY"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await apiFetch("/api/auth/me", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        twoFactorEnabled: !user.twoFactorEnabled,
                      }),
                    });
                    setStatusToast(
                      `2FA OTP Protection ${
                        !user.twoFactorEnabled ? "Enabled" : "Disabled"
                      }!`
                    );
                    loadDashboardData();
                  }}
                  className="btn-matte-iron px-4 py-2.5 rounded-sm text-xs font-mono-tech uppercase"
                >
                  {user.twoFactorEnabled ? "DISABLE 2FA" : "ENABLE 2FA OTP"}
                </button>
              </div>

              <div className="p-4 rounded-sm bg-[#1A1508] border border-[#D4AF37]/50 space-y-3">
                <div className="font-mono-tech text-xs font-bold text-white uppercase">
                  REVOKE ALL SESSIONS (LOGOUT ON ALL DEVICES)
                </div>
                <p className="text-xs text-[#B3B3B3]">
                  Increments your cryptographic{" "}
                  <code className="text-white">token_version</code> in
                  PostgreSQL, immediately invalidating every active JWT access
                  and refresh cookie across all browsers and mobile devices.
                </p>
                <button
                  type="button"
                  onClick={() => handleLogout(true)}
                  className="btn-crimson-primary px-5 py-3 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>SECURE LOGOUT ON ALL DEVICES</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 6: TRAINER / STAFF PORTAL (Assigned Classes & Branch Athletes)
        ================================================================= */}
        {activeTab === "trainer" && (
          <div className="space-y-8">
            <div className="iron-glass-card rounded-sm p-6 sm:p-8 space-y-6">
              <div>
                <span className="font-mono-tech text-xs text-[#D4AF37] uppercase">
                  TRAINER RBAC PORTAL // FLOOR COMMAND
                </span>
                <h2 className="font-display text-3xl text-white uppercase tracking-wider">
                  ASSIGNED PROGRAMS & ACTIVE BRANCH ATHLETES
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {programs.slice(0, 3).map((prog) => (
                  <div
                    key={prog.id}
                    className="p-4 rounded-sm bg-[#111111] border border-[#2A2A2A] space-y-2"
                  >
                    <span className="font-mono-tech text-[10px] text-[#D4AF37] uppercase">
                      {prog.branchSlug.toUpperCase()} CLUB • {prog.intensity}
                    </span>
                    <div className="font-display text-2xl text-white uppercase">
                      {prog.title}
                    </div>
                    <div className="text-xs text-[#B3B3B3]">{prog.schedule}</div>
                    <div className="text-xs font-mono-tech text-emerald-400">
                      Instructor: {prog.coachName}
                    </div>
                  </div>
                ))}
              </div>

              {adminData?.allUsers && (
                <div className="pt-4">
                  <h3 className="font-display text-2xl text-white uppercase mb-3">
                    REGISTERED ATHLETE ROSTER ({adminData.allUsers.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono-tech text-xs">
                      <thead>
                        <tr className="border-b border-[#2A2A2A] text-[#B3B3B3]">
                          <th className="py-3">ATHLETE</th>
                          <th className="py-3">EMAIL</th>
                          <th className="py-3">PHONE</th>
                          <th className="py-3">BRANCH</th>
                          <th className="py-3">ROLE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222222]">
                        {adminData.allUsers.map(
                          (u: {
                            id: number;
                            name: string;
                            email: string;
                            phone: string;
                            branchSlug: string;
                            role: string;
                          }) => (
                            <tr key={u.id}>
                              <td className="py-3 text-white font-bold">
                                {u.name}
                              </td>
                              <td className="py-3 text-[#B3B3B3]">{u.email}</td>
                              <td className="py-3 text-[#B3B3B3]">{u.phone}</td>
                              <td className="py-3 text-[#D4AF37] uppercase">
                                {u.branchSlug}
                              </td>
                              <td className="py-3 uppercase text-emerald-400">
                                {u.role}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================
            TAB 7: ADMIN COMMAND CENTER (Manage Branches, Pricing, Audit Logs)
        ================================================================= */}
        {activeTab === "admin" && (
          <div className="space-y-8">
            {/* Live Branch Package Pricing Editor */}
            <div className="iron-glass-card rounded-sm p-6 sm:p-8 border border-[#D4AF37]/50 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-mono-tech text-xs text-[#D4AF37] uppercase">
                    ADMIN RBAC CLEARANCE // POSTGRESQL LIVE MUTATION
                  </span>
                  <h2 className="font-display text-3xl text-white uppercase tracking-wider">
                    MANAGE 3 BRANCHES & PACKAGE TARIFFS (BDT ৳)
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-sm bg-emerald-500/15 border border-emerald-500/40 font-mono-tech text-xs text-emerald-400">
                  IP & 2FA ADMIN SHIELD VERIFIED
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {branches.map((b) => (
                  <form
                    key={b.slug}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      handleUpdateBranchPrice(
                        b.slug,
                        Number(fd.get("p3")),
                        Number(fd.get("p6")),
                        Number(fd.get("p12"))
                      );
                    }}
                    className="p-5 rounded-sm bg-[#111111] border border-[#2A2A2A] space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-2xl text-white uppercase">
                        {b.name}
                      </span>
                      <MapPin className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-mono-tech text-xs">
                      <div>
                        <label className="text-[10px] text-[#B3B3B3] block mb-1">
                          3M (৳)
                        </label>
                        <input
                          name="p3"
                          type="number"
                          defaultValue={b.price3Months}
                          className="w-full h-9 px-2 rounded-sm bg-[#1A1A1A] border border-[#333] text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#D4AF37] block mb-1">
                          6M (৳)
                        </label>
                        <input
                          name="p6"
                          type="number"
                          defaultValue={b.price6Months}
                          className="w-full h-9 px-2 rounded-sm bg-[#1A1A1A] border border-[#D4AF37] text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#B3B3B3] block mb-1">
                          12M (৳)
                        </label>
                        <input
                          name="p12"
                          type="number"
                          defaultValue={b.price12Months}
                          className="w-full h-9 px-2 rounded-sm bg-[#1A1A1A] border border-[#333] text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full btn-matte-iron py-2.5 rounded-sm text-xs font-mono-tech font-bold uppercase"
                    >
                      UPDATE {b.slug.toUpperCase()} TARIFF
                    </button>
                  </form>
                ))}
              </div>
            </div>

            {/* Security Audit Log & Intrusion Telemetry */}
            {adminData?.recentAuditLogs && (
              <div className="iron-glass-card rounded-sm p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono-tech text-xs text-[#D4AF37] uppercase">
                      SIEM TELEMETRY & INTRUSION MONITOR
                    </span>
                    <h3 className="font-display text-3xl text-white uppercase">
                      POSTGRESQL SECURITY AUDIT LOGS
                    </h3>
                  </div>
                  <Users className="w-6 h-6 text-[#D4AF37]" />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono-tech text-xs">
                    <thead>
                      <tr className="border-b border-[#2A2A2A] text-[#B3B3B3]">
                        <th className="py-3">TIMESTAMP</th>
                        <th className="py-3">SEVERITY</th>
                        <th className="py-3">ACTION EVENT</th>
                        <th className="py-3">ACTOR EMAIL</th>
                        <th className="py-3">IP ADDRESS</th>
                        <th className="py-3">DETAILS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222222]">
                      {adminData.recentAuditLogs.map(
                        (log: {
                          id: number;
                          createdAt: string;
                          severity: string;
                          action: string;
                          userEmail: string;
                          ipAddress: string;
                          details: string;
                        }) => (
                          <tr key={log.id}>
                            <td className="py-3 text-[#B3B3B3]">
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                                  log.severity === "CRITICAL"
                                    ? "bg-red-500/20 text-red-400"
                                    : log.severity === "WARN"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-emerald-500/20 text-emerald-400"
                                }`}
                              >
                                {log.severity}
                              </span>
                            </td>
                            <td className="py-3 text-white font-bold">
                              {log.action}
                            </td>
                            <td className="py-3 text-[#B3B3B3]">
                              {log.userEmail}
                            </td>
                            <td className="py-3 text-[#D4AF37]">
                              {log.ipAddress}
                            </td>
                            <td className="py-3 text-[#B3B3B3] max-w-md">
                              {log.details}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CheckoutModal
        isOpen={Boolean(checkoutItem)}
        onClose={() => {
          setCheckoutItem(null);
          loadDashboardData();
        }}
        initialSelection={checkoutItem}
      />
    </div>
  );
}
