"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Dumbbell,
  Flame,
  Box,
  Star,
  Target,
  UserCheck,
  Clock,
  Calendar,
  ArrowRight,
  Zap,
  CheckCircle2,
} from "lucide-react";

interface ProgramItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  intensity: string;
  durationMinutes: number;
  schedule: string;
  branchSlug: string;
  coachName: string;
  description: string;
  features: string[];
  icon: string;
  gradient: string;
}

const PROGRAMS_DATA: ProgramItem[] = [
  {
    id: "mass-builder-pro",
    slug: "mass-builder-pro",
    title: "Mass Builder Pro",
    category: "STRENGTH & MASS",
    intensity: "HIGH",
    durationMinutes: 60,
    schedule: "4 days / week",
    branchSlug: "all",
    coachName: "Rayhan Chowdhury",
    description:
      "A progressive overload program designed to maximize muscle hypertrophy through compound lifts and controlled volume training. Built for serious growth.",
    features: [
      "Compound-focused (Squat, Bench, Deadlift, Row, Press)",
      "Linear periodization with weekly load increases",
      "Volume landmarks tracked per mesocycle",
      "Recovery protocols & deload weeks built-in",
      "Nutrition guidance for caloric surplus",
    ],
    icon: "Dumbbell",
    gradient: "from-amber-900/40 via-orange-900/30 to-amber-900/40",
  },
  {
    id: "iron-foundation",
    slug: "iron-foundation",
    title: "Iron Foundation",
    category: "POWERLIFTING",
    intensity: "MAXIMAL",
    durationMinutes: 75,
    schedule: "3 days / week",
    branchSlug: "all",
    coachName: "Rafiq Islam",
    description:
      "Master the big three — squat, bench, deadlift. Technique-focused coaching with structured periodization for raw strength gains.",
    features: [
      "Competition-spec technique coaching (IPF standards)",
      "Block periodization: Hypertrophy → Strength → Peak",
      "Video form analysis every session",
      "Accessory work for weak point elimination",
      "Meet prep simulation & attempt selection strategy",
    ],
    icon: "Dumbbell",
    gradient: "from-slate-900/50 via-stone-800/40 to-slate-900/50",
  },
  {
    id: "metabolic-burn",
    slug: "metabolic-burn",
    title: "Metabolic Burn",
    category: "CONDITIONING",
    intensity: "HIGH",
    durationMinutes: 45,
    schedule: "5 days / week",
    branchSlug: "all",
    coachName: "Nusrat Jahan",
    description:
      "High-intensity circuits engineered to torch fat, build endurance, and push your cardiovascular limits.",
    features: [
      "EMOM, AMRAP & interval protocols rotated daily",
      "Heart-rate zone monitoring (Zone 2 → 5)",
      "Prowler pushes, battle ropes, ski-erg, rower",
      "Post-session EPOC maximization protocols",
      "Body-composition tracking monthly",
    ],
    icon: "Flame",
    gradient: "from-red-900/40 via-orange-900/30 to-red-900/40",
  },
  {
    id: "fight-camp",
    slug: "fight-camp",
    title: "Fight Camp",
    category: "COMBAT",
    intensity: "HIGH",
    durationMinutes: 60,
    schedule: "3 days / week",
    branchSlug: "all",
    coachName: "Karim Hassan",
    description:
      "Boxing and Muay Thai fundamentals combined with real sparring conditioning. Train like a fighter, think like a champion.",
    features: [
      "Striking fundamentals: jab, cross, hook, uppercut, kicks",
      "Pad work, bag work & partner drills",
      "Defensive movement: head movement, footwork, checks",
      "Conditioning: roadwork, shadowboxing, calisthenics",
      "Light technical sparring (optional, supervised)",
    ],
    icon: "Box",
    gradient: "from-stone-900/50 via-amber-900/30 to-stone-900/50",
  },
  {
    id: "elite-womens-program",
    slug: "elite-womens-program",
    title: "Elite Women's Program",
    category: "WOMEN'S ELITE",
    intensity: "MODERATE-HIGH",
    durationMinutes: 50,
    schedule: "4 days / week",
    branchSlug: "all",
    coachName: "Farhana Akter",
    description:
      "A dedicated strength and toning program built exclusively for women, in a supportive, judgment-free training environment.",
    features: [
      "Glute/hamstring emphasis with upper-body balance",
      "Pelvic floor & core integration every session",
      "Progressive overload tailored to female physiology",
      "Cycle-aware intensity modulation guidance",
      "Private training floor access during program hours",
    ],
    icon: "Star",
    gradient: "from-rose-900/40 via-pink-900/30 to-rose-900/40",
  },
  {
    id: "personal-transformation",
    slug: "personal-transformation",
    title: "1-on-1 Transformation",
    category: "PERSONAL TRAINING",
    intensity: "CUSTOM",
    durationMinutes: 60,
    schedule: "Flexible scheduling",
    branchSlug: "all",
    coachName: "Assigned Specialist",
    description:
      "Fully customized coaching with a dedicated trainer tracking your nutrition, form, and progress every single session.",
    features: [
      "Initial movement screen & goal-setting consultation",
      "Fully individualized periodized program",
      "Weekly check-ins: weight, photos, metrics, biofeedback",
      "Nutrition protocol with macro targets & meal guides",
      "Unlimited technique video reviews between sessions",
    ],
    icon: "Target",
    gradient: "from-emerald-900/40 via-teal-900/30 to-emerald-900/40",
  },
  {
    id: "hypertrophy-lab",
    slug: "hypertrophy-lab",
    title: "Hypertrophy Lab",
    category: "STRENGTH & MASS",
    intensity: "HIGH",
    durationMinutes: 60,
    schedule: "5 days / week",
    branchSlug: "all",
    coachName: "Tanvir Ahmed",
    description:
      "Science-backed training splits targeting specific muscle groups for balanced, aesthetic muscle development.",
    features: [
      "Body-part split: Push/Pull/Legs/Upper/Lower rotation",
      "Evidence-based rep ranges (6–12 for hypertrophy, 3–5 for strength)",
      "Lengthened-overload & stretch-mediated techniques",
      "Myo-reps, drop sets, rest-pause strategic application",
      "Pose-down practice & stage presentation coaching",
    ],
    icon: "Dumbbell",
    gradient: "from-amber-900/40 via-yellow-900/30 to-amber-900/40",
  },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Dumbbell,
  Flame,
  Box,
  Star,
  Target,
};

