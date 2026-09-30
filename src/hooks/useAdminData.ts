"use client";

/**
 * useAdminData() — unified admin dataset with dual backends.
 * Supabase mode: live RLS-scoped queries (+ service-role member list).
 * Demo mode (no Supabase): legacy /api/branches + /api/auth/me adminData
 * + localStorage bookings, mapped into the same shapes.
 */

import { useCallback, useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useUser } from "./useUser";
import { apiFetch } from "@/lib/api-client";
import {
  listAllBookings,
  listTrainers,
  type BookingRow,
  type TrainerRow,
} from "@/lib/bookings";

export interface AdminMember {
  id: string;
  full_name: string | null;
  phone: string | null;
  branch: string | null;
  role: string;
  created_at: string;
}

export interface AdminBranch {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  images: string[];
  price3: number;
  price6: number;
  price12: number;
}

export interface AdminPackage {
  id: string;
  branch_id: string;
  branch_name: string;
  duration_months: number;
  price_tk: number;
  is_popular: boolean;
}

export interface AdminPayment {
  id: string;
  txn: string;
  method: string;
  amount: number;
  status: string;
  created_at: string;
  member: string | null;
}

export interface AdminMembership {
  id: string;
  branch_name: string;
  start: string;
  end: string;
  status: string;
  payment_status: string;
}

interface AdminData {
  loading: boolean;
  configured: boolean;
  isDemo: boolean;
  members: AdminMember[];
  trainers: TrainerRow[];
  branches: AdminBranch[];
  packages: AdminPackage[];
  payments: AdminPayment[];
  memberships: AdminMembership[];
  bookings: BookingRow[];
  legacyAdmin: boolean;
  refresh: () => Promise<void>;
  demoAdminLogin: () => Promise<boolean>;
}

