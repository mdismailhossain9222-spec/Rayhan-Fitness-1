"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Check,
  ShieldCheck,
  Smartphone,
  CreditCard,
  BadgeCheck,
  RotateCcw,
  LayoutGrid,
  Building2,
} from "lucide-react";
import PackageCard3D from "@/components/PackageCard3D";
import CheckoutModal, { CheckoutSelection } from "@/components/CheckoutModal";

const ALL_BRANCH_PACKAGES = [
  {
    slug: "lalbagh" as const,
    name: "Lalbagh Branch",
    tagline: "The Iron Forge • Shaheed Nagar, Old Dhaka",
    p3: 1700,
    p6: 3200,
    p12: 5700,
    o6: 3400,
    o12: 6800,
    perks: [
      "Calibrated Powerlifting & Free-Weight Floor",
      "Dumbbells up to 65 KG Pairs",
      "Ladies Dedicated Slot (2:00 PM – 5:00 PM)",
      "Digital Locker & High-Pressure Showers",
    ],
  },
  {
    slug: "dhanmondi" as const,
    name: "Dhanmondi Branch",
    tagline: "The Flagship Club • Road 27 (Old), Dhanmondi",
    p3: 3450,
    p6: 6300,
    p12: 9800,
    o6: 6900,
    o12: 13800,
    perks: [
      "14,500 Sq.Ft Hammer Strength & Eleiko Floor",
      "Infrared Dry Sauna & Cold Plunge Recovery",
      "InBody 770 3D Biometric Body Scanner",
      "25m Sled Turf & MMA Combat Conditioning Cage",
    ],
  },
  {
    slug: "mirpur" as const,
    name: "Mirpur Branch",
    tagline: "The Performance Lab • Mirpur-10 Circle",
    p3: 3500,
    p6: 6000,
    p12: 10000,
    o6: 7000,
    o12: 14000,
    perks: [
      "30m Athletic Sprint & Prowler Sled Turf",
      "Steam Bath & Hydro-Recovery Locker Suite",
      "Private Women's Training Studio Floor",
      "8x Olympic Weightlifting Shock Platforms",
    ],
  },
];

type ViewMode = "compare" | "single";

