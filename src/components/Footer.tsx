"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  Phone,
  ShieldCheck,
  Lock,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import {
  RAYHAN_PHONE_DISPLAY,
  RAYHAN_PHONE_TEL,
  RAYHAN_FACEBOOK_URL,
  FacebookIcon,
} from "./Navbar";

export default function Footer() {
  const pathname = usePathname();
  // Dedicated admin console has its own shell — never render public footer there.
  if (pathname?.startsWith("/admin")) return null;
  return (
    <footer className="relative bg-[#070707] border-t border-[#2A2A2A] text-[#B3B3B3] overflow-hidden">
      {/* Subtle Top Gold Accent Line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-75" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-14 border-b border-[#222222]">
          {/* Col 1: Brand & Security Manifesto */}
          <div className="lg:col-span-4 space-y-5">
            <Link
              href="/"
              className="flex items-center gap-3"
              aria-label="Rayhan Fitness — Home"
            >
              <BrandLogo height={56} />
            </Link>
            <p className="font-mono-tech text-[10px] tracking-[0.22em] text-[#B3B3B3] uppercase -mt-2">
              Elite Private Club // Dhaka, Bangladesh
            </p>

            <p className="text-sm text-[#B3B3B3] leading-relaxed max-w-sm">
              Dhaka&apos;s premier high-performance strength, hypertrophy, and
              combat conditioning network across{" "}
              <span className="text-white font-medium">Lalbagh</span>,{" "}
              <span className="text-white font-medium">Dhanmondi</span>, and{" "}
              <span className="text-white font-medium">Mirpur</span>. Engineered
              for athletes who refuse mediocrity.
            </p>

            {/* Contact + Social Row */}
            <div className="flex items-center gap-3">
              <a
                href={RAYHAN_FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Rayhan Fitness on Facebook"
                title="Follow us on Facebook"
                className="fb-glow-link w-11 h-11 rounded-sm bg-[#151515] border border-[#2A2A2A] flex items-center justify-center text-[#B3B3B3]"
              >
                <FacebookIcon className="w-[20px] h-[20px]" />
              </a>
              <a
                href={RAYHAN_PHONE_TEL}
                className="flex-1 px-4 py-2.5 rounded-sm bg-[#151515] border border-[#2A2A2A] hover:border-[#D4AF37] transition-colors flex items-center gap-2.5"
              >
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>
                  <span className="block text-[10px] font-mono-tech uppercase tracking-widest text-[#B3B3B3]">
                    Call Our Concierge
                  </span>
                  <span className="block font-mono-tech text-sm font-bold text-white">
                    {RAYHAN_PHONE_DISPLAY}
                  </span>
                </span>
              </a>
            </div>

            {/* Security Hardening Badges */}
            <div className="p-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono-tech text-white uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>ENTERPRISE SECURITY ARCHITECTURE</span>
              </div>
              <p className="text-[11px] font-mono-tech text-[#B3B3B3] leading-relaxed">
                JWT HttpOnly SameSite=Strict • Bcrypt Salt Hashing • Drizzle ORM
                Parameterized SQL • CSRF + Rate-Limit Shield • 2FA OTP Ready •
                Cloudflare WAF / DDoS Protected
              </p>
            </div>
          </div>

          {/* Col 2: Quick Navigation */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-display text-xl tracking-[0.1em] text-white uppercase">
              NAVIGATION
            </h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "Home", href: "/" },
                { label: "About Our Story", href: "/about" },
                { label: "All 3 Branches", href: "/branches" },
                { label: "Packages & Pricing (৳)", href: "/pricing" },
                { label: "Training Programs", href: "/programs" },
                { label: "Master Trainers", href: "/trainers" },
                { label: "Member Portal", href: "/login" },
                { label: "Athlete Dashboard", href: "/dashboard" },
                { label: "Contact & Trial Pass", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5"
                  >
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: All 3 Dhaka Branches Summary */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="font-display text-xl tracking-[0.1em] text-white uppercase">
              DHAKA CLUB LOCATIONS & PACKAGES
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/branches/lalbagh"
                className="p-4 rounded-sm bg-[#121212] border border-[#2A2A2A] hover:border-[#D4AF37] transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono-tech text-[10px] text-[#D4AF37] uppercase tracking-widest">
                    CLUB 01
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#B3B3B3] group-hover:text-[#D4AF37]" />
                </div>
                <div className="font-display text-xl text-white tracking-wider uppercase">
                  LALBAGH BRANCH
                </div>
                <p className="text-xs text-[#B3B3B3] mt-1">
                  42 Shaheed Nagar, Lalbagh Fort Rd, Dhaka 1211
                </p>
                <div className="mt-3 pt-2.5 border-t border-[#222222] font-mono-tech text-[11px] text-white space-y-0.5">
                  <div>3M: ৳1,700 • 6M: ৳3,200</div>
                  <div className="text-[#D4AF37]">12M: ৳5,700</div>
                </div>
              </Link>

              <Link
                href="/branches/dhanmondi"
                className="p-4 rounded-sm bg-[#121212] border border-[#D4AF37]/50 hover:border-[#D4AF37] transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono-tech text-[10px] text-[#D4AF37] uppercase tracking-widest">
                    FLAGSHIP 02
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#B3B3B3] group-hover:text-[#D4AF37]" />
                </div>
                <div className="font-display text-xl text-white tracking-wider uppercase">
                  DHANMONDI BRANCH
                </div>
                <p className="text-xs text-[#B3B3B3] mt-1">
                  House 24, Road 27 (Old), Dhanmondi, Dhaka 1209
                </p>
                <div className="mt-3 pt-2.5 border-t border-[#222222] font-mono-tech text-[11px] text-white space-y-0.5">
                  <div>3M: ৳3,450 • 6M: ৳6,300</div>
                  <div className="text-[#D4AF37]">12M: ৳9,800</div>
                </div>
              </Link>

              <Link
                href="/branches/mirpur"
                className="p-4 rounded-sm bg-[#121212] border border-[#2A2A2A] hover:border-[#D4AF37] transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono-tech text-[10px] text-[#D4AF37] uppercase tracking-widest">
                    CLUB 03
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#B3B3B3] group-hover:text-[#D4AF37]" />
                </div>
                <div className="font-display text-xl text-white tracking-wider uppercase">
                  MIRPUR BRANCH
                </div>
                <p className="text-xs text-[#B3B3B3] mt-1">
                  Plot 14, Block C, Mirpur-10 Circle, Dhaka 1216
                </p>
                <div className="mt-3 pt-2.5 border-t border-[#222222] font-mono-tech text-[11px] text-white space-y-0.5">
                  <div>3M: ৳3,500 • 6M: ৳6,000</div>
                  <div className="text-[#D4AF37]">12M: ৳10,000</div>
                </div>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-mono-tech text-[#B3B3B3]">
              <a
                href={RAYHAN_PHONE_TEL}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                Hotline: {RAYHAN_PHONE_DISPLAY}
              </a>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                Open Daily: 5:30 AM – 12:00 AM Midnight
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                Payment Gateways: bKash • Nagad • Visa / Mastercard
              </span>
            </div>
          </div>
        </div>

        {/* Centered brand seal above copyright */}
        <div className="pt-10 pb-2 flex flex-col items-center gap-4 text-center">
          <Link href="/" aria-label="Rayhan Fitness — Home">
            <BrandLogo height={72} large className="mx-auto" />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={RAYHAN_FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Rayhan Fitness on Facebook"
              className="fb-glow-link flex items-center gap-2 px-4 py-2 rounded-sm bg-[#151515] border border-[#2A2A2A] text-xs font-mono-tech text-[#B3B3B3]"
            >
              <FacebookIcon className="w-4 h-4" />
              <span>Follow us on Facebook</span>
            </a>
            <a
              href={RAYHAN_PHONE_TEL}
              className="flex items-center gap-2 px-4 py-2 rounded-sm bg-[#151515] border border-[#2A2A2A] hover:border-[#D4AF37] transition-colors text-xs font-mono-tech text-white"
            >
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{RAYHAN_PHONE_DISPLAY}</span>
            </a>
          </div>
        </div>

        {/* Bottom Copyright & Security Telemetry */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono-tech text-[#B3B3B3]">
          <div>
            © {new Date().getFullYear()} RAYHAN FITNESS DHAKA. ALL RIGHTS
            RESERVED. FORGED AT MIDNIGHT.
          </div>
          <div className="flex items-center gap-4">
            <a
              href={RAYHAN_FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="fb-glow-link flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-[#151515] border border-[#2A2A2A] text-[#B3B3B3]"
            >
              <FacebookIcon className="w-3.5 h-3.5" />
              <span>FACEBOOK</span>
            </a>
            <span className="flex items-center gap-1 text-emerald-400">
              <Lock className="w-3.5 h-3.5" /> TLS 1.3 + HSTS ENFORCED
            </span>
            <span>•</span>
            <Link href="/login" className="hover:text-white">
              RBAC PORTAL
            </Link>
            <span>•</span>
            <Link href="/pricing" className="hover:text-white">
              BDT (৳) PRICING
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
