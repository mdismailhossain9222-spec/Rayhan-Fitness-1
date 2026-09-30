"use client";

/**
 * AdminShell — dedicated admin chrome (NOT the public navbar).
 * Fixed collapsible left sidebar + top bar (global search, live bell,
 * profile dropdown) + content area. Dark & Gold functional style.
 */

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  Dumbbell,
  Building2,
  Tags,
  CreditCard,
  Settings,
  Menu,
  X,
  Search,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import AdminBell from "./AdminBell";
import BrandLogo from "../BrandLogo";
import { useUser } from "@/hooks/useUser";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarClock },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/trainers", label: "Trainers", icon: Dumbbell },
  { href: "/admin/branches", label: "Branches", icon: Building2 },
  { href: "/admin/packages", label: "Packages", icon: Tags },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intentional: close mobile nav and profile dropdown on route change
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileNav(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [profileOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    // Global search routes to members (people) — bookings has its own filters.
    router.push(q ? `/admin/members?q=${encodeURIComponent(q)}` : "/admin/members");
  };

  const handleLogout = async () => {
    await signOut();
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "RayhanFitnessClient",
        },
        body: JSON.stringify({}),
      });
    } catch {
      // Supabase sign-out already done.
    }
    router.push("/?toast=signed-out");
  };

  const sidebarBody = (onNavigate?: () => void) => (
    <div className="flex flex-col h-full">
      <Link
        href="/admin"
        onClick={onNavigate}
        className="flex items-center justify-center px-4 h-20 border-b border-[#2A2A2A] shrink-0"
        aria-label="Admin dashboard home"
      >
        {collapsed && !onNavigate ? (
          <span className="w-10 h-10 rounded-sm bg-gradient-to-br from-[#E8C766] via-[#D4AF37] to-[#8A6D1F] flex items-center justify-center font-display text-xl text-[#0A0A0A]">
            R
          </span>
        ) : (
          <BrandLogo height={44} />
        )}
      </Link>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Admin navigation">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed && !onNavigate ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-3 min-h-[48px] rounded-sm text-xs font-bold uppercase tracking-widest border transition-all ${
                active
                  ? "bg-[#D4AF37]/15 border-[#D4AF37]/60 text-white shadow-[0_0_16px_rgba(212,175,55,0.2)]"
                  : "bg-transparent border-transparent text-[#B3B3B3] hover:text-white hover:bg-[#151515]"
              } ${collapsed && !onNavigate ? "justify-center" : ""}`}
            >
              <item.icon
                className={`w-5 h-5 shrink-0 ${active ? "text-[#D4AF37]" : ""}`}
              />
              {(!collapsed || onNavigate) && <span>{item.label}</span>}
              {active && (!collapsed || onNavigate) && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.9)]" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[#2A2A2A] shrink-0">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 px-3 py-2.5 text-[11px] font-mono-tech uppercase tracking-widest text-[#B3B3B3] hover:text-[#D4AF37] transition-colors"
        >
          <span aria-hidden="true">←</span>
          {(!collapsed || onNavigate) && <span>View public site</span>}
        </Link>
      </div>
    </div>
  );

  return (
    // -mt-20 cancels the root layout's public-navbar offset (no navbar on /admin).
    <div className="min-h-screen -mt-20 bg-[#0A0A0A] text-[#F5F5F5] lg:pl-0 flex">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 sticky top-0 h-screen bg-[#0C0C0C] border-r border-[#2A2A2A] transition-all duration-300 ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        {sidebarBody()}
      </aside>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.div
              key="admin-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileNav(false)}
            />
            <motion.aside
              key="admin-nav-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 top-0 bottom-0 z-[61] w-72 bg-[#0C0C0C] border-r border-[#D4AF37]/40 lg:hidden"
            >
              {sidebarBody(() => setMobileNav(false))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-20 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#2A2A2A] px-4 sm:px-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              window.innerWidth >= 1024
                ? setCollapsed(!collapsed)
                : setMobileNav(!mobileNav)
            }
            aria-label="Toggle admin navigation"
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-sm bg-[#151515] border border-[#2A2A2A] hover:border-[#D4AF37] flex items-center justify-center text-white shrink-0"
          >
            {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <form
            onSubmit={handleSearch}
            className="hidden sm:flex flex-1 max-w-md items-center gap-2"
            role="search"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#B3B3B3] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search members…"
                aria-label="Search members"
                className="w-full h-11 pl-10 pr-4 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white placeholder:text-[#B3B3B3]/60 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </form>

          <div className="flex-1 sm:hidden" />
          <AdminBell />

          {/* Profile dropdown */}
          <div ref={profileRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-expanded={profileOpen}
              aria-label="Admin profile menu"
              className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 min-h-[44px] rounded-sm bg-[#151515] border border-[#2A2A2A] hover:border-[#D4AF37] transition-colors"
            >
              <span className="w-8 h-8 rounded-sm bg-gradient-to-br from-[#E8C766] via-[#D4AF37] to-[#8A6D1F] flex items-center justify-center font-display text-base text-[#0A0A0A]">
                {(profile?.full_name?.[0] ?? "A").toUpperCase()}
              </span>
              <span className="hidden md:block text-left">
                <span className="block text-xs font-bold text-white leading-tight max-w-[140px] truncate">
                  {profile?.full_name ?? "Administrator"}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono-tech text-[#D4AF37] uppercase">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#B3B3B3] transition-transform ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  key="admin-profile-menu"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-[calc(100%+10px)] w-52 rounded-sm bg-[#0F0F0F] border border-[#2A2A2A] shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden z-50"
                >
                  <Link
                    href="/admin/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 min-h-[48px] text-xs font-bold uppercase tracking-widest text-[#B3B3B3] hover:text-white hover:bg-[#151515]"
                  >
                    <Settings className="w-4 h-4 text-[#D4AF37]" /> Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="w-full flex items-center gap-2.5 px-4 py-3 min-h-[48px] text-xs font-bold uppercase tracking-widest text-[#B3B3B3] hover:text-red-400 hover:bg-[#151515] border-t border-[#2A2A2A]"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