export default function PricingPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("compare");
  const [singleBranch, setSingleBranch] = useState<
    "lalbagh" | "dhanmondi" | "mirpur"
  >("dhanmondi");
  const [checkoutItem, setCheckoutItem] = useState<CheckoutSelection | null>(
    null
  );

  const visibleBranches =
    viewMode === "compare"
      ? ALL_BRANCH_PACKAGES
      : ALL_BRANCH_PACKAGES.filter((b) => b.slug === singleBranch);

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] min-h-screen">
      {/* Hero */}
      <section className="relative py-20 lg:py-24 border-b border-[#2A2A2A] overflow-hidden">
        <div className="absolute inset-0 spotlight-beam-gold-wide pointer-events-none" />
        <div className="absolute inset-0 cinematic-vignette pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 relative z-10 text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-[#151515] border border-[#D4AF37]/50 font-mono-tech text-xs text-[#D4AF37] uppercase tracking-[0.2em]">
            <Crown className="w-3.5 h-3.5" />
            <span>OFFICIAL 2026 TARIFF // ZERO HIDDEN REGISTRATION FEES</span>
          </span>

          <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl text-white tracking-wider uppercase leading-none">
            MEMBERSHIP{" "}
            <span className="text-[#D4AF37] gold-glow-text">
              PACKAGES (৳)
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#B3B3B3] max-w-2xl mx-auto">
            Compare all 3 Dhaka branches side-by-side or focus on your home
            club. Every card features 3D tilt telemetry and instant{" "}
            <span className="text-white font-semibold">
              bKash, Nagad & Card
            </span>{" "}
            activation.
          </p>

          {/* Compare / Single Toggle — monthly/yearly style switch */}
          <div className="flex justify-center pt-2">
            <div className="relative inline-flex p-1.5 rounded-sm bg-[#121212] border border-[#2A2A2A]">
              {(["compare", "single"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`relative z-10 px-6 py-3 rounded-sm font-mono-tech text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors duration-300 ${
                    viewMode === mode ? "text-[#0A0A0A]" : "text-[#B3B3B3] hover:text-white"
                  }`}
                >
                  {viewMode === mode && (
                    <motion.span
                      layoutId="pricing-view-pill"
                      className="absolute inset-0 pointer-events-none rounded-sm bg-gradient-to-r from-[#E8C766] via-[#D4AF37] to-[#8A6D1F] shadow-[0_0_24px_rgba(212,175,55,0.45)]"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {mode === "compare" ? (
                      <>
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Compare All Branches</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Single Branch View</span>
                      </>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Single-branch selector with animated underline indicator */}
          <AnimatePresence>
            {viewMode === "single" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex justify-center"
              >
                <div className="inline-flex gap-1 sm:gap-2 p-1.5 rounded-sm bg-[#121212]/80 border border-[#2A2A2A]">
                  {ALL_BRANCH_PACKAGES.map((b) => {
                    const active = singleBranch === b.slug;
                    return (
                      <button
                        key={b.slug}
                        type="button"
                        onClick={() => setSingleBranch(b.slug)}
                        className={`relative px-5 sm:px-8 py-3 font-mono-tech text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                          active ? "text-[#D4AF37]" : "text-[#B3B3B3] hover:text-white"
                        }`}
                      >
                        <span>{b.name.replace(" Branch", "")}</span>
                        <span className="block text-[10px] font-normal text-[#B3B3B3]/70 mt-0.5">
                          From ৳{b.p3.toLocaleString()}
                        </span>
                        {active && (
                          <motion.span
                            layoutId="gold-branch-underline"
                            className="gold-tab-indicator left-3 right-3"
                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Branch Package Sections — full-width dark + gold spotlight */}
      <section className="relative py-20 space-y-24 overflow-hidden">
        <div className="absolute inset-0 spotlight-beam-gold-wide pointer-events-none opacity-80" />
        <div className="absolute top-0 left-0 right-0 gold-section-divider" />

        <div className="relative z-10 space-y-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode + singleBranch}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-24"
            >
              {visibleBranches.map((branch) => (
                <div
                  key={branch.slug}
                  className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-10"
                >
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#2A2A2A]">
                    <div>
                      <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                        {branch.tagline}
                      </span>
                      <h2 className="font-display text-4xl sm:text-5xl text-white tracking-wider uppercase mt-1">
                        {branch.name} — PRICING TIERS
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {branch.perks.slice(0, 2).map((p, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-sm bg-[#141414] border border-[#2A2A2A] font-mono-tech text-xs text-[#B3B3B3] flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4 items-stretch">
                    <PackageCard3D
                      branchSlug={branch.slug}
                      branchName={branch.name}
                      durationMonths={3}
                      planName="3 MONTHS IGNITION"
                      subtitle="Quarterly commitment for foundational strength & hypertrophy"
                      amountBdt={branch.p3}
                      monthlyEquivalent={Math.round(branch.p3 / 3)}
                      features={[
                        `Full ${branch.name} Equipment & Turf Access`,
                        "Biometric Fingerprint Access & Smart Locker",
                        "1x Baseline InBody Biometric Scan",
                        "Certified Floor Coach Form Supervision",
                        ...branch.perks.slice(0, 1),
                      ]}
                      onSelectCheckout={setCheckoutItem}
                    />

                    <PackageCard3D
                      branchSlug={branch.slug}
                      branchName={branch.name}
                      durationMonths={6}
                      planName="6 MONTHS VANGUARD"
                      subtitle="Most Popular 6-month body recomposition & strength cycle"
                      amountBdt={branch.p6}
                      monthlyEquivalent={Math.round(branch.p6 / 6)}
                      originalPriceBdt={branch.o6}
                      isPopular={true}
                      features={[
                        `Unlimited ${branch.name} All-Zone Access`,
                        "3x InBody 3D Body Composition Scans",
                        "2x 1-on-1 Personal Trainer Form Calibrations",
                        "Sauna / Steam Recovery Suite Access",
                        "Custom Bangladeshi Macro Diet Blueprint",
                        "15-Day Membership Freeze Privilege",
                      ]}
                      onSelectCheckout={setCheckoutItem}
                    />

                    <PackageCard3D
                      branchSlug={branch.slug}
                      branchName={branch.name}
                      durationMonths={12}
                      planName="12 MONTHS TITAN VIP"
                      subtitle="Maximum annual value with multi-branch guest privileges"
                      amountBdt={branch.p12}
                      monthlyEquivalent={Math.round(branch.p12 / 12)}
                      originalPriceBdt={branch.o12}
                      features={[
                        `All-Hours VIP Access at ${branch.name}`,
                        "4x Monthly Cross-Branch Guest Passes",
                        "Unlimited Monthly InBody 3D Scans",
                        "6x 1-on-1 Master Coach PT Sessions",
                        "Unlimited Sauna, Steam & Recovery Suite",
                        "45-Day Annual Membership Freeze Privilege",
                      ]}
                      onSelectCheckout={setCheckoutItem}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="relative py-14 border-t border-[#2A2A2A] bg-[#0D0D0D] overflow-hidden">
        <div className="absolute inset-0 spotlight-beam-gold-wide pointer-events-none opacity-50" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-sm bg-[#121212]/90 border border-[#2A2A2A] hover:border-[#D4AF37]/60 transition-colors flex items-center gap-4">
              <span className="w-12 h-12 rounded-sm bg-[#D4AF37]/12 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
              </span>
              <span>
                <span className="block font-display text-xl text-white tracking-wider uppercase">
                  Secure Payment
                </span>
                <span className="block text-xs text-[#B3B3B3]">
                  256-bit TLS encrypted checkout with instant BDT invoice
                </span>
              </span>
            </div>
            <div className="p-5 rounded-sm bg-[#121212]/90 border border-[#2A2A2A] hover:border-[#D4AF37]/60 transition-colors flex items-center gap-4">
              <span className="w-12 h-12 rounded-sm bg-[#D4AF37]/12 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6 text-[#D4AF37]" />
              </span>
              <span>
                <span className="block font-display text-xl text-white tracking-wider uppercase">
                  bKash / Nagad Accepted
                </span>
                <span className="block text-xs text-[#B3B3B3]">
                  Pay instantly via bKash, Nagad, Visa or Mastercard
                </span>
              </span>
            </div>
            <div className="p-5 rounded-sm bg-[#121212]/90 border border-[#2A2A2A] hover:border-[#D4AF37]/60 transition-colors flex items-center gap-4">
              <span className="w-12 h-12 rounded-sm bg-[#D4AF37]/12 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6 text-[#D4AF37]" />
              </span>
              <span>
                <span className="block font-display text-xl text-white tracking-wider uppercase">
                  Cancel Anytime
                </span>
                <span className="block text-xs text-[#B3B3B3]">
                  Flexible cancellation + 15–45 day freeze on 6M &amp; 12M plans.
                  Card payments protected.
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Side-by-Side 3-Branch Master Comparison Matrix */}
      <section className="py-20 bg-[#0D0D0D] border-t border-[#2A2A2A]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
              SIDE-BY-SIDE MASTER LEDGER
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-white uppercase tracking-wider">
              ALL 3 BRANCHES QUICK COMPARISON (BDT)
            </h2>
          </div>

          <div className="overflow-x-auto iron-glass-card rounded-sm border border-[#2A2A2A]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2A2A2A] bg-[#141414] font-mono-tech text-xs uppercase text-[#B3B3B3]">
                  <th className="p-5">PACKAGE TIER / FEATURE</th>
                  <th className="p-5 text-white">
                    01. LALBAGH BRANCH
                    <span className="block text-[10px] text-[#D4AF37]">
                      THE IRON FORGE
                    </span>
                  </th>
                  <th className="p-5 text-white bg-[#1E190B]/60 border-x border-[#D4AF37]/30">
                    02. DHANMONDI BRANCH
                    <span className="block text-[10px] text-[#D4AF37]">
                      THE FLAGSHIP CLUB
                    </span>
                  </th>
                  <th className="p-5 text-white">
                    03. MIRPUR BRANCH
                    <span className="block text-[10px] text-[#D4AF37]">
                      THE PERFORMANCE LAB
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222] text-sm font-mono-tech">
                <tr>
                  <td className="p-5 text-[#B3B3B3]">3 MONTHS PACKAGE</td>
                  <td className="p-5 text-white font-bold text-lg">
                    <span className="text-[#D4AF37]">৳</span>1,700
                  </td>
                  <td className="p-5 text-white font-bold text-lg bg-[#1E190B]/30 border-x border-[#D4AF37]/20">
                    <span className="text-[#D4AF37]">৳</span>3,450
                  </td>
                  <td className="p-5 text-white font-bold text-lg">
                    <span className="text-[#D4AF37]">৳</span>3,500
                  </td>
                </tr>
                <tr>
                  <td className="p-5 text-[#D4AF37] font-bold">
                    6 MONTHS (MOST POPULAR)
                  </td>
                  <td className="p-5 text-[#D4AF37] font-bold text-xl">
                    ৳3,200
                  </td>
                  <td className="p-5 text-[#D4AF37] font-bold text-xl bg-[#1E190B]/50 border-x border-[#D4AF37]/30">
                    ৳6,300
                  </td>
                  <td className="p-5 text-[#D4AF37] font-bold text-xl">
                    ৳6,000
                  </td>
                </tr>
                <tr>
                  <td className="p-5 text-[#B3B3B3]">12 MONTHS TITAN VIP</td>
                  <td className="p-5 text-white font-bold text-lg">
                    <span className="text-[#D4AF37]">৳</span>5,700
                  </td>
                  <td className="p-5 text-white font-bold text-lg bg-[#1E190B]/30 border-x border-[#D4AF37]/20">
                    <span className="text-[#D4AF37]">৳</span>9,800
                  </td>
                  <td className="p-5 text-white font-bold text-lg">
                    <span className="text-[#D4AF37]">৳</span>10,000
                  </td>
                </tr>
                <tr>
                  <td className="p-5 text-[#B3B3B3]">FLOOR AREA</td>
                  <td className="p-5 text-white">7,800 sq.ft</td>
                  <td className="p-5 text-white bg-[#1E190B]/30 border-x border-[#D4AF37]/20">
                    14,500 sq.ft (2 Levels)
                  </td>
                  <td className="p-5 text-white">12,200 sq.ft</td>
                </tr>
                <tr>
                  <td className="p-5 text-[#B3B3B3]">RECOVERY & WELLNESS</td>
                  <td className="p-5 text-[#B3B3B3]">
                    High-Pressure Showers + Fuel Bar
                  </td>
                  <td className="p-5 text-white bg-[#1E190B]/30 border-x border-[#D4AF37]/20">
                    Infrared Sauna + Cold Plunge
                  </td>
                  <td className="p-5 text-white">
                    Steam Bath + Ladies Studio Floor
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Supported Payment Gateways Strip */}
          <div className="p-6 rounded-sm bg-[#121212] border border-[#2A2A2A] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-6 h-6 text-[#D4AF37]" />
              <div>
                <div className="text-xs font-mono-tech font-bold text-white uppercase">
                  INSTANT BANGLADESH DIGITAL CHECKOUT
                </div>
                <div className="text-xs text-[#B3B3B3]">
                  Zero extra gateway surcharge on bKash, Nagad, or local
                  Visa/Mastercard/AMEX cards.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 font-mono-tech text-xs text-white">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#1A1A1A] border border-pink-500/40 text-pink-400">
                <Smartphone className="w-3.5 h-3.5" /> bKash Merchant
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#1A1A1A] border border-orange-500/40 text-orange-400">
                <Smartphone className="w-3.5 h-3.5" /> Nagad Pay
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#1A1A1A] border border-sky-500/40 text-sky-400">
                <CreditCard className="w-3.5 h-3.5" /> Visa / Mastercard
              </span>
            </div>
          </div>
        </div>
      </section>

      <CheckoutModal
        isOpen={Boolean(checkoutItem)}
        onClose={() => setCheckoutItem(null)}
        initialSelection={checkoutItem}
      />
    </div>
  );
}
