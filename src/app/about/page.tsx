"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame,
  ShieldCheck,
  Target,
  Award,
  Dumbbell,
  ArrowRight,
  CheckCircle2,
  MapPin,
} from "lucide-react";

const GALLERY_IMAGES = [
  {
    url: "https://images.pexels.com/photos/2261481/pexels-photo-2261481.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    title: "Calibrated Competition Iron — Lalbagh Club",
    branch: "Lalbagh Branch",
  },
  {
    url: "https://images.pexels.com/photos/30191517/pexels-photo-30191517.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    title: "Midnight Kettlebell & Conditioning Zone — Dhanmondi",
    branch: "Dhanmondi Branch",
  },
  {
    url: "https://images.pexels.com/photos/7674492/pexels-photo-7674492.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    title: "Olympic Barbell & Women's Strength Studio — Mirpur",
    branch: "Mirpur Branch",
  },
  {
    url: "https://images.pexels.com/photos/17706044/pexels-photo-17706044.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    title: "High-Contrast Hypertrophy Lighting Floor",
    branch: "Dhanmondi Flagship",
  },
  {
    url: "https://images.pexels.com/photos/11618177/pexels-photo-11618177.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    title: "Heavy Free-Weight Dumbbell Arsenal (Up to 65KG)",
    branch: "Lalbagh Iron Forge",
  },
  {
    url: "https://images.pexels.com/photos/4720790/pexels-photo-4720790.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    title: "Deadlift Shock-Absorbing Competition Platforms",
    branch: "Mirpur Performance Lab",
  },
];

