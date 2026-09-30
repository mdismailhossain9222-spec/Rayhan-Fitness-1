"use client";

import { apiFetch } from "@/lib/api-client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Award,
  MapPin,
  Users,
  Calendar,
} from "lucide-react";
import BookingModal from "@/components/BookingModal";
import { useUser } from "@/hooks/useUser";
import { useAuthToast } from "@/components/auth/AuthToast";
import {
  listTrainers,
  seedDemoBookingsIfEmpty,
  type TrainerRow,
} from "@/lib/bookings";

interface TrainerItem {
  id: number | string;
  name: string;
  slug: string;
  roleTitle: string;
  specialty: string;
  branchSlug: string;
  experienceYears: number;
  certifications: string[];
  bio: string;
  imageUrl: string;
  instagramHandle: string;
  clientsTrained: number;
}

const PENDING_KEY = "rf_pending_booking_trainer";

function TrainersInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user: sbUser, profile } = useUser();
  const { notify } = useAuthToast();
  const [trainers, setTrainers] = useState<TrainerItem[]>([]);
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [bookingFor, setBookingFor] = useState<TrainerRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [legacyUser, setLegacyUser] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Roster: legacy API first (rich cards), Supabase trainers merged by name.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await apiFetch("/api/branches").then((r) => r.json());
        if (!cancelled && d?.trainers) setTrainers(d.trainers);
      } catch {
        // Fall through to Supabase-only roster below.
      }
      try {
        const sbTrainers = await listTrainers();
        if (cancelled) return;
        setTrainers((prev) => {
          if (prev.length > 0) return prev;
          return sbTrainers.map((t, i) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            roleTitle: "Certified Coach",
            specialty: t.specialty ?? "Personal Training",
            branchSlug: t.branch_slug ?? "dhanmondi",
            experienceYears: 5 + (i % 6),
            certifications: ["Certified Personal Trainer"],
            bio: t.bio ?? "",
            imageUrl: t.photo_url ?? "",
            instagramHandle: "",
            clientsTrained: 120 + i * 40,
          }));
        });
      } catch {
        // Roster stays as-is.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Legacy session check (Supabase identity comes from useUser).
  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) setLegacyUser({ id: d.user.id, name: d.user.name });
        else setLegacyUser(null);
      })
      .catch(() => setLegacyUser(null));
  }, []);

  const toRow = (coach: TrainerItem): TrainerRow => ({
    id: String(coach.id),
    name: coach.name,
    slug: coach.slug,
    photo_url: coach.imageUrl || null,
    specialty: coach.specialty,
    branch_id: `demo-branch-${coach.branchSlug}`,
    branch_slug: coach.branchSlug,
    bio: coach.bio,
  });

  const openBooking = (coach: TrainerItem) => {
    setBookingFor(toRow(coach));
    setModalOpen(true);
  };

  const handleBookClick = (coach: TrainerItem) => {
    if (!sbUser && !legacyUser) {
      // Preserve the intended action, then require auth first.
      localStorage.setItem(PENDING_KEY, String(coach.id));
      notify(
        "info",
        "Sign in to book",
        "Create a free account or sign in, then we'll bring you right back to complete this booking."
      );
      router.push(
        `/login?next=${encodeURIComponent("/trainers")}&bookTrainer=${encodeURIComponent(String(coach.id))}`
      );
      return;
    }
    openBooking(coach);
  };

  const filteredTrainers =
    branchFilter === "all"
      ? trainers
      : trainers.filter((t) => t.branchSlug === branchFilter);

  // Resume an intended booking after login (logged-out → login → back).
  useEffect(() => {
    const wanted =
      params.get("bookTrainer") ?? localStorage.getItem(PENDING_KEY) ?? null;
    if (!wanted || trainers.length === 0) return;
    const authed = Boolean(sbUser || legacyUser);
    if (!authed) return;
    const coach = trainers.find(
      (t) => String(t.id) === wanted || t.slug === wanted
    );
    if (coach) {
      localStorage.removeItem(PENDING_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      openBooking(coach);
      notify("info", "Welcome back!", `Continue booking ${coach.name} below.`);
      window.history.replaceState({}, "", "/trainers");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainers, sbUser?.id, legacyUser?.id]);

  const memberId = sbUser?.id ?? (legacyUser ? `legacy-${legacyUser.id}` : "");
  const memberName =
    profile?.full_name ?? legacyUser?.name ?? sbUser?.email ?? "Member";

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] min-h-screen">
      {/* Hero */}
      <section className="relative py-20 lg:py-28 border-b border-[#2A2A2A] overflow-hidden">
        <div className="absolute inset-0 spotlight-beam-red pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#151515] border border-[#D4AF37]/50 font-mono-tech text-xs text-[#D4AF37] uppercase tracking-[0.2em]">
              <Award className="w-3.5 h-3.5" />
              <span>ACCREDITED STRENGTH & CONDITIONING ARCHITECTS</span>
            </span>
            <h1 className="font-display text-6xl sm:text-7xl text-white tracking-wider uppercase leading-none">
              MASTER{" "}
              <span className="text-[#D4AF37] crimson-glow-text">
                COACHING ROSTER
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#B3B3B3] leading-relaxed">
              Filter our elite trainers by Dhaka branch below. Every coach at
              Rayhan Fitness holds internationally recognized biomechanics,
              powerlifting, combat, or sports rehabilitation credentials.
            </p>
          </div>

          {/* Branch Filter Tabs */}
          <div className="flex flex-wrap gap-2.5 pt-8">
            {[
              { id: "all", label: "ALL 3 BRANCHES" },
              { id: "lalbagh", label: "LALBAGH CLUB" },
              { id: "dhanmondi", label: "DHANMONDI FLAGSHIP" },
              { id: "mirpur", label: "MIRPUR PERFORMANCE LAB" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBranchFilter(tab.id)}
                className={`px-5 py-2.5 min-h-[44px] rounded-sm font-mono-tech text-xs font-bold uppercase tracking-wider border transition-all ${
                  branchFilter === tab.id
                    ? "bg-[#D4AF37] border-[#E8C766] text-[#0A0A0A] shadow-[0_0_20px_rgba(212,175,55,0.45)]"
                    : "bg-[#121212] border-[#2A2A2A] text-[#B3B3B3] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trainers Grid */}
      <section className="py-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTrainers.map((coach, idx) => (
            <motion.div
              key={coach.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="iron-glass-card rounded-sm overflow-hidden flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-80 overflow-hidden">
                  <img loading="lazy" decoding="async"
                    src={coach.imageUrl}
                    alt={coach.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/30 to-transparent" />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-sm bg-[#0A0A0A]/90 border border-[#D4AF37] font-mono-tech text-[10px] text-[#D4AF37] uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{coach.branchSlug} BRANCH</span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="font-mono-tech text-[11px] text-[#D4AF37] uppercase">
                      {coach.roleTitle}
                    </span>
                    <h2 className="font-display text-3xl text-white tracking-wider uppercase leading-none mt-0.5">
                      {coach.name}
                    </h2>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-sm bg-[#111111] border border-[#242424] font-mono-tech text-xs">
                    <div>
                      <span className="text-[10px] text-[#B3B3B3] block">
                        EXPERIENCE
                      </span>
                      <span className="text-white font-bold">
                        {coach.experienceYears} Years Pro
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#B3B3B3] block">
                        ATHLETES COACHED
                      </span>
                      <span className="text-[#D4AF37] font-bold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {coach.clientsTrained}+
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#B3B3B3] leading-relaxed">
                    {coach.bio}
                  </p>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono-tech text-[#B3B3B3] uppercase tracking-wider">
                      ACCREDITED CERTIFICATIONS:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {coach.certifications.map((cert, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-sm bg-[#151515] border border-[#2A2A2A] font-mono-tech text-[10px] text-white"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  type="button"
                  onClick={() => handleBookClick(coach)}
                  className="w-full btn-crimson-primary py-3.5 min-h-[48px] rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book This Trainer</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trainer Booking Modal */}
      <BookingModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setBookingFor(null);
        }}
        trainer={bookingFor}
        memberId={memberId}
        memberName={memberName}
        onBooked={() => {
          if (memberId) seedDemoBookingsIfEmpty(memberId, memberName);
        }}
        notifySuccess={(title, message) => notify("success", title, message)}
        notifyError={(title, message) => notify("error", title, message)}
      />
    </div>
  );
}

export default function TrainersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center font-mono-tech text-sm text-[#D4AF37] uppercase tracking-widest animate-pulse">
          Loading coaching roster…
        </div>
      }
    >
      <TrainersInner />
    </Suspense>
  );
}
