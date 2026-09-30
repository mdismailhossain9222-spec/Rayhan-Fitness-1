"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Dumbbell,
  Clock,
  Users,
  Zap,
  Award,
  Lock,
  CheckCircle2,
} from "lucide-react";
import dynamic from "next/dynamic";
import PackageCard3D from "@/components/PackageCard3D";
import CheckoutModal, { CheckoutSelection } from "@/components/CheckoutModal";

// Heavy sections are code-split: the Three.js hero loads after first paint
// (client-only, zero SSR cost), and the calculator streams in on demand.
const Hero3DCanvas = dynamic(() => import("@/components/Hero3DCanvas"), {
  ssr: false,
  loading: () => (
    <div
      className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_50%_40%_at_65%_40%,rgba(212,175,55,0.16),transparent_70%)]"
      aria-hidden="true"
    />
  ),
});
const BiometricCalculator = dynamic(
  () => import("@/components/BiometricCalculator"),
  {
    loading: () => (
      <div
        className="iron-glass-card rounded-sm p-8 text-center font-mono-tech text-xs text-[#D4AF37] animate-pulse"
        aria-hidden="true"
      >
        LOADING BIOMETRIC ENGINE...
      </div>
    ),
  }
);

const BRANCH_DATA = [
  {
    slug: "lalbagh" as const,
    code: "CLUB 01 // LALBAGH",
    name: "Lalbagh Branch",
    tagline: "The Iron Forge",
    address: "42 Shaheed Nagar, Lalbagh Fort Road, Old Dhaka 1211",
    phone: "01736-574900",
    area: "7,800 sq.ft",
    image:
      "https://images.pexels.com/photos/2261481/pexels-photo-2261481.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    prices: { m3: 1700, m6: 3200, m12: 5700 },
    highlights: [
      "Calibrated Powerlifting Platforms",
      "Dumbbells up to 65 KG Pairs",
      "Ladies Dedicated Afternoon Slot",
      "Biometric Fingerprint Access",
    ],
  },
  {
    slug: "dhanmondi" as const,
    code: "CLUB 02 // DHANMONDI",
    name: "Dhanmondi Branch",
    tagline: "The Flagship Club",
    address: "Level 5 & 6, House 24, Road 27 (Old), Dhanmondi, Dhaka 1209",
    phone: "01736-574900",
    area: "14,500 sq.ft",
    image:
      "https://images.pexels.com/photos/30191517/pexels-photo-30191517.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    prices: { m3: 3450, m6: 6300, m12: 9800 },
    highlights: [
      "Hammer Strength & Eleiko Full Floor",
      "Infrared Dry Sauna & Cold Recovery",
      "InBody 770 3D Body Scanner",
      "25m Sled Turf & MMA Combat Cage",
    ],
  },
  {
    slug: "mirpur" as const,
    code: "CLUB 03 // MIRPUR",
    name: "Mirpur Branch",
    tagline: "The Performance Lab",
    address: "Plot 14, Block C, Rokeya Sarani, Mirpur-10 Circle, Dhaka 1216",
    phone: "01736-574900",
    area: "12,200 sq.ft",
    image:
      "https://images.pexels.com/photos/7674492/pexels-photo-7674492.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    prices: { m3: 3500, m6: 6000, m12: 10000 },
    highlights: [
      "30m Athletic Sprint & Prowler Turf",
      "Steam Room & Hydro-Recovery Suite",
      "Private Women's Training Studio Floor",
      "8x Olympic Lifting Shock Platforms",
    ],
  },
];

