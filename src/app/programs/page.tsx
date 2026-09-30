"use client";
import { apiFetch } from "@/lib/api-client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame,
  Clock,
  CheckCircle2,
  UserCheck,
  Calendar,
  ArrowRight,
  Zap,
} from "lucide-react";

interface ProgramItem {
  id: number;
  slug: string;
  title: string;
  category: string;
  intensity: string;
  durationMinutes: number;
  caloriesBurn: string;
  schedule: string;
  branchSlug: string;
  coachName: string;
  description: string;
  features: string[];
  imageUrl: string;
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [reservedProgram, setReservedProgram] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/branches")
      .then((r) => r.json())
      .then((d) => {
        if (d?.programs) setPrograms(d.programs);
      })
      .catch(console.error);
  }, []);

  const categories = [
    "ALL",
    "Strength & Mass",
    "Powerlifting",
    "Conditioning",
    "Combat",
    "Women's Elite",
    "Personal Training",
  ];

  const filteredPrograms =
    selectedCategory === "ALL"
      ? programs
      : programs.filter((p) => p.category === selectedCategory);

  const handleReserve = async (prog: ProgramItem) => {
    setReservedProgram(prog.title);
    try {
      await apiFetch("/api/dashboard/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "checkin",
          branchSlug: prog.branchSlug === "all" ? "dhanmondi" : prog.branchSlug,
          workoutFocus: prog.title,
          durationMinutes: prog.durationMinutes,
        }),
      });
    } catch {
      // ignore if guest
    }
  };

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] min-h-screen">
      {/* Hero */}
      <section className="relative py-20 lg:py-28 border-b border-[#2A2A2A] overflow-hidden">
        <div className="absolute inset-0 spotlight-beam-red pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#151515] border border-[#D4AF37]/50 font-mono-tech text-xs text-[#D4AF37] uppercase tracking-[0.2em]">
              <Zap className="w-3.5 h-3.5" />
              <span>SCIENTIFICALLY PERIODIZED TRAINING PROTOCOLS</span>
            </span>
            <h1 className="font-display text-6xl sm:text-7xl text-white tracking-wider uppercase leading-none">
              SIGNATURE{" "}
              <span className="text-[#D4AF37] crimson-glow-text">
                PROGRAMS & CLASSES
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#B3B3B3] leading-relaxed">
              Every training block at Rayhan Fitness is engineered around
              mechanical tension, metabolic conditioning, and progressive
              overload. Filter by discipline below or book your slot directly.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-8">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-sm font-mono-tech text-xs font-bold uppercase tracking-wider border transition-all ${
                  selectedCategory === cat
                    ? "bg-[#D4AF37] border-[#E8C766] text-[#0A0A0A] shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                    : "bg-[#121212] border-[#2A2A2A] text-[#B3B3B3] hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Reservation Toast */}
      {reservedProgram && (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-8">
          <div className="p-4 rounded-sm bg-emerald-950/60 border border-emerald-500/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Slot reserved for{" "}
                <strong className="text-white">{reservedProgram}</strong>! If
                you are logged in, this session has also been logged to your
                Member Dashboard attendance history.
              </span>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-1.5 rounded-sm bg-emerald-500 text-black font-mono-tech text-xs font-bold uppercase"
            >
              VIEW IN DASHBOARD →
            </Link>
          </div>
        </div>
      )}

      {/* Programs Grid */}
      <section className="py-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPrograms.map((prog, idx) => (
            <motion.div
              key={prog.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="iron-glass-card rounded-sm overflow-hidden flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-56 overflow-hidden">
                  <img loading="lazy" decoding="async"
                    src={prog.imageUrl}
                    alt={prog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/40 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-sm bg-[#0A0A0A]/90 border border-[#D4AF37] font-mono-tech text-[10px] text-[#D4AF37] uppercase">
                      {prog.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-sm bg-[#D4AF37] font-mono-tech text-[10px] font-bold text-[#0A0A0A] uppercase">
                      {prog.intensity} INTENSITY
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between font-mono-tech text-[11px] text-white">
                    <span className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded-sm">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {prog.durationMinutes} MIN
                    </span>
                    <span className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded-sm text-[#E8C766]">
                      <Flame className="w-3.5 h-3.5" />
                      {prog.caloriesBurn}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <div className="text-[10px] font-mono-tech text-[#B3B3B3] uppercase">
                      CLUB:{" "}
                      <span className="text-white">
                        {prog.branchSlug === "all"
                          ? "ALL 3 DHAKA BRANCHES"
                          : `${prog.branchSlug.toUpperCase()} BRANCH`}
                      </span>
                    </div>
                    <h2 className="font-display text-3xl text-white tracking-wider uppercase mt-1">
                      {prog.title}
                    </h2>
                  </div>

                  <p className="text-xs text-[#B3B3B3] leading-relaxed">
                    {prog.description}
                  </p>

                  <div className="p-3 rounded-sm bg-[#111111] border border-[#242424] space-y-1.5 font-mono-tech text-[11px]">
                    <div className="flex items-center gap-2 text-white">
                      <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Lead Coach: {prog.coachName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#B3B3B3]">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{prog.schedule}</span>
                    </div>
                  </div>

                  <ul className="space-y-1.5">
                    {prog.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-xs text-[#F5F5F5]/85"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 pt-0 flex gap-3">
                <button
                  type="button"
                  onClick={() => handleReserve(prog)}
                  className="flex-1 btn-crimson-primary py-3 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5"
                >
                  <span>RESERVE CLASS SLOT</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
