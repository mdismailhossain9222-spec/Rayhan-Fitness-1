"use client";
import { apiFetch } from "@/lib/api-client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  BellRing,
} from "lucide-react";
import {
  RAYHAN_PHONE_DISPLAY,
  RAYHAN_PHONE_TEL,
  RAYHAN_FACEBOOK_URL,
  FacebookIcon,
} from "@/components/Navbar";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [branchSlug, setBranchSlug] = useState("dhanmondi");
  const [goal, setGoal] = useState("VIP Club Tour & 6-Month Package Inquiry");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await apiFetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "RayhanFitnessClient",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          branchSlug,
          goal,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to submit inquiry");
      } else {
        setSuccessMsg(data.message);
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
      }
    } catch {
      setErrorMsg("Network error while dispatching inquiry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] min-h-screen">
      {/* Hero */}
      <section className="relative py-20 lg:py-28 border-b border-[#2A2A2A] overflow-hidden">
        <div className="absolute inset-0 spotlight-beam-red pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#151515] border border-[#D4AF37]/50 font-mono-tech text-xs text-[#D4AF37] uppercase tracking-[0.2em]">
              <Phone className="w-3.5 h-3.5" />
              <span>DIRECT LINE & VIP CLUB CONCIERGE</span>
            </span>
            <h1 className="font-display text-6xl sm:text-7xl text-white tracking-wider uppercase leading-none">
              CONNECT WITH{" "}
              <span className="text-[#D4AF37] crimson-glow-text">
                RAYHAN FITNESS
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#B3B3B3] leading-relaxed">
              Schedule a private tour of our Lalbagh, Dhanmondi, or Mirpur
              clubs, request corporate membership rates, or speak directly with
              a certified strength director.
            </p>
          </div>
        </div>
      </section>

      {/* Form & Branch Cards Split */}
      <section className="py-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Animated Sanitized Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 iron-glass-card rounded-sm p-7 sm:p-10 border border-[#2A2A2A]"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <span className="font-mono-tech text-xs text-[#D4AF37] uppercase tracking-widest">
                  SECURE & PROTECTED CONTACT FORM
                </span>
                <h2 className="font-display text-4xl text-white uppercase tracking-wider mt-1">
                  REQUEST AN CLUB TOUR OR TRIAL PASS
                </h2>
              </div>

              {successMsg && (
                <div className="p-4 rounded-sm bg-emerald-950/60 border border-emerald-500 text-xs text-emerald-200 flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 rounded-sm bg-red-950/60 border border-red-500 text-xs text-red-200 flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tariq Hasan"
                    className="w-full h-11 px-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5">
                    Bangladesh Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 01711-889900"
                    className="w-full h-11 px-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 px-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5">
                    Target Dhaka Branch
                  </label>
                  <select
                    value={branchSlug}
                    onChange={(e) => setBranchSlug(e.target.value)}
                    className="w-full h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                  >
                    <option value="lalbagh">
                      Lalbagh Branch (3M: ৳1,700 | 6M: ৳3,200 | 12M: ৳5,700)
                    </option>
                    <option value="dhanmondi">
                      Dhanmondi Branch (3M: ৳3,450 | 6M: ৳6,300 | 12M: ৳9,800)
                    </option>
                    <option value="mirpur">
                      Mirpur Branch (3M: ৳3,500 | 6M: ৳6,000 | 12M: ৳10,000)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5">
                  Primary Objective / Subject
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5">
                  Your Message or Preferred Visit Time *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your fitness goals or when you'd like to inspect the gym floor..."
                  className="w-full p-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-crimson-primary py-4 rounded-sm text-xs font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>
                  {loading
                    ? "SENDING SECURELY..."
                    : "SEND MESSAGE TO OUR TEAM"}
                </span>
              </button>

              <div className="flex items-center gap-2 text-[11px] font-mono-tech text-[#B3B3B3]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  Protected by CSRF Token, Input Sanitization & PostgreSQL
                  Parameterized Persistence.
                </span>
              </div>
            </form>
          </motion.div>

          {/* Right: Direct Branch Hotlines & Map */}
          <div className="lg:col-span-5 space-y-6">
            {[
              {
                name: "01. LALBAGH BRANCH (THE IRON FORGE)",
                address: "42 Shaheed Nagar, Lalbagh Fort Road, Old Dhaka 1211",
                phone: "01736-574900",
                email: "lalbagh@rayhanfitness.com",
                prices: "3M: ৳1,700 • 6M: ৳3,200 • 12M: ৳5,700",
              },
              {
                name: "02. DHANMONDI BRANCH (THE FLAGSHIP CLUB)",
                address:
                  "Level 5 & 6, House 24, Road 27 (Old), Dhanmondi, Dhaka 1209",
                phone: "01736-574900",
                email: "dhanmondi@rayhanfitness.com",
                prices: "3M: ৳3,450 • 6M: ৳6,300 • 12M: ৳9,800",
              },
              {
                name: "03. MIRPUR BRANCH (THE PERFORMANCE LAB)",
                address:
                  "Plot 14, Block C, Rokeya Sarani, Mirpur-10 Circle, Dhaka 1216",
                phone: "01736-574900",
                email: "mirpur@rayhanfitness.com",
                prices: "3M: ৳3,500 • 6M: ৳6,000 • 12M: ৳10,000",
              },
            ].map((b, i) => (
              <div
                key={i}
                className="iron-glass-card rounded-sm p-6 space-y-2.5 border border-[#2A2A2A]"
              >
                <div className="font-display text-2xl text-white tracking-wider">
                  {b.name}
                </div>
                <div className="flex items-start gap-2 text-xs text-[#B3B3B3]">
                  <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>{b.address}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono-tech text-white pt-1">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {b.phone}
                  </span>
                  <span className="flex items-center gap-1.5 text-[#B3B3B3]">
                    <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {b.email}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#222222] font-mono-tech text-xs text-[#D4AF37] font-bold">
                  {b.prices}
                </div>
              </div>
            ))}

            <div className="p-5 rounded-sm bg-[#111111] border border-[#2A2A2A] flex items-center gap-3 text-xs font-mono-tech text-[#B3B3B3]">
              <Clock className="w-5 h-5 text-[#D4AF37] shrink-0" />
              <span>
                All 3 Dhaka branches are open 7 days a week from 5:30 AM to
                12:00 AM Midnight (including Friday afternoon sessions).
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Follow us on Facebook CTA */}
      <section className="relative py-16 lg:py-20 border-t border-[#2A2A2A] overflow-hidden bg-[#0D0D0D]">
        <div className="absolute inset-0 spotlight-beam-gold-wide pointer-events-none opacity-60" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="gold-glass-card rounded-sm p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            <div className="lg:col-span-8 space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#D4AF37]/10 border border-[#D4AF37]/40 font-mono-tech text-xs text-[#D4AF37] uppercase tracking-[0.2em]">
                <BellRing className="w-3.5 h-3.5" />
                <span>Daily Transformations • Class Drops • Member Offers</span>
              </span>
              <h2 className="font-display text-4xl sm:text-5xl text-white tracking-wider uppercase">
                FOLLOW US ON{" "}
                <span className="text-[#D4AF37] gold-glow-text">FACEBOOK</span>
              </h2>
              <p className="text-sm sm:text-base text-[#B3B3B3] leading-relaxed max-w-2xl">
                Join the Rayhan Fitness community for live workout drops,
                branch events across Lalbagh, Dhanmondi & Mirpur, nutrition
                guides, and exclusive member-only promotions. Prefer to talk?
                Call our concierge at{" "}
                <a
                  href={RAYHAN_PHONE_TEL}
                  className="font-mono-tech font-bold text-white hover:text-[#D4AF37] transition-colors"
                >
                  {RAYHAN_PHONE_DISPLAY}
                </a>
                .
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
              <a
                href={RAYHAN_FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="fb-glow-link flex-1 lg:w-full px-6 py-4 rounded-sm bg-[#1877F2]/15 border border-[#1877F2]/50 flex items-center justify-center gap-2.5 text-sm font-bold uppercase tracking-widest text-white"
              >
                <FacebookIcon className="w-5 h-5" />
                <span>Follow on Facebook</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <a
                href={RAYHAN_PHONE_TEL}
                className="btn-gold-outline flex-1 lg:w-full px-6 py-4 rounded-sm text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>{RAYHAN_PHONE_DISPLAY}</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