export default function AboutPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  const filteredGallery =
    selectedFilter === "ALL"
      ? GALLERY_IMAGES
      : GALLERY_IMAGES.filter((img) =>
          img.branch.toUpperCase().includes(selectedFilter)
        );

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] min-h-screen">
      {/* Hero Banner */}
      <section className="relative py-24 lg:py-32 border-b border-[#2A2A2A] overflow-hidden">
        <div className="absolute inset-0 spotlight-beam-red pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#151515] border border-[#D4AF37]/50 font-mono-tech text-xs text-[#D4AF37] uppercase tracking-[0.2em]">
              <Flame className="w-3.5 h-3.5" />
              <span>OUR ORIGIN & ARCHITECTURAL MANIFESTO</span>
            </span>
            <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl text-white tracking-wider uppercase leading-[0.94]">
              WE DID NOT BUILD A GYM.{" "}
              <span className="text-[#D4AF37] crimson-glow-text">
                WE BUILT A FORGE.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#B3B3B3] leading-relaxed">
              Founded by Master Performance Architect{" "}
              <span className="text-white font-semibold">Rayhan Chowdhury</span>
              , Rayhan Fitness began in Old Dhaka&apos;s Lalbagh with a single
              conviction: Bangladeshi athletes deserve world-class biomechanics,
              uncompromising hygiene, and scientifically periodized coaching—without
              inflated country-club pretension.
            </p>
          </div>
        </div>
      </section>

      {/* Story & Mission Split */}
      <section className="py-20 lg:py-24 border-b border-[#2A2A2A]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
              THE RAYHAN DOCTRINE
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-white tracking-wider uppercase">
              THREE CLUBS. ONE STANDARD OF EXCELLENCE.
            </h2>
            <p className="text-sm sm:text-base text-[#B3B3B3] leading-relaxed">
              Every Rayhan Fitness facility is acoustically treated, climate
              controlled with medical-grade HEPA air exchange, and lit with
              custom high-contrast stage lighting designed to put your mind in a
              tunnel-vision state of flow the moment you scan your fingerprint at
              the turnstile.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {[
                {
                  icon: Target,
                  title: "BIOMECHANICAL PRECISION",
                  desc: "Imported Hammer Strength, Eleiko, and Rogue racks calibrated for zero joint shear.",
                },
                {
                  icon: Award,
                  title: "CERTIFIED COACHING",
                  desc: "Every floor trainer holds accredited strength, rehab, or combat conditioning credentials.",
                },
                {
                  icon: ShieldCheck,
                  title: "SAFE & INCLUSIVE",
                  desc: "Dedicated women's training zones & hours, biometric access control, and 24/7 CCTV.",
                },
                {
                  icon: Dumbbell,
                  title: "HONEST BDT PRICING",
                  desc: "Zero hidden registration fees. Transparent 3, 6, and 12-month packages from ৳1,700.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-5 rounded-sm iron-glass-card space-y-2"
                >
                  <item.icon className="w-6 h-6 text-[#D4AF37]" />
                  <h3 className="font-display text-xl text-white tracking-wider">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#B3B3B3] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Timeline */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-8 rounded-sm iron-glass-card border border-[#D4AF37]/40 space-y-6">
              <div className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                EVOLUTION TIMELINE // 2018 – 2026
              </div>
              {[
                {
                  year: "2018 // CLUB 01",
                  title: "LALBAGH IRON FORGE LAUNCHED",
                  desc: "Opened 7,800 sq.ft in Shaheed Nagar, Lalbagh with Old Dhaka's first competition powerlifting platforms. Packages from ৳1,700.",
                },
                {
                  year: "2021 // CLUB 02",
                  title: "DHANMONDI FLAGSHIP SANCTUARY",
                  desc: "Expanded to Road 27, Dhanmondi with 14,500 sq.ft across two levels, adding infrared saunas, InBody 770 scanners, and MMA combat conditioning.",
                },
                {
                  year: "2024 // CLUB 03",
                  title: "MIRPUR-10 PERFORMANCE LAB",
                  desc: "Unveiled 12,200 sq.ft at Mirpur-10 Circle featuring a 30m sprint turf, Olympic lifting platforms, and a private women's strength studio.",
                },
                {
                  year: "2026 // DIGITAL TELEMETRY",
                  title: "BIOMETRIC CLOUD & AI METABOLIC PORTAL",
                  desc: "Integrated unified Member, Trainer, and Admin Command Dashboards with real-time PR tracking and instant bKash/Nagad gateway checkout.",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="relative pl-6 border-l-2 border-[#D4AF37]/60 space-y-1"
                >
                  <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-[#D4AF37] shadow-[0_0_12px_#D4AF37]" />
                  <div className="font-mono-tech text-xs text-[#D4AF37]">
                    {step.year}
                  </div>
                  <div className="font-display text-2xl text-white tracking-wider">
                    {step.title}
                  </div>
                  <p className="text-xs text-[#B3B3B3] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Gallery */}
      <section className="py-20 lg:py-24">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                INSIDE THE IRON SANCTUARIES
              </span>
              <h2 className="font-display text-5xl text-white tracking-wider uppercase mt-1">
                CLUB EQUIPMENT & FLOOR GALLERY
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {["ALL", "LALBAGH", "DHANMONDI", "MIRPUR"].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 rounded-sm font-mono-tech text-xs uppercase tracking-wider border transition-all ${
                    selectedFilter === filter
                      ? "bg-[#D4AF37] border-[#E8C766] text-[#0A0A0A]"
                      : "bg-[#121212] border-[#2A2A2A] text-[#B3B3B3] hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((img, i) => (
              <motion.div
                key={img.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="iron-glass-card rounded-sm overflow-hidden group"
              >
                <div className="relative h-64 overflow-hidden">
                  <img loading="lazy" decoding="async"
                    src={img.url}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-sm bg-[#0A0A0A]/85 border border-[#D4AF37]/50 font-mono-tech text-[10px] text-[#D4AF37] uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{img.branch}</span>
                  </div>
                </div>
                <div className="p-5 flex items-center justify-between gap-2">
                  <div className="font-display text-xl text-white tracking-wider uppercase">
                    {img.title}
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="pt-6 text-center">
            <Link
              href="/branches"
              className="inline-flex items-center gap-2 btn-crimson-primary px-8 py-4 rounded-sm text-xs font-bold uppercase tracking-[0.18em]"
            >
              <span>EXPLORE ALL 3 BRANCHES & PACKAGES</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
