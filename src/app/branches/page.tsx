"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Flame,
  Crown,
  HeartPulse,
  Sparkles,
  Zap,
} from "lucide-react";
import CheckoutModal, { CheckoutSelection } from "@/components/CheckoutModal";

interface BranchItem {
  slug: string;
  name: string;
  code: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  hours: string;
  highlight: string;
  gradient: string;
  accentIcon: string;
  price3Months: number;
  price6Months: number;
  price12Months: number;
}

const BRANCHES_DATA: BranchItem[] = [
  {
    slug: "dhanmondi",
    name: "Rayhan Fitness — Dhanmondi",
    code: "FLAGSHIP 01",
    tagline: "DHAKA FLAGSHIP",
    description:
      "Our flagship location sets the standard for premium strength training in Dhaka. Spanning two levels with a dedicated powerlifting floor, competition-grade Eleiko & Rogue equipment, and a fully equipped combat training zone with boxing ring and Muay Thai facilities. The Women's Elite private training floor offers an exclusive environment for our female members.",
    address: "House 12, Road 5, Dhanmondi, Dhaka 1205",
    phone: "01736-574900",
    hours: "6:00 AM – 11:00 PM (Daily)",
    highlight: "Flagship club with full powerlifting floor and dedicated combat training zone",
    gradient: "from-amber-900/40 via-orange-900/30 to-amber-900/40",
    accentIcon: "Crown",
    price3Months: 3450,
    price6Months: 6300,
    price12Months: 9800,
  },
  {
    slug: "gulshan",
    name: "Rayhan Fitness — Gulshan",
    code: "PREMIUM 02",
    tagline: "GULSHAN ELITE",
    description:
      "Our premium Gulshan location brings Midnight Iron standards to the diplomatic zone. Featuring the exclusive Women's Elite private training floor with specialized glute/hamstring equipment, pelvic floor integration stations, and cycle-aware programming. The conditioning floor boasts prowler tracks, ski-ergs, and assault bikes. Executive locker rooms with towel service and infrared saunas.",
    address: "Road 11, Gulshan 1, Dhaka 1212",
    phone: "01736-574901",
    hours: "6:00 AM – 11:00 PM (Daily)",
    highlight: "Premium location featuring the Women's Elite private training floor",
    gradient: "from-rose-900/40 via-pink-900/30 to-rose-900/40",
    accentIcon: "Sparkles",
    price3Months: 4200,
    price6Months: 7800,
    price12Months: 12500,
  },
  {
    slug: "uttara",
    name: "Rayhan Fitness — Uttara",
    code: "PERFORMANCE 03",
    tagline: "UTTARA PERFORMANCE",
    description:
      "Our largest facility by square footage, purpose-built for metabolic conditioning and cardiovascular performance. Features a 40-meter prowler track, 20+ assault bikes, 15 ski-ergs, 10 rowers, and a dedicated HIIT studio. The strength floor includes Hammer Strength plate-loaded lines and a full dumbbell rack to 65kg. Ideal for athletes prioritizing work capacity and fat loss.",
    address: "Sector 7, Uttara, Dhaka 1230",
    phone: "01736-574902",
    hours: "6:00 AM – 10:00 PM (Daily)",
    highlight: "Largest conditioning and cardio zone across all branches",
    gradient: "from-emerald-900/40 via-teal-900/30 to-emerald-900/40",
    accentIcon: "Zap",
    price3Months: 3500,
    price6Months: 6000,
    price12Months: 10000,
  },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Crown,
  Sparkles,
  Zap,
  HeartPulse,
  Dumbbell,
  Flame,
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [checkoutItem, setCheckoutItem] = useState<CheckoutSelection | null>(
    null
  );

  // Use static data for now (matches the design requirements)
  useEffect(() => {
    setBranches(BRANCHES_DATA);
  }, []);

  const IconComponent = (iconName: string) => {
    const Comp = ICON_MAP[iconName] || Crown;
    return <Comp className="w-14 h-14" />;
  };

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] min-h-screen">
      {/* Hero */}
      <section className="relative py-20 lg:py-28 border-b border-[#2A2A2A] overflow-hidden">
        <div className="absolute inset-0 spotlight-beam-red pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#151515] border border-[#D4AF37]/50 font-mono-tech text-xs text-[#D4AF37] uppercase tracking-[0.2em]">
              <MapPin className="w-3.5 h-3.5" />
              <span>3 PREMIUM CLUBS ACROSS DHAKA</span>
            </span>
            <h1 className="font-display text-6xl sm:text-7xl text-white tracking-wider uppercase leading-none">
              OUR BRANCHES IN{" "}
              <span className="text-[#D4AF37] crimson-glow-text">DHAKA</span>
            </h1>
            <p className="text-base sm:text-lg text-[#B3B3B3] leading-relaxed">
              Each Rayhan Fitness branch is uniquely tailored to its neighborhood
              while maintaining our signature Midnight Iron standards. Explore{" "}
              <span className="text-white font-semibold">Dhanmondi</span>,{" "}
              <span className="text-white font-semibold">Gulshan</span>, and{" "}
              <span className="text-white font-semibold">Uttara</span> below.
            </p>
          </div>
        </div>
      </section>

      {/* Branches Grid */}
      <section className="py-20 border-b border-[#2A2A2A]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-12">
          {branches.map((branch, idx) => (
            <motion.div
              key={branch.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="iron-glass-card rounded-sm overflow-hidden border border-[#2A2A2A] hover:border-[#D4AF37]/60 transition-all grid grid-cols-1 lg:grid-cols-12"
            >
              {/* Left Visual - Gradient Icon Card */}
              <div
                className={`lg:col-span-5 relative min-h-[340px] flex flex-col justify-between p-6 bg-cover bg-center ${
                  idx % 2 === 1 ? "lg:order-2" : ""
                } bg-gradient-to-br ${branch.gradient}`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-[#0A0A0A]/40 to-[#0A0A0A]/20" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.15)_0%,_transparent_70%)]" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-sm bg-[#0A0A0A]/90 border border-[#D4AF37] font-mono-tech text-xs text-[#D4AF37] uppercase tracking-widest">
                    {branch.code}
                  </span>
                  <span className="px-3 py-1 rounded-sm bg-[#0A0A0A]/90 border border-[#2A2A2A] font-mono-tech text-xs text-white">
                    {branch.tagline}
                  </span>
                </div>

                {/* Large Center Icon */}
                <div className="relative z-10 flex items-center justify-center flex-1">
                  <div className="p-8 sm:p-10 rounded-full bg-[#0A0A0A]/80 border border-[#D4AF37]/40 backdrop-blur-sm shadow-[0_0_60px_rgba(0,0,0,0.5)]">
                    {IconComponent(branch.accentIcon)}
                  </div>
                </div>

                {/* Bottom Stats */}
                <div className="relative z-10 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-sm bg-[#0A0A0A]/90 border border-[#D4AF37]/30 text-center">
                      <div className="text-[10px] font-mono-tech text-[#B3B3B3]">FLOOR SPACE</div>
                      <div className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
                        12,000+ sq ft
                      </div>
                    </div>
                    <div className="p-3 rounded-sm bg-[#0A0A0A]/90 border border-[#D4AF37]/30 text-center border-x border-[#D4AF37]/30">
                      <div className="text-[10px] font-mono-tech text-[#B3B3B3]">EQUIPMENT</div>
                      <div className="font-display text-xl sm:text-2xl font-bold text-[#D4AF37] mt-0.5">
                        150+ Units
                      </div>
                    </div>
                    <div className="p-3 rounded-sm bg-[#0A0A0A]/90 border border-[#D4AF37]/30 text-center">
                      <div className="text-[10px] font-mono-tech text-[#B3B3B3]">MASTER COACHES</div>
                      <div className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
                        12 Certified
                      </div>
                    </div>
                  </div>

                  {/* Highlight Feature */}
                  <div className="p-3 rounded-sm bg-[#0A0A0A]/90 border border-[#D4AF37]/50 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span className="font-mono-tech text-xs text-[#E8C766]">
                      {branch.highlight}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Details & Pricing */}
              <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                        {branch.tagline}
                      </span>
                      <h2 className="font-display text-4xl sm:text-5xl text-white tracking-wider uppercase">
                        {branch.name}
                      </h2>
                    </div>
                  </div>

                  <p className="text-sm text-[#B3B3B3] leading-relaxed">
                    {branch.description}
                  </p>

                  {/* Address, Phone, Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono-tech text-[#F5F5F5]/90">
                    <div className="flex items-start gap-2.5 p-3 rounded-sm bg-[#111111] border border-[#242424]">
                      <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="flex flex-col justify-center gap-1.5 p-3 rounded-sm bg-[#111111] border border-[#242424]">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{branch.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#B3B3B3]">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="truncate">{branch.hours}</span>
                      </div>
                    </div>
                  </div>

                  {/* Facilities */}
                  <div className="pt-2 space-y-1.5">
                    <div className="font-mono-tech text-xs text-[#D4AF37] uppercase tracking-wider">
                      KEY FACILITIES
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "Powerlifting Platforms (Competition Spec)",
                        "Hammer Strength & Eleiko Machines",
                        "Combat Zone: Boxing Ring + Muay Thai",
                        "Women's Elite Private Floor",
                        "Infrared Saunas & Recovery Suite",
                        "Prowler Track & Conditioning Floor",
                        "Executive Lockers & Towel Service",
                        "24/7 Biometric Access",
                      ].map((fac, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex items-center gap-2 text-xs text-[#B3B3B3] p-2 rounded-sm bg-[#111111] border border-[#242424]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                          <span>{fac}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Exact BDT Pricing Strip + CTAs */}
                <div className="pt-6 border-t border-[#2A2A2A] space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div
                      onClick={() =>
                        setCheckoutItem({
                          branchSlug: branch.slug,
                          branchName: branch.name,
                          durationMonths: 3,
                          planName: "3 Months",
                          amountBdt: branch.price3Months,
                        })
                      }
                      className="cursor-pointer p-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A] hover:border-[#D4AF37] transition-all text-center"
                    >
                      <div className="text-[10px] font-mono-tech text-[#B3B3B3] uppercase">
                        3 MONTHS
                      </div>
                      <div className="font-mono-tech text-xl sm:text-2xl font-bold text-white mt-0.5">
                        ৳{branch.price3Months.toLocaleString()}
                      </div>
                    </div>

                    <div
                      onClick={() =>
                        setCheckoutItem({
                          branchSlug: branch.slug,
                          branchName: branch.name,
                          durationMonths: 6,
                          planName: "6 Months",
                          amountBdt: branch.price6Months,
                        })
                      }
                      className="cursor-pointer p-3.5 rounded-sm bg-[#1E190B] border border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)] text-center relative"
                    >
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-sm bg-[#D4AF37] font-mono-tech text-[9px] font-bold text-[#0A0A0A] uppercase">
                        POPULAR
                      </span>
                      <div className="text-[10px] font-mono-tech text-[#E8C766] uppercase">
                        6 MONTHS
                      </div>
                      <div className="font-mono-tech text-xl sm:text-2xl font-bold text-white mt-0.5">
                        ৳{branch.price6Months.toLocaleString()}
                      </div>
                    </div>

                    <div
                      onClick={() =>
                        setCheckoutItem({
                          branchSlug: branch.slug,
                          branchName: branch.name,
                          durationMonths: 12,
                          planName: "12 Months",
                          amountBdt: branch.price12Months,
                        })
                      }
                      className="cursor-pointer p-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A] hover:border-[#D4AF37] transition-all text-center"
                    >
                      <div className="text-[10px] font-mono-tech text-[#B3B3B3] uppercase">
                        12 MONTHS
                      </div>
                      <div className="font-mono-tech text-xl sm:text-2xl font-bold text-white mt-0.5">
                        ৳{branch.price12Months.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/branches/${branch.slug}`}
                      className="flex-1 btn-crimson-primary py-3.5 px-6 rounded-sm text-xs font-bold uppercase tracking-[0.16em] flex items-center justify-center gap-2"
                    >
                      <Flame className="w-4 h-4" />
                      <span>SEE PACKAGES & FULL CLUB PAGE</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        setCheckoutItem({
                          branchSlug: branch.slug,
                          branchName: branch.name,
                          durationMonths: 6,
                          planName: "6 Months",
                          amountBdt: branch.price6Months,
                        })
                      }
                      className="btn-matte-iron py-3.5 px-6 rounded-sm text-xs font-bold uppercase tracking-[0.16em] flex items-center gap-2"
                    >
                      <Dumbbell className="w-4 h-4 text-[#D4AF37]" />
                      <span>QUICK BUY (৳)</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
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