export default function HomePage() {
  const [selectedBranchTab, setSelectedBranchTab] = useState<
    "lalbagh" | "dhanmondi" | "mirpur"
  >("dhanmondi");
  const [checkoutItem, setCheckoutItem] = useState<CheckoutSelection | null>(
    null
  );

  const activeBranch =
    BRANCH_DATA.find((b) => b.slug === selectedBranchTab) || BRANCH_DATA[1];

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] overflow-hidden">
      {/* =====================================================================
          1. CINEMATIC 3D HERO SECTION
      ===================================================================== */}
      <section className="relative min-h-[90vh] flex items-center py-20 lg:py-28 border-b border-[#2A2A2A] overflow-hidden">
        {/* Background Atmospheric Image + Vignette + Red Stage Spotlight */}
        <div
          className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-25 scale-105"
          style={{
            backgroundImage:
              "url('https://images.pexels.com/photos/17706044/pexels-photo-17706044.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200')",
          }}
        />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/90 to-[#0A0A0A]/55" />
        <div className="absolute inset-0 spotlight-beam-red pointer-events-none" />
        <div className="absolute inset-0 cinematic-vignette pointer-events-none" />

        {/* Three.js Interactive 3D Barbell Monolith & Rising Embers */}
        <Hero3DCanvas />

        <div className="relative z-20 max-w-[1440px] mx-auto px-4 sm:px-8 w-full">
          <div className="max-w-3xl space-y-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-sm bg-[#151515]/90 border border-[#D4AF37]/50 shadow-[0_0_25px_rgba(212,175,55,0.25)]"
            >
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
              <span className="font-mono-tech text-[11px] uppercase tracking-[0.22em] text-white">
                DHAKA&apos;S PREMIER IRON SANCTUARY // LALBAGH • DHANMONDI • MIRPUR
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-6xl sm:text-7xl lg:text-[88px] leading-[0.92] tracking-[0.04em] uppercase text-white"
            >
              FORGED AT{" "}
              <span className="text-[#D4AF37] crimson-glow-text">MIDNIGHT.</span>
              <br />
              BUILT FOR UNRIVALED POWER.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-base sm:text-lg text-[#B3B3B3] max-w-2xl leading-relaxed"
            >
              Step inside{" "}
              <span className="text-white font-semibold">Rayhan Fitness</span>{" "}
              — three architectural strength & conditioning clubs engineered
              with calibrated competition iron, biometric telemetry, infrared
              recovery suites, and master coaches. Packages starting from{" "}
              <span className="font-mono-tech text-[#D4AF37] font-bold">
                ৳1,700
              </span>
              .
            </motion.p>

            {/* Primary Hero CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                href="/pricing"
                className="btn-crimson-primary px-8 py-4 rounded-sm text-xs sm:text-sm font-bold uppercase tracking-[0.18em] flex items-center gap-2.5"
              >
                <Flame className="w-4 h-4" />
                <span>EXPLORE PACKAGES (৳)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/branches"
                className="btn-matte-iron px-7 py-4 rounded-sm text-xs sm:text-sm font-bold uppercase tracking-[0.18em] flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                <span>EXPLORE 3 CLUBS</span>
              </Link>

              <Link
                href="/login"
                className="px-5 py-4 rounded-sm text-xs font-mono-tech uppercase tracking-widest text-[#B3B3B3] hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>MEMBER / ADMIN PORTAL →</span>
              </Link>
            </motion.div>

            {/* Branch Quick Price Strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.45 }}
              className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl"
            >
              {BRANCH_DATA.map((b) => (
                <Link
                  key={b.slug}
                  href={`/branches/${b.slug}`}
                  className="p-3.5 rounded-sm bg-[#121212]/90 backdrop-blur-md border border-[#2A2A2A] hover:border-[#D4AF37] transition-all group"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono-tech text-[#D4AF37] uppercase">
                    <span>{b.slug.toUpperCase()} CLUB</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  <div className="font-display text-lg text-white tracking-wider mt-0.5">
                    FROM ৳{b.prices.m3.toLocaleString()} / 3M
                  </div>
                  <div className="text-[11px] font-mono-tech text-[#B3B3B3]">
                    6M: ৳{b.prices.m6.toLocaleString()} • 12M: ৳
                    {b.prices.m12.toLocaleString()}
                  </div>
                </Link>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. HIGH-IMPACT STATS TELEMETRY BAR
      ===================================================================== */}
      <section className="bg-[#0D0D0D] border-b border-[#2A2A2A] py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                icon: MapPin,
                value: "03 CLUBS",
                label: "Lalbagh • Dhanmondi • Mirpur",
                sub: "34,500+ Total Sq.Ft Floor Space",
              },
              {
                icon: Users,
                value: "5,400+",
                label: "Active Verified Athletes",
                sub: "Biometric Turnstile Telemetry",
              },
              {
                icon: Dumbbell,
                value: "272 UNITS",
                label: "Hammer Strength & Eleiko Rigs",
                sub: "Calibrated Competition Iron",
              },
              {
                icon: ShieldCheck,
                value: "100% SECURE",
                label: "JWT + 2FA + Bcrypt + WAF",
                sub: "Zero-Trust Member Data Vault",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-5 rounded-sm bg-[#131313] border border-[#252525] flex items-start gap-4"
              >
                <div className="w-11 h-11 rounded-sm bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                  <stat.icon className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="font-display text-3xl sm:text-4xl text-white tracking-wider leading-none">
                    {stat.value}
                  </div>
                  <div className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider mt-1">
                    {stat.label}
                  </div>
                  <div className="text-[11px] font-mono-tech text-[#B3B3B3] mt-0.5">
                    {stat.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. THE 3 DHAKA BRANCHES — ARCHITECTURAL PREVIEW CARDS
      ===================================================================== */}
      <section className="relative py-24 lg:py-28 border-b border-[#2A2A2A]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="font-mono-tech text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
                03 ARCHITECTURAL SANCTUARIES // DHAKA NETWORK
              </span>
              <h2 className="font-display text-5xl sm:text-6xl text-white tracking-wider uppercase mt-2">
                SELECT YOUR TRAINING CLUB
              </h2>
            </div>
            <Link
              href="/branches"
              className="btn-matte-iron px-6 py-3.5 rounded-sm text-xs font-bold uppercase tracking-[0.16em] flex items-center gap-2 self-start md:self-auto"
            >
              <span>COMPARE ALL 3 LOCATIONS</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {BRANCH_DATA.map((branch, idx) => (
              <motion.div
                key={branch.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.12 }}
                className="iron-glass-card rounded-sm overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Image Header */}
                  <div className="relative h-60 overflow-hidden">
                    <img loading="lazy" decoding="async"
                      src={branch.image}
                      alt={branch.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/40 to-transparent" />
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-sm bg-[#0A0A0A]/90 border border-[#D4AF37]/60 font-mono-tech text-[10px] text-[#D4AF37] uppercase tracking-widest">
                      {branch.code}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div>
                        <span className="font-mono-tech text-xs text-[#B3B3B3] uppercase">
                          {branch.tagline}
                        </span>
                        <h3 className="font-display text-3xl text-white tracking-wider uppercase leading-none">
                          {branch.name}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-sm bg-[#151515]/90 border border-[#2A2A2A] font-mono-tech text-[11px] text-white">
                        {branch.area}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-5">
                    <div className="flex items-start gap-2.5 text-xs text-[#B3B3B3]">
                      <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span>{branch.address}</span>
                    </div>

                    {/* Exact Branch Pricing Pill Matrix */}
                    <div className="p-3.5 rounded-sm bg-[#0D0D0D] border border-[#262626] grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-[10px] font-mono-tech text-[#B3B3B3]">
                          3 MONTHS
                        </div>
                        <div className="font-mono-tech text-sm font-bold text-white mt-0.5">
                          ৳{branch.prices.m3.toLocaleString()}
                        </div>
                      </div>
                      <div className="border-x border-[#262626]">
                        <div className="text-[10px] font-mono-tech text-[#D4AF37]">
                          6 MONTHS
                        </div>
                        <div className="font-mono-tech text-sm font-bold text-[#D4AF37] mt-0.5">
                          ৳{branch.prices.m6.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono-tech text-[#B3B3B3]">
                          12 MONTHS
                        </div>
                        <div className="font-mono-tech text-sm font-bold text-white mt-0.5">
                          ৳{branch.prices.m12.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Highlights */}
                    <ul className="space-y-2">
                      {branch.highlights.map((h, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-xs text-[#F5F5F5]/85"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-6 pt-0 grid grid-cols-2 gap-3">
                  <Link
                    href={`/branches/${branch.slug}`}
                    className="btn-matte-iron py-3 rounded-sm text-center text-xs font-bold uppercase tracking-wider"
                  >
                    VIEW CLUB
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setCheckoutItem({
                        branchSlug: branch.slug,
                        branchName: branch.name,
                        durationMonths: 6,
                        planName: "6 Months",
                        amountBdt: branch.prices.m6,
                      })
                    }
                    className="btn-crimson-primary py-3 rounded-sm text-center text-xs font-bold uppercase tracking-wider"
                  >
                    JOIN NOW (৳)
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. INTERACTIVE BRANCH PRICING MATRIX (3D TILT CARDS + CHECKOUT)
      ===================================================================== */}
      <section className="relative py-24 lg:py-28 bg-[#0D0D0D] border-b border-[#2A2A2A] overflow-hidden">
        <div className="absolute inset-0 spotlight-beam-red pointer-events-none opacity-70" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="font-mono-tech text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
              TRANSPARENT BDT (৳) MEMBERSHIP TIERS
            </span>
            <h2 className="font-display text-5xl sm:text-6xl text-white tracking-wider uppercase">
              CHOOSE YOUR BRANCH & PACKAGE
            </h2>
            <p className="text-sm sm:text-base text-[#B3B3B3]">
              Switch between our 3 Dhaka branches below to inspect exact 3, 6,
              and 12-month rates. Every membership includes biometric access,
              certified floor coaching, and instant bKash/Nagad activation.
            </p>

            {/* Interactive Branch Selector Tabs */}
            <div className="inline-grid grid-cols-3 gap-2 p-1.5 rounded-sm bg-[#141414] border border-[#2A2A2A] mt-4">
              {BRANCH_DATA.map((b) => (
                <button
                  key={b.slug}
                  type="button"
                  onClick={() => setSelectedBranchTab(b.slug)}
                  className={`px-4 sm:px-7 py-3 rounded-sm font-mono-tech text-xs font-bold uppercase tracking-wider transition-all ${
                    selectedBranchTab === b.slug
                      ? "bg-[#D4AF37] text-[#0A0A0A] shadow-[0_0_20px_rgba(212,175,55,0.5)]"
                      : "text-[#B3B3B3] hover:text-white"
                  }`}
                >
                  {b.slug}
                </button>
              ))}
            </div>
          </div>

          {/* 3D Tilt Package Cards for Selected Branch */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
            <PackageCard3D
              branchSlug={activeBranch.slug}
              branchName={activeBranch.name}
              durationMonths={3}
              planName="3 MONTHS IGNITION"
              subtitle="Ideal for quarterly strength blocks & conditioning onboarding"
              amountBdt={activeBranch.prices.m3}
              monthlyEquivalent={Math.round(activeBranch.prices.m3 / 3)}
              features={[
                `Full ${activeBranch.name} Floor Access`,
                "Biometric Turnstile & Smart Locker",
                "1x Baseline InBody Biometric Scan",
                "Certified Floor Coach Supervision",
                "Customized Split Workout Blueprint",
              ]}
              onSelectCheckout={setCheckoutItem}
            />

            <PackageCard3D
              branchSlug={activeBranch.slug}
              branchName={activeBranch.name}
              durationMonths={6}
              planName="6 MONTHS VANGUARD"
              subtitle="Our #1 chosen hypertrophy & body recomposition commitment"
              amountBdt={activeBranch.prices.m6}
              monthlyEquivalent={Math.round(activeBranch.prices.m6 / 6)}
              originalPriceBdt={activeBranch.prices.m3 * 2}
              isPopular={true}
              features={[
                `Unlimited ${activeBranch.name} Access`,
                "3x Monthly InBody 3D Body Composition Scans",
                "2x 1-on-1 Master Trainer Form Calibrations",
                "Sauna / Steam Hydro-Recovery Access",
                "Custom Bangladeshi Macro & Nutrition Guide",
                "15-Day Membership Freeze Privilege",
              ]}
              onSelectCheckout={setCheckoutItem}
            />

            <PackageCard3D
              branchSlug={activeBranch.slug}
              branchName={activeBranch.name}
              durationMonths={12}
              planName="12 MONTHS TITAN VIP"
              subtitle="Year-round elite transformation with multi-branch guest privileges"
              amountBdt={activeBranch.prices.m12}
              monthlyEquivalent={Math.round(activeBranch.prices.m12 / 12)}
              originalPriceBdt={activeBranch.prices.m3 * 4}
              features={[
                `All-Hours VIP Access at ${activeBranch.name}`,
                "4x Monthly Cross-Branch Guest Passes",
                "Unlimited Monthly InBody 3D Biometric Scans",
                "6x 1-on-1 Personal Training Sessions Included",
                "Unlimited Sauna, Steam & Recovery Lounge",
                "45-Day Annual Membership Freeze Privilege",
              ]}
              onSelectCheckout={setCheckoutItem}
            />
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. BIOMETRIC BMI, TDEE & MACRO CALCULATOR SECTION
      ===================================================================== */}
      <section className="py-24 lg:py-28 border-b border-[#2A2A2A]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="font-mono-tech text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
              PRECISION METABOLIC DIAGNOSTICS
            </span>
            <h2 className="font-display text-5xl sm:text-6xl text-white tracking-wider uppercase">
              CALCULATE YOUR ATHLETE METRICS
            </h2>
            <p className="text-sm sm:text-base text-[#B3B3B3]">
              Input your current biometrics to compute your exact BMI, estimated
              body fat percentage, daily calorie target, and optimal protein/carb/fat
              split before stepping onto the gym floor.
            </p>
          </div>

          <BiometricCalculator />
        </div>
      </section>

      {/* =====================================================================
          6. PRODUCTION SECURITY & ENTERPRISE INFRASTRUCTURE BANNER
      ===================================================================== */}
      <section className="py-20 bg-[#0D0D0D]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="iron-glass-card rounded-sm p-8 sm:p-12 border border-[#D4AF37]/40 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-emerald-500/10 border border-emerald-500/30 font-mono-tech text-xs text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>ZERO-TRUST SECURITY ARCHITECTURE</span>
              </div>
              <h2 className="font-display text-4xl sm:text-5xl text-white tracking-wider uppercase">
                YOUR BIOMETRIC & PAYMENT DATA IS FORTIFIED
              </h2>
              <p className="text-sm text-[#B3B3B3] leading-relaxed">
                Rayhan Fitness runs on hardened fullstack security: short-lived
                JWT access tokens + rotating refresh tokens in{" "}
                <code className="text-white font-mono-tech">
                  HttpOnly, SameSite=Strict
                </code>{" "}
                cookies, salted bcrypt password hashing, Drizzle ORM
                parameterized PostgreSQL queries, sliding-window brute-force rate
                limiting, 2FA OTP verification, and role-based access control
                (Member, Trainer, Admin).
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/login"
                  className="btn-crimson-primary px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest"
                >
                  ACCESS SECURE PORTAL
                </Link>
                <Link
                  href="/dashboard"
                  className="btn-matte-iron px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest"
                >
                  VIEW DASHBOARD OVERVIEW
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-3 font-mono-tech text-xs">
              {[
                {
                  icon: Lock,
                  title: "JWT + HTTPONLY",
                  desc: "SameSite=Strict Cookie Vault",
                },
                {
                  icon: ShieldCheck,
                  title: "2FA OTP SHIELD",
                  desc: "Multi-Factor Login Verification",
                },
                {
                  icon: Zap,
                  title: "DRIZZLE ORM SQL",
                  desc: "100% Parameterized Queries",
                },
                {
                  icon: Award,
                  title: "RBAC + AUDIT LOG",
                  desc: "Member • Trainer • Admin",
                },
              ].map((sec, i) => (
                <div
                  key={i}
                  className="p-4 rounded-sm bg-[#111111] border border-[#2A2A2A] space-y-1.5"
                >
                  <sec.icon className="w-5 h-5 text-[#D4AF37]" />
                  <div className="font-bold text-white">{sec.title}</div>
                  <div className="text-[11px] text-[#B3B3B3]">{sec.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={Boolean(checkoutItem)}
        onClose={() => setCheckoutItem(null)}
        initialSelection={checkoutItem}
      />
    </div>
  );
}