export function useAdminData(): AdminData {
  const { user, loading: authLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [trainers, setTrainers] = useState<TrainerRow[]>([]);
  const [branches, setBranches] = useState<AdminBranch[]>([]);
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [memberships, setMemberships] = useState<AdminMembership[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [legacyAdmin, setLegacyAdmin] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && user) {
        const supabase = createClient();
        const [mRes, bRes, pRes, msRes, payRes, bk, tr] = await Promise.all([
          apiFetch("/api/admin/members").then((r) => r.json()),
          supabase.from("branches").select("*").order("name"),
          supabase.from("packages").select("*, branches(name)").order("price_tk"),
          supabase
            .from("memberships")
            .select("*, branches(name)")
            .order("created_at", { ascending: false })
            .limit(200),
          supabase
            .from("payments")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(200),
          listAllBookings().catch(() => [] as BookingRow[]),
          listTrainers().catch(() => [] as TrainerRow[]),
        ]);
        type Row = Record<string, unknown>;
        const asArr = (v: unknown): Row[] =>
          Array.isArray(v) ? (v as Row[]) : [];
        setMembers(
          asArr((mRes as Row).members).map((m) => ({
            id: String(m.id),
            full_name: (m.full_name as string) ?? null,
            phone: (m.phone_number as string) ?? null,
            branch: (m.preferred_branch as string) ?? null,
            role: String(m.role ?? "member"),
            created_at: String(m.created_at ?? ""),
          }))
        );
        const branchRows = asArr(bRes.data);
        setBranches(
          branchRows.map((b) => ({
            id: String(b.id),
            name: String(b.name),
            slug: String(b.slug ?? ""),
            address: (b.location_address as string) ?? null,
            phone: (b.phone as string) ?? null,
            images: Array.isArray(b.image_urls)
              ? (b.image_urls as string[])
              : [],
            price3: 0,
            price6: 0,
            price12: 0,
          }))
        );
        const pkgRows = asArr(pRes.data);
        const priceOf = (slug: string, months: number) => {
          const hit = pkgRows.find(
            (p) =>
              (p.branches as Row | null) !== undefined &&
              branchRows.find((b) => String(b.id) === String(p.branch_id))
                ?.slug === slug &&
              Number(p.duration_months) === months
          );
          return hit ? Math.round(Number(hit.price_tk)) : 0;
        };
        setBranches((prev) =>
          prev.map((b) => ({
            ...b,
            price3: priceOf(b.slug, 3),
            price6: priceOf(b.slug, 6),
            price12: priceOf(b.slug, 12),
          }))
        );
        setPackages(
          pkgRows.map((p) => ({
            id: String(p.id),
            branch_id: String(p.branch_id),
            branch_name:
              ((p.branches as Row | null)?.name as string) ?? "",
            duration_months: Number(p.duration_months),
            price_tk: Number(p.price_tk),
            is_popular: Boolean(p.is_popular),
          }))
        );
        setMemberships(
          asArr(msRes.data).map((m) => ({
            id: String(m.id),
            branch_name: ((m.branches as Row | null)?.name as string) ?? "",
            start: String(m.start_date ?? ""),
            end: String(m.end_date ?? ""),
            status: String(m.status ?? ""),
            payment_status: String(m.payment_status ?? ""),
          }))
        );
        setPayments(
          asArr(payRes.data).map((p) => ({
            id: String(p.id),
            txn:
              (p.transaction_id as string) ?? String(p.id).slice(0, 8),
            method: String(p.payment_method ?? ""),
            amount: Number(p.amount_tk ?? 0),
            status: String(p.status ?? ""),
            created_at: String(p.created_at ?? ""),
            member: null,
          }))
        );
        setBookings(bk);
        setTrainers(tr);
      } else if (!isSupabaseConfigured) {
        // ---- Demo mode: legacy APIs + local bookings ----
        const [bRes, meRes] = await Promise.all([
          apiFetch("/api/branches").then((r) => r.json()).catch(() => null),
          apiFetch("/api/auth/me").then((r) => r.json()).catch(() => null),
        ]);
        type Row = Record<string, unknown>;
        const legacyBranches = Array.isArray(bRes?.branches)
          ? (bRes.branches as Row[])
          : [];
        setBranches(
          legacyBranches.map((b) => ({
            id: String(b.slug ?? b.id),
            name: String(b.name ?? ""),
            slug: String(b.slug ?? ""),
            address: (b.address as string) ?? null,
            phone: (b.phone as string) ?? null,
            images: Array.isArray(b.gallery)
              ? (b.gallery as string[]).slice(0, 4)
              : [],
            price3: Number(b.price3Months ?? 0),
            price6: Number(b.price6Months ?? 0),
            price12: Number(b.price12Months ?? 0),
          }))
        );
        const pkgs: AdminPackage[] = [];
        legacyBranches.forEach((b) => {
          const bid = String(b.slug ?? b.id);
          const bname = String(b.name ?? "");
          ([
            [3, Number(b.price3Months ?? 0), false],
            [6, Number(b.price6Months ?? 0), true],
            [12, Number(b.price12Months ?? 0), false],
          ] as const).forEach(([months, price, pop]) => {
            pkgs.push({
              id: `demo-pkg-${bid}-${months}`,
              branch_id: bid,
              branch_name: bname,
              duration_months: months,
              price_tk: price,
              is_popular: pop,
            });
          });
        });
        setPackages(pkgs);
        const adminData = meRes?.adminData as
          | {
              allUsers?: Row[];
              allPayments?: Row[];
              allMemberships?: Row[];
            }
          | null
          | undefined;
        setLegacyAdmin(
          Boolean(adminData) && meRes?.user?.role === "admin"
        );
        setMembers(
          (adminData?.allUsers ?? []).map((u) => ({
            id: String(u.id),
            full_name: (u.name as string) ?? null,
            phone: (u.phone as string) ?? null,
            branch: (u.branchSlug as string) ?? null,
            role: String(u.role ?? "member"),
            created_at: String(u.created_at ?? ""),
          }))
        );
        setPayments(
          (adminData?.allPayments ?? []).map((p) => ({
            id: String(p.id),
            txn: String(p.transactionId ?? p.invoiceNumber ?? p.id),
            method: String(p.paymentMethod ?? ""),
            amount: Number(p.amountBdt ?? p.amount_tk ?? 0),
            status: String(p.status ?? ""),
            created_at: String(p.createdAt ?? p.created_at ?? ""),
            member: null,
          }))
        );
        setMemberships(
          (adminData?.allMemberships ?? []).map((m) => ({
            id: String(m.id),
            branch_name: String(m.branchSlug ?? m.branch_id ?? ""),
            start: String(m.startDate ?? m.start_date ?? ""),
            end: String(m.expiryDate ?? m.end_date ?? ""),
            status: String(m.status ?? ""),
            payment_status: String(m.status === "active" ? "paid" : m.status ?? ""),
          }))
        );
        setBookings(await listAllBookings().catch(() => []));
        // Merge legacy trainer roster into demo trainer shapes for display.
        const legacyTrainers = Array.isArray(bRes?.trainers)
          ? (bRes.trainers as Row[])
          : [];
        const demoTr = await listTrainers().catch(
          () => [] as TrainerRow[]
        );
        setTrainers(
          demoTr.length > 0
            ? demoTr
            : legacyTrainers.map((t, i) => ({
                id: `legacy-${String(t.slug ?? i)}`,
                name: String(t.name ?? "Coach"),
                slug: String(t.slug ?? `coach-${i}`),
                photo_url: (t.imageUrl as string) ?? null,
                specialty: (t.specialty as string) ?? null,
                branch_id: `demo-branch-${String(t.branchSlug ?? "dhanmondi")}`,
                branch_slug: String(t.branchSlug ?? ""),
                branch_name: "",
                bio: (t.bio as string) ?? null,
                is_active: true,
              }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Intentional: refresh admin data when auth loading completes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!authLoading) void refresh();
  }, [authLoading, refresh]);

  const demoAdminLogin = useCallback(async (): Promise<boolean> => {
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@rayhanfitness.com",
          password: "Rayhan#2026",
          rememberMe: true,
          otpCode: "884200",
        }),
      });
      if (!res.ok) return false;
      await refresh();
      return true;
    } catch {
      return false;
    }
  }, [refresh]);

  return {
    loading: loading || authLoading,
    configured: isSupabaseConfigured,
    isDemo: !isSupabaseConfigured,
    members,
    trainers,
    branches,
    packages,
    payments,
    memberships,
    bookings,
    legacyAdmin,
    refresh,
    demoAdminLogin,
  };
}
