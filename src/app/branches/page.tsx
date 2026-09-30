"use client";
import { apiFetch } from "@/lib/api-client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Navigation,
  Flame,
} from "lucide-react";
import CheckoutModal, { CheckoutSelection } from "@/components/CheckoutModal";

interface BranchItem {
  slug: "lalbagh" | "dhanmondi" | "mirpur";
  name: string;
  code: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  mapEmbedUrl: string;
  coordinates: string;
  heroImage: string;
  gallery: string[];
  facilities: string[];
  equipment: string[];
  stats: {
    areaSqFt: string;
    machines: number;
    trainers: number;
    maxCapacity: number;
  };
  price3Months: number;
  price6Months: number;
  price12Months: number;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [activeMapSlug, setActiveMapSlug] = useState<
    "lalbagh" | "dhanmondi" | "mirpur"
  >("dhanmondi");
  const [checkoutItem, setCheckoutItem] = useState<CheckoutSelection | null>(
    null
  );

  useEffect(() => {
    apiFetch("/api/branches")
      .then((r) => r.json())
      .then((d) => {
        if (d?.branches) setBranches(d.branches);
      })
      .catch(console.error);
  }, []);

  const activeMapBranch =
    branches.find((b) => b.slug === activeMapSlug) || branches[0];

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
              <span className="text-white font-semibold">Lalbagh</span>,{" "}
              <span className="text-white font-semibold">Dhanmondi</span>, and{" "}
              <span className="text-white font-semibold">Mirpur</span> below.
            </p>
          </div>
        </div>
      </section>

      {/* All 3 Branches Detailed Cards */}
      <section className="py-20 border-b border-[#2A2A2A]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-16">
          {branches.map((branch, idx) => (
            <div
              key={branch.slug}
              className="iron-glass-card rounded-sm overflow-hidden border border-[#2A2A2A] hover:border-[#D4AF37]/60 transition-all grid grid-cols-1 lg:grid-cols-12"
            >
              {/* Left Visual Gallery */}
              <div
                className={`lg:col-span-5 relative min-h-[340px] flex flex-col justify-between p-6 bg-cover bg-center ${
                  idx % 2 === 1 ? "lg:order-2" : ""
                }`}
                style={{ backgroundImage: `url('${branch.heroImage}')` }}
              >
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-[#0A0A0A]/30" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-sm bg-[#0A0A0A]/90 border border-[#D4AF37] font-mono-tech text-xs text-[#D4AF37] uppercase tracking-widest">
                    {branch.code}
                  </span>
                  <span className="px-3 py-1 rounded-sm bg-[#0A0A0A]/90 border border-[#2A2A2A] font-mono-tech text-xs text-white">
                    {branch.coordinates}
                  </span>
                </div>

                {/* Mini Thumbnail Strip */}
                <div className="relative z-10 space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {branch.gallery.map((gUrl, gIdx) => (
                      <img loading="lazy" decoding="async"
                        key={gIdx}
                        src={gUrl}
                        alt={`${branch.name} view ${gIdx + 1}`}
                        className="h-14 w-full object-cover rounded-sm border border-white/20"
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-sm bg-[#0A0A0A]/90 border border-[#2A2A2A] font-mono-tech text-center">
                    <div>
                      <div className="text-[10px] text-[#B3B3B3]">FLOOR</div>
                      <div className="text-xs font-bold text-white">
                        {branch.stats.areaSqFt}
                      </div>
                    </div>
                    <div className="border-x border-[#2A2A2A]">
                      <div className="text-[10px] text-[#B3B3B3]">MACHINES</div>
                      <div className="text-xs font-bold text-[#D4AF37]">
                        {branch.stats.machines} Units
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#B3B3B3]">COACHES</div>
                      <div className="text-xs font-bold text-white">
                        {branch.stats.trainers} Master
                      </div>
                    </div>
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
                    <button
                      type="button"
                      onClick={() => setActiveMapSlug(branch.slug)}
                      className="px-3.5 py-2 rounded-sm bg-[#151515] border border-[#2A2A2A] hover:border-[#D4AF37] font-mono-tech text-xs text-white flex items-center gap-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>LOCATE ON MAP</span>
                    </button>
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

                  {/* Facilities Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {branch.facilities.map((fac, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-center gap-2 text-xs text-[#B3B3B3]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span>{fac}</span>
                      </div>
                    ))}
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
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Dhaka Map Pin Locator */}
      {activeMapBranch && (
        <section className="py-20 bg-[#0D0D0D]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                  INTERACTIVE SATELLITE & STREET PIN
                </span>
                <h2 className="font-display text-4xl sm:text-5xl text-white tracking-wider uppercase mt-1">
                  CLUB MAP: {activeMapBranch.name}
                </h2>
              </div>

              <div className="flex gap-2">
                {(["lalbagh", "dhanmondi", "mirpur"] as const).map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setActiveMapSlug(slug)}
                    className={`px-4 py-2.5 rounded-sm font-mono-tech text-xs font-bold uppercase border transition-all ${
                      activeMapSlug === slug
                        ? "bg-[#D4AF37] border-[#E8C766] text-[#0A0A0A]"
                        : "bg-[#141414] border-[#2A2A2A] text-[#B3B3B3]"
                    }`}
                  >
                    {slug} PIN
                  </button>
                ))}
              </div>
            </div>

            <div className="iron-glass-card rounded-sm overflow-hidden border border-[#2A2A2A] grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-4 p-6 sm:p-8 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="font-mono-tech text-xs text-[#D4AF37] uppercase">
                    {activeMapBranch.code}
                  </span>
                  <h3 className="font-display text-3xl text-white uppercase">
                    {activeMapBranch.name}
                  </h3>
                  <p className="text-xs text-[#B3B3B3]">
                    {activeMapBranch.address}
                  </p>
                  <div className="p-3 rounded-sm bg-[#111111] border border-[#2A2A2A] font-mono-tech text-xs text-white">
                    GPS: {activeMapBranch.coordinates}
                  </div>
                </div>

                <Link
                  href={`/branches/${activeMapBranch.slug}`}
                  className="btn-crimson-primary py-3 rounded-sm text-center text-xs font-bold uppercase tracking-widest block"
                >
                  OPEN {activeMapBranch.slug.toUpperCase()} DETAIL PAGE →
                </Link>
              </div>

              <div className="lg:col-span-8 h-[380px] bg-[#111111]">
                <iframe
                  title={`${activeMapBranch.name} Map`}
                  src={activeMapBranch.mapEmbedUrl}
                  className="w-full h-full border-0 filter invert-[90%] hue-rotate-180 contrast-125"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      <CheckoutModal
        isOpen={Boolean(checkoutItem)}
        onClose={() => setCheckoutItem(null)}
        initialSelection={checkoutItem}
      />
    </div>
  );
}
