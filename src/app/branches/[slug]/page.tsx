"use client";
import { apiFetch } from "@/lib/api-client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Dumbbell,
  ArrowLeft,
  ShieldCheck,
  Award,
} from "lucide-react";
import PackageCard3D from "@/components/PackageCard3D";
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

interface TrainerItem {
  id: number;
  name: string;
  roleTitle: string;
  specialty: string;
  branchSlug: string;
  experienceYears: number;
  imageUrl: string;
}

export default function BranchDetailPage() {
  const params = useParams();
  const slugParam = String(params?.slug || "dhanmondi").toLowerCase();

  const [branch, setBranch] = useState<BranchItem | null>(null);
  const [branchTrainers, setBranchTrainers] = useState<TrainerItem[]>([]);
  const [activePhoto, setActivePhoto] = useState<string>("");
  const [checkoutItem, setCheckoutItem] = useState<CheckoutSelection | null>(
    null
  );

  useEffect(() => {
    apiFetch("/api/branches")
      .then((r) => r.json())
      .then((data) => {
        if (data?.branches) {
          const found =
            data.branches.find((b: BranchItem) => b.slug === slugParam) ||
            data.branches[0];
          setBranch(found);
          setActivePhoto(found.heroImage);
        }
        if (data?.trainers) {
          setBranchTrainers(
            data.trainers.filter(
              (t: TrainerItem) => t.branchSlug === slugParam
            )
          );
        }
      })
      .catch(console.error);
  }, [slugParam]);

  if (!branch) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#0A0A0A]">
        <div className="font-mono-tech text-sm text-[#D4AF37] uppercase tracking-widest animate-pulse">
          LOADING CLUB TELEMETRY...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] min-h-screen">
      {/* Branch Hero */}
      <section className="relative py-20 lg:py-28 border-b border-[#2A2A2A] overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url('${branch.heroImage}')` }}
        />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/90 to-[#0A0A0A]/60" />
        <div className="absolute inset-0 spotlight-beam-red pointer-events-none" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/branches"
              className="inline-flex items-center gap-2 text-xs font-mono-tech uppercase tracking-widest text-[#B3B3B3] hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
              <span>BACK TO ALL 3 DHAKA BRANCHES</span>
            </Link>

            {/* Quick Club Switcher */}
            <div className="flex items-center gap-2">
              {(["lalbagh", "dhanmondi", "mirpur"] as const).map((s) => (
                <Link
                  key={s}
                  href={`/branches/${s}`}
                  className={`px-3.5 py-1.5 rounded-sm font-mono-tech text-xs uppercase border transition-all ${
                    branch.slug === s
                      ? "bg-[#D4AF37] border-[#E8C766] text-[#0A0A0A]"
                      : "bg-[#141414] border-[#2A2A2A] text-[#B3B3B3] hover:text-white"
                  }`}
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>

          <div className="max-w-3xl space-y-4">
            <span className="inline-block px-3 py-1 rounded-sm bg-[#151515] border border-[#D4AF37]/60 font-mono-tech text-xs text-[#D4AF37] uppercase tracking-widest">
              {branch.code} &middot; {branch.tagline}
            </span>
            <h1 className="font-display text-6xl sm:text-7xl text-white tracking-wider uppercase leading-none">
              {branch.name}
            </h1>
            <p className="text-base sm:text-lg text-[#B3B3B3] leading-relaxed">
              {branch.description}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 max-w-3xl">
            <div className="p-4 rounded-sm bg-[#121212]/90 border border-[#2A2A2A]">
              <div className="text-[10px] font-mono-tech text-[#B3B3B3]">
                FLOOR SPACE
              </div>
              <div className="font-display text-2xl text-white mt-0.5">
                {branch.stats.areaSqFt}
              </div>
            </div>
            <div className="p-4 rounded-sm bg-[#121212]/90 border border-[#2A2A2A]">
              <div className="text-[10px] font-mono-tech text-[#B3B3B3]">
                IMPORTED RIGS
              </div>
              <div className="font-display text-2xl text-[#D4AF37] mt-0.5">
                {branch.stats.machines} MACHINES
              </div>
            </div>
            <div className="p-4 rounded-sm bg-[#121212]/90 border border-[#2A2A2A]">
              <div className="text-[10px] font-mono-tech text-[#B3B3B3]">
                RESIDENT COACHES
              </div>
              <div className="font-display text-2xl text-white mt-0.5">
                {branch.stats.trainers} CERTIFIED
              </div>
            </div>
            <div className="p-4 rounded-sm bg-[#121212]/90 border border-[#D4AF37]/50">
              <div className="text-[10px] font-mono-tech text-[#D4AF37]">
                STARTING AT
              </div>
              <div className="font-mono-tech text-xl font-bold text-white mt-0.5">
                ৳{branch.price3Months.toLocaleString()} / 3M
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Gallery + Facilities & Equipment */}
      <section className="py-20 border-b border-[#2A2A2A]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Interactive Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative h-[380px] sm:h-[440px] rounded-sm overflow-hidden border border-[#2A2A2A]">
              <img loading="lazy" decoding="async"
                src={activePhoto || branch.heroImage}
                alt={branch.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-sm bg-[#0A0A0A]/90 border border-[#2A2A2A] font-mono-tech text-xs text-white">
                {branch.name} — Interior & Equipment Gallery
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {branch.gallery.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActivePhoto(img)}
                  className={`h-20 sm:h-24 rounded-sm overflow-hidden border-2 transition-all ${
                    activePhoto === img
                      ? "border-[#D4AF37] scale-[1.02]"
                      : "border-[#2A2A2A] opacity-70 hover:opacity-100"
                  }`}
                >
                  <img loading="lazy" decoding="async"
                    src={img}
                    alt={`${branch.name} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Facilities, Equipment & Address */}
          <div className="lg:col-span-5 space-y-6">
            <div className="iron-glass-card rounded-sm p-6 space-y-4">
              <h2 className="font-display text-3xl text-white uppercase tracking-wider">
                LOCATION & OPERATING HOURS
              </h2>
              <div className="space-y-3 text-xs font-mono-tech text-[#F5F5F5]/90">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>{branch.address}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>{branch.phone}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>{branch.hours}</span>
                </div>
              </div>
            </div>

            <div className="iron-glass-card rounded-sm p-6 space-y-4">
              <h3 className="font-display text-2xl text-white uppercase tracking-wider flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-[#D4AF37]" />
                <span>FACILITIES & EQUIPMENT ARSENAL</span>
              </h3>
              <div className="space-y-2">
                {branch.facilities.map((fac, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 text-xs text-[#F5F5F5]/90"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span>{fac}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-[#2A2A2A] space-y-1.5">
                <div className="text-[10px] font-mono-tech text-[#D4AF37] uppercase tracking-widest">
                  CALIBRATED HARDWARE HIGHLIGHTS:
                </div>
                {branch.equipment.map((eqItem, i) => (
                  <div
                    key={i}
                    className="text-xs font-mono-tech text-[#B3B3B3]"
                  >
                    • {eqItem}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Branch Own Pricing Table (3M, 6M, 12M in BDT) */}
      <section className="py-20 lg:py-24 bg-[#0D0D0D] border-b border-[#2A2A2A]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="font-mono-tech text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
              OFFICIAL {branch.name.toUpperCase()} TARIFF
            </span>
            <h2 className="font-display text-5xl text-white tracking-wider uppercase">
              {branch.name} PACKAGES (৳)
            </h2>
            <p className="text-sm text-[#B3B3B3]">
              Select your preferred commitment below. All packages include
              biometric access, locker privileges, and instant bKash/Nagad/Card
              checkout.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <PackageCard3D
              branchSlug={branch.slug}
              branchName={branch.name}
              durationMonths={3}
              planName="3 MONTHS IGNITION"
              subtitle={`Quarterly strength & conditioning access at ${branch.name}`}
              amountBdt={branch.price3Months}
              monthlyEquivalent={Math.round(branch.price3Months / 3)}
              features={[
                `Full ${branch.name} Gym Access`,
                "Biometric Fingerprint Entry & Smart Locker",
                "1x Baseline InBody Biometric Scan",
                "Certified Floor Coach Supervision",
                "Personalized Split Routine Sheet",
              ]}
              onSelectCheckout={setCheckoutItem}
            />

            <PackageCard3D
              branchSlug={branch.slug}
              branchName={branch.name}
              durationMonths={6}
              planName="6 MONTHS VANGUARD"
              subtitle="Best-value transformation plan with recovery & body scans"
              amountBdt={branch.price6Months}
              monthlyEquivalent={Math.round(branch.price6Months / 6)}
              originalPriceBdt={branch.price3Months * 2}
              isPopular={true}
              features={[
                `Unlimited ${branch.name} Floor & Turf Access`,
                "3x InBody 3D Body Composition Assessments",
                "2x 1-on-1 Personal Trainer Form Clinics",
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
              subtitle="Annual elite athlete status with cross-branch guest passes"
              amountBdt={branch.price12Months}
              monthlyEquivalent={Math.round(branch.price12Months / 12)}
              originalPriceBdt={branch.price3Months * 4}
              features={[
                `All-Hours VIP Access at ${branch.name}`,
                "4x Monthly Guest Passes to Other Dhaka Clubs",
                "Unlimited Monthly InBody 3D Scans",
                "6x 1-on-1 Master Coach Sessions Included",
                "Unlimited Sauna, Steam & Recovery Lounge",
                "45-Day Annual Membership Freeze Privilege",
              ]}
              onSelectCheckout={setCheckoutItem}
            />
          </div>
        </div>
      </section>

      {/* Map Embed & Resident Coaches */}
      <section className="py-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 space-y-4">
            <h3 className="font-display text-3xl text-white uppercase tracking-wider">
              INTERACTIVE MAP — {branch.name}
            </h3>
            <div className="h-[340px] rounded-sm overflow-hidden border border-[#2A2A2A]">
              <iframe
                title={`${branch.name} Map`}
                src={branch.mapEmbedUrl}
                className="w-full h-full border-0 filter invert-[90%] hue-rotate-180 contrast-125"
                loading="lazy"
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-3xl text-white uppercase tracking-wider">
                RESIDENT MASTER COACHES
              </h3>
              <Link
                href="/trainers"
                className="font-mono-tech text-xs text-[#D4AF37] uppercase hover:text-white"
              >
                VIEW ALL COACHES →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {branchTrainers.map((coach) => (
                <div
                  key={coach.id}
                  className="iron-glass-card rounded-sm overflow-hidden flex flex-col"
                >
                  <img loading="lazy" decoding="async"
                    src={coach.imageUrl}
                    alt={coach.name}
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono-tech text-[#D4AF37] uppercase">
                      <Award className="w-3.5 h-3.5" />
                      <span>{coach.experienceYears} YRS EXPERIENCE</span>
                    </div>
                    <div className="font-display text-2xl text-white uppercase">
                      {coach.name}
                    </div>
                    <div className="text-xs text-[#B3B3B3]">
                      {coach.specialty}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-sm bg-[#121212] border border-[#2A2A2A] flex items-center gap-3 text-xs font-mono-tech text-[#B3B3B3]">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>
                All resident trainers at {branch.name} are CPR/AED Trauma
                certified and background verified.
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
