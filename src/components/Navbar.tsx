"use client";
import { apiFetch } from "@/lib/api-client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Menu,
  X,
  User,
  ChevronDown,
  MapPin,
  Flame,
  Lock,
  Phone,
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import { useUser } from "@/hooks/useUser";

export const RAYHAN_PHONE_DISPLAY = "01736-574900";
export const RAYHAN_PHONE_TEL = "tel:+8801736574900";
export const RAYHAN_FACEBOOK_URL =
  "https://www.facebook.com/rayhanfitnessgym";

export function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5z" />
    </svg>
  );
}

interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: "member" | "trainer" | "admin";
  branchSlug: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  // Supabase identity (real-time) takes precedence; legacy demo session is the fallback.
  const { user: sbUser, profile: sbProfile } = useUser();
  const displayName = sbUser
    ? sbProfile?.full_name?.split(" ")[0] ||
      sbUser.email?.split("@")[0] ||
      "Member"
    : (user?.name.split(" ")[0] ?? null);
  const displayRole = sbUser ? (sbProfile?.role ?? "member") : (user?.role ?? null);
  const isAuthed = Boolean(sbUser || user);

  // Dedicated admin console has its own shell — never render public nav there.
  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isAdminRoute]);

  // Always close the mobile menu on route change (no stuck-open states).
  useEffect(() => {
    if (isAdminRoute) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname, isAdminRoute]);

  // Mobile menu open state: Escape closes, background page scroll locks.
  useEffect(() => {
    if (isAdminRoute || !mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen, isAdminRoute]);

  // Fetch user session on route change for legacy demo session fallback.
  // Supabase real-time auth (useUser) is the primary source; this is a backup.
  useEffect(() => {
    if (isAdminRoute) return;
    let cancelled = false;
    apiFetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          if (data?.user) setUser(data.user);
          else setUser(null);
        }
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [pathname, isAdminRoute]);

  if (isAdminRoute) return null;

  const navItems = [
    { label: "HOME", href: "/" },
    { label: "BRANCHES", href: "/branches", hasDropdown: true },
    { label: "PACKAGES", href: "/pricing" },
    { label: "PROGRAMS", href: "/programs" },
    { label: "TRAINERS", href: "/trainers" },
    { label: "ABOUT", href: "/about" },
    { label: "CONTACT", href: "/contact" },
  ];

  const branchLinks = [
    {
      slug: "lalbagh",
      name: "Lalbagh Branch",
      tag: "The Iron Forge • From ৳1,700",
    },
    {
      slug: "dhanmondi",
      name: "Dhanmondi Branch",
      tag: "Flagship Club • From ৳3,450",
    },
    {
      slug: "mirpur",
      name: "Mirpur Branch",
      tag: "Performance Lab • From ৳3,500",
    },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 isolate ${
        scrolled || mobileOpen
          ? "bg-[#0A0A0A] border-b border-[#2A2A2A] shadow-[0_10px_30px_rgba(0,0,0,0.9)]"
          : "bg-gradient-to-b from-[#0A0A0A]/95 via-[#0A0A0A]/80 to-transparent border-b border-white/5"
      }`}
    >
      {/* Top bar — own stacking layer above the mobile panel so the logo
          crest and its glow can never paint over menu items below. */}
      <div className="relative z-30 max-w-[1440px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo — fixed-size container, clean & standalone, shrinks smoothly on scroll */}
        <motion.div
          animate={{ scale: scrolled ? 0.86 : 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "left center", willChange: "transform" }}
          className="shrink-0 relative z-30"
        >
          <Link
            href="/"
            className="flex items-center h-20 w-[132px] sm:w-[150px] overflow-hidden group focus:outline-none"
            aria-label="Rayhan Fitness — Home"
          >
            <BrandLogo height={58} priority />
          </Link>
        </motion.div>

        {/* Desktop Nav — centered to balance the clean standalone logo */}
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-7">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            if (item.hasDropdown) {
              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setBranchMenuOpen(true)}
                  onMouseLeave={() => setBranchMenuOpen(false)}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1 text-xs font-semibold tracking-[0.16em] uppercase py-2 transition-colors ${
                      isActive
                        ? "text-[#D4AF37]"
                        : "text-[#F5F5F5]/85 hover:text-white"
                    }`}
                  >
                    {item.label}
                    <ChevronDown className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </Link>

                  {branchMenuOpen && (
                    <div className="absolute top-full left-0 w-72 pt-2 z-50">
                      <div className="iron-glass-card rounded-sm p-2 border border-[#2A2A2A] shadow-2xl">
                        <div className="px-3 py-1.5 text-[10px] font-mono-tech uppercase tracking-[0.2em] text-[#B3B3B3] border-b border-[#2A2A2A]">
                          Select Dhaka Club
                        </div>
                        {branchLinks.map((b) => (
                          <Link
                            key={b.slug}
                            href={`/branches/${b.slug}`}
                            className="flex items-start gap-2.5 px-3 py-2.5 rounded-sm hover:bg-[#D4AF37]/15 transition-colors group"
                          >
                            <MapPin className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" />
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-[#E8C766] tracking-wider uppercase">
                                {b.name}
                              </div>
                              <div className="text-[11px] font-mono-tech text-[#B3B3B3]">
                                {b.tag}
                              </div>
                            </div>
                          </Link>
                        ))}
                        <Link
                          href="/branches"
                          className="block text-center text-[11px] font-mono-tech uppercase tracking-widest text-[#D4AF37] hover:text-white py-2 border-t border-[#2A2A2A] mt-1"
                        >
                          Compare All 3 Branches →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative text-xs font-semibold tracking-[0.16em] uppercase py-2 transition-colors ${
                  isActive
                    ? "text-[#D4AF37]"
                    : "text-[#F5F5F5]/85 hover:text-white"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <a
            href={RAYHAN_FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow Rayhan Fitness on Facebook"
            title="Follow us on Facebook"
            className="fb-glow-link w-10 h-10 rounded-sm bg-[#151515] border border-[#2A2A2A] flex items-center justify-center text-[#B3B3B3]"
          >
            <FacebookIcon className="w-[18px] h-[18px]" />
          </a>

          <a
            href={RAYHAN_PHONE_TEL}
            title="Call Rayhan Fitness"
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-2 rounded-sm bg-[#151515] border border-[#2A2A2A] hover:border-[#D4AF37] transition-colors text-[11px] font-mono-tech text-white"
          >
            <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{RAYHAN_PHONE_DISPLAY}</span>
          </a>

          <div
            title="Protected by JWT HttpOnly SameSite=Strict Cookies, Bcrypt Salt, CSRF & Helmet HSTS"
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#151515] border border-[#2A2A2A] text-[10px] font-mono-tech text-[#B3B3B3]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>WAF + JWT SECURE</span>
          </div>

          {isAuthed ? (
            <Link
              href="/dashboard"
              className="btn-matte-iron px-4 py-2.5 rounded-sm text-xs font-bold tracking-[0.14em] uppercase flex items-center gap-2"
            >
              <User className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{displayName}</span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono-tech bg-[#D4AF37]/20 text-[#E8C766] border border-[#D4AF37]/40 rounded-sm uppercase">
                {displayRole}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="btn-matte-iron px-4 py-2.5 rounded-sm text-xs font-bold tracking-[0.14em] uppercase flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>MEMBER PORTAL</span>
            </Link>
          )}

          <Link
            href="/pricing"
            className="btn-crimson-primary px-5 py-2.5 rounded-sm text-xs font-bold tracking-[0.16em] uppercase flex items-center gap-1.5"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>JOIN NOW</span>
          </Link>
        </div>

        {/* Mobile Hamburger Button — 44px touch target, announces state */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close Menu" : "Open Menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          className="lg:hidden min-w-[44px] min-h-[44px] p-2.5 rounded-sm bg-[#151515] border border-[#2A2A2A] text-white hover:border-[#D4AF37] flex items-center justify-center shrink-0"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu — own layer below the top bar: gold divider, then nav
          list with clear separation from the logo header. Internally
          scrollable (100dvh-safe) with butter-smooth expand/collapse. */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            id="mobile-menu"
            role="dialog"
            aria-label="Mobile navigation menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden relative z-20 overflow-hidden border-t border-[#D4AF37]/40 border-b border-b-[#2A2A2A] bg-[#0A0A0A]"
          >
            <div className="px-5 sm:px-6 pt-5 pb-8 space-y-4 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain">
              <div className="grid grid-cols-1 gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 min-h-[48px] flex items-center rounded-sm font-display text-xl tracking-[0.1em] uppercase border ${
                      pathname === item.href
                        ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white"
                        : "bg-[#121212] border-[#2A2A2A] text-[#B3B3B3]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="pt-3 border-t border-[#2A2A2A]">
                <div className="text-[11px] font-mono-tech uppercase tracking-widest text-[#B3B3B3] mb-2">
                  Direct Branch Portals:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {branchLinks.map((b) => (
                    <Link
                      key={b.slug}
                      href={`/branches/${b.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="px-2 py-3 min-h-[44px] rounded-sm bg-[#151515] border border-[#2A2A2A] text-center text-xs font-bold uppercase text-white hover:border-[#D4AF37] flex items-center justify-center"
                    >
                      {b.slug}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href={isAuthed ? "/dashboard" : "/login"}
                  onClick={() => setMobileOpen(false)}
                  className="btn-matte-iron py-3 min-h-[44px] rounded-sm text-center text-xs font-bold tracking-widest uppercase flex items-center justify-center"
                >
                  {isAuthed ? "DASHBOARD" : "LOGIN / SIGNUP"}
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setMobileOpen(false)}
                  className="btn-crimson-primary py-3 min-h-[44px] rounded-sm text-center text-xs font-bold tracking-widest uppercase flex items-center justify-center"
                >
                  SEE PACKAGES
                </Link>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-[#2A2A2A]">
                <a
                  href={RAYHAN_FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="fb-glow-link flex-1 py-3 min-h-[44px] rounded-sm bg-[#151515] border border-[#2A2A2A] flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-white"
                >
                  <FacebookIcon className="w-[18px] h-[18px] text-[#B3B3B3]" />
                  <span>Facebook</span>
                </a>
                <a
                  href={RAYHAN_PHONE_TEL}
                  className="flex-1 py-3 min-h-[44px] rounded-sm bg-[#151515] border border-[#2A2A2A] flex items-center justify-center gap-2 text-xs font-mono-tech text-white"
                >
                  <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>{RAYHAN_PHONE_DISPLAY}</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