const CATEGORIES = [
  "ALL",
  "STRENGTH & MASS",
  "POWERLIFTING",
  "CONDITIONING",
  "COMBAT",
  "WOMEN'S ELITE",
  "PERSONAL TRAINING",
];

export default function ProgramsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const filteredPrograms =
    selectedCategory === "ALL"
      ? PROGRAMS_DATA
      : PROGRAMS_DATA.filter((p) => p.category === selectedCategory);

  const IconComponent = (iconName: string) => {
    const Comp = ICON_MAP[iconName] || Dumbbell;
    return <Comp className="w-10 h-10" />;
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
            {CATEGORIES.map((cat) => (
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

      {/* Programs Grid */}
      <section className="py-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPrograms.map((prog, idx) => (
            <motion.div
              key={prog.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="iron-glass-card rounded-sm overflow-hidden flex flex-col justify-between group relative"
            >
              {/* Icon + Gradient Header */}
              <div
                className={`relative p-6 overflow-hidden bg-gradient-to-br ${prog.gradient} border-b border-[#D4AF37]/30`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/60 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-sm bg-[#0A0A0A]/90 border border-[#D4AF37] font-mono-tech text-[10px] text-[#D4AF37] uppercase">
                    {prog.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-sm bg-[#D4AF37] font-mono-tech text-[10px] font-bold text-[#0A0A0A] uppercase">
                    {prog.intensity} INTENSITY
                  </span>
                </div>
                <div className="relative z-10 flex items-center justify-between h-24">
                  <div className="p-4 rounded-sm bg-[#0A0A0A]/80 border border-[#D4AF37]/40 backdrop-blur-sm">
                    {IconComponent(prog.icon)}
                  </div>
                  <div className="text-right pr-2">
                    <div className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded-sm font-mono-tech text-[11px] text-white">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      {prog.durationMinutes} MIN
                    </div>
                    <div className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded-sm font-mono-tech text-[11px] text-[#E8C766] mt-1.5">
                      <Flame className="w-3.5 h-3.5" />
                      {prog.schedule}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 flex-1">
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

              {/* CTA */}
              <div className="p-6 pt-0">
                <button
                  type="button"
                  className="w-full btn-crimson-primary py-3.5 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5"
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