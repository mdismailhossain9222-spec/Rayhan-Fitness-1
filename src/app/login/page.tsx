"use client";
import { apiFetch } from "@/lib/api-client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import FacebookLoginButton from "@/components/auth/FacebookLoginButton";
import EmailLoginForm from "@/components/auth/EmailLoginForm";
import SignupForm from "@/components/auth/SignupForm";
import { useAuthToast } from "@/components/auth/AuthToast";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  ShieldCheck,
  Mail,
  User,
  Phone,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

type AuthMode = "login" | "signup" | "2fa" | "forgot";

/**
 * Post-auth redirect: honors `?next=/path` only for safe same-origin
 * relative paths (prevents open redirects), preserving extra params
 * like ?bookTrainer= so flows like trainer booking resume correctly.
 */
function safeNextUrl(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/dashboard";
    if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
    const keep = new URLSearchParams();
    const bookTrainer = params.get("bookTrainer");
    if (next === "/trainers" && bookTrainer) {
      keep.set("bookTrainer", bookTrainer);
    }
    const qs = keep.toString();
    return qs ? `${next}?${qs}` : next;
  } catch {
    return "/dashboard";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("member@rayhanfitness.com");
  const [password, setPassword] = useState("Rayhan#2026");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("01712-556677");
  const [branchSlug, setBranchSlug] = useState("dhanmondi");
  const [rememberMe, setRememberMe] = useState(true);
  const [enforce2faPrompt, setEnforce2faPrompt] = useState(false);
  const [otpCode, setOtpCode] = useState("884200");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [showCloudEmail, setShowCloudEmail] = useState(false);
  const { notify, notifyAuthError } = useAuthToast();

  // Friendly toasts for OAuth callback results + protected-route redirects.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "cancelled") {
      notifyAuthError(new Error("cancelled"), "Sign-in cancelled");
    } else if (err === "oauth_failed") {
      notifyAuthError(new Error("oauth failed"), "Social sign-in failed");
    } else if (params.get("redirected") === "1") {
      notify("info", "Please sign in", "That page needs an authenticated member session.");
    }
    if (err || params.get("redirected")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Password strength rules calculation
  const pwdChecks = [
    { label: "8+ Characters", pass: password.length >= 8 },
    { label: "Uppercase (A-Z)", pass: /[A-Z]/.test(password) },
    { label: "Lowercase (a-z)", pass: /[a-z]/.test(password) },
    { label: "Digit (0-9)", pass: /[0-9]/.test(password) },
    { label: "Symbol (!@#$)", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const pwdScore = pwdChecks.filter((c) => c.pass).length;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "RayhanFitnessClient",
        },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
          enforce2faPrompt,
          otpCode: mode === "2fa" ? otpCode : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed");
      } else if (data.requires2FA) {
        setMode("2fa");
        setInfoMessage(data.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Network error while contacting authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "RayhanFitnessClient",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          branchSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        router.push(safeNextUrl());
        router.refresh();
      }
    } catch {
      setError("Network error while creating your athlete account.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoRole = async (
    roleEmail: string,
    with2faChallenge = false
  ) => {
    setEmail(roleEmail);
    setPassword("Rayhan#2026");
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: roleEmail,
          password: "Rayhan#2026",
          rememberMe: true,
          enforce2faPrompt: with2faChallenge,
        }),
      });
      const data = await res.json();
      if (data.requires2FA) {
        setMode("2fa");
        setInfoMessage(data.message);
      } else if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Quick login failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] min-h-screen py-16 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 spotlight-beam-red pointer-events-none" />

      <div className="max-w-[1320px] mx-auto px-4 sm:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: RBAC Quick-Switch & Security Architecture */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#151515] border border-[#D4AF37]/50 font-mono-tech text-xs text-[#D4AF37] uppercase tracking-[0.2em]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ZERO-TRUST ATHLETE & ADMIN GATEWAY</span>
            </span>
            <h1 className="font-display text-5xl sm:text-6xl text-white tracking-wider uppercase leading-none">
              RAYHAN{" "}
              <span className="text-[#D4AF37] crimson-glow-text">
                COMMAND PORTAL
              </span>
            </h1>
            <p className="text-sm text-[#B3B3B3] leading-relaxed">
              Sign in to access your personalized Member Dashboard, Trainer
              Roster, or Admin Command Center. Protected by short-lived JWT
              access tokens, rotating HttpOnly SameSite=Strict refresh cookies,
              and bcrypt hashing.
            </p>
          </div>

          {/* Instant RBAC Role Demo Selector */}
          <div className="iron-glass-card rounded-sm p-6 border border-[#D4AF37]/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono-tech text-xs uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>INSTANT RBAC ROLE SWITCHER (1-CLICK LOGIN)</span>
              </span>
            </div>
            <p className="text-xs text-[#B3B3B3]">
              Click any role below to immediately authenticate and inspect its
              personalized post-login interface:
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemoRole("member@rayhanfitness.com")}
                className="w-full p-3.5 rounded-sm bg-[#141414] hover:bg-[#1E190B] border border-[#2A2A2A] hover:border-[#D4AF37] transition-all flex items-center justify-between text-left group"
              >
                <div>
                  <div className="font-mono-tech text-xs font-bold text-white uppercase group-hover:text-[#E8C766]">
                    01. MEMBER DASHBOARD (FARHAN AHMED)
                  </div>
                  <div className="text-[11px] font-mono-tech text-[#B3B3B3]">
                    Active 6M Dhanmondi Plan • Progress Charts • Invoices
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoRole("trainer@rayhanfitness.com")}
                className="w-full p-3.5 rounded-sm bg-[#141414] hover:bg-[#1E190B] border border-[#2A2A2A] hover:border-[#D4AF37] transition-all flex items-center justify-between text-left group"
              >
                <div>
                  <div className="font-mono-tech text-xs font-bold text-white uppercase group-hover:text-[#E8C766]">
                    02. TRAINER / STAFF PORTAL (COACH TARIQ)
                  </div>
                  <div className="text-[11px] font-mono-tech text-[#B3B3B3]">
                    Assigned Classes • Branch Athletes • Form Assessments
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoRole("admin@rayhanfitness.com")}
                className="w-full p-3.5 rounded-sm bg-[#141414] hover:bg-[#1E190B] border border-[#2A2A2A] hover:border-[#D4AF37] transition-all flex items-center justify-between text-left group"
              >
                <div>
                  <div className="font-mono-tech text-xs font-bold text-white uppercase group-hover:text-[#E8C766]">
                    03. ADMIN COMMAND CENTER (RAYHAN CHOWDHURY)
                  </div>
                  <div className="text-[11px] font-mono-tech text-[#B3B3B3]">
                    Manage Branches & BDT Prices • Members • Security Audit Logs
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </div>
          </div>

          {/* Active Security Controls Checklist */}
          <div className="p-5 rounded-sm bg-[#111111] border border-[#2A2A2A] space-y-2.5 font-mono-tech text-xs">
            <div className="text-white font-bold uppercase tracking-wider">
              ACTIVE CRYPTOGRAPHIC SAFEGUARDS:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#B3B3B3]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                JWT Access + Refresh Cookies
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                HttpOnly & SameSite=Strict
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Bcrypt Salted Password Hash
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Brute-Force Rate Limiter
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                2FA Email/OTP Verification
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Drizzle Parameterized SQL
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Animated Auth Card */}
        <div className="lg:col-span-7">
          <div className="iron-glass-card rounded-sm p-7 sm:p-10 border border-[#2A2A2A]">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-sm bg-[#111111] border border-[#2A2A2A] mb-8">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`py-2.5 rounded-sm font-mono-tech text-xs font-bold uppercase tracking-wider transition-all ${
                  mode === "login" || mode === "2fa"
                    ? "bg-[#D4AF37] text-[#0A0A0A]"
                    : "text-[#B3B3B3] hover:text-white"
                }`}
              >
                SIGN IN
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className={`py-2.5 rounded-sm font-mono-tech text-xs font-bold uppercase tracking-wider transition-all ${
                  mode === "signup"
                    ? "bg-[#D4AF37] text-[#0A0A0A]"
                    : "text-[#B3B3B3] hover:text-white"
                }`}
              >
                CREATE ACCOUNT
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError("");
                }}
                className={`py-2.5 rounded-sm font-mono-tech text-xs font-bold uppercase tracking-wider transition-all ${
                  mode === "forgot"
                    ? "bg-[#D4AF37] text-[#0A0A0A]"
                    : "text-[#B3B3B3] hover:text-white"
                }`}
              >
                RESET PASSWORD
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-sm bg-red-950/60 border border-red-500 text-xs text-red-200 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="mb-6 p-4 rounded-sm bg-emerald-950/60 border border-emerald-500 text-xs text-emerald-200 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {mode === "login" && (
                <motion.form
                  key="login-form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  onSubmit={handleLogin}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                      Athlete / Staff Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#B3B3B3] absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#B3B3B3] absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-11 pl-10 pr-10 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-[#B3B3B3] hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#B3B3B3]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="accent-[#D4AF37]"
                      />
                      <span>Remember Me (30-Day Refresh Cookie)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-[#D4AF37]">
                      <input
                        type="checkbox"
                        checked={enforce2faPrompt}
                        onChange={(e) => setEnforce2faPrompt(e.target.checked)}
                        className="accent-[#D4AF37]"
                      />
                      <span>Test 2FA OTP Challenge Step</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-crimson-primary py-4 rounded-sm text-xs font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {loading
                        ? "VERIFYING CREDENTIALS..."
                        : "AUTHENTICATE & ENTER DASHBOARD"}
                    </span>
                  </button>

                  {/* Secure cloud auth (Supabase + Google/Facebook OAuth) */}
                  {isSupabaseConfigured ? (
                    <div className="pt-4 border-t border-[#2A2A2A] space-y-3">
                      <div className="text-center text-[10px] font-mono-tech uppercase tracking-widest text-[#B3B3B3]">
                        Or continue with secure cloud auth
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <GoogleLoginButton />
                        <FacebookLoginButton />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCloudEmail(!showCloudEmail)}
                        className="w-full text-center text-[11px] font-mono-tech uppercase tracking-widest text-[#D4AF37] hover:text-white py-1"
                      >
                        {showCloudEmail
                          ? "Hide cloud email sign-in"
                          : "Sign in with cloud email instead"}
                      </button>
                      {showCloudEmail && (
                        <div className="pt-1">
                          <EmailLoginForm />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-[#2A2A2A]">
                      <p className="text-center text-[11px] font-mono-tech text-[#B3B3B3]">
                        Cloud auth isn&apos;t connected in this preview — demo
                        access below works fully.
                      </p>
                    </div>
                  )}
                </motion.form>
              )}

              {mode === "2fa" && (
                <motion.form
                  key="2fa-form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  onSubmit={handleLogin}
                  className="space-y-5"
                >
                  <div className="p-4 rounded-sm bg-[#141414] border border-[#D4AF37]/50 space-y-1">
                    <div className="font-mono-tech text-xs text-[#D4AF37] uppercase font-bold">
                      TWO-FACTOR AUTHENTICATION (2FA OTP)
                    </div>
                    <p className="text-xs text-[#B3B3B3]">
                      Enter the 6-digit security code sent to{" "}
                      <span className="text-white">{email}</span>. (Demo OTP
                      pre-filled: <code className="text-emerald-400">884200</code>)
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                      6-Digit One-Time Passcode (OTP)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 rounded-sm bg-[#111111] border border-[#D4AF37] font-mono-tech text-lg tracking-[0.3em] text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-crimson-primary py-4 rounded-sm text-xs font-bold uppercase tracking-[0.18em]"
                  >
                    {loading ? "VERIFYING OTP..." : "VERIFY 2FA & COMPLETE LOGIN"}
                  </button>
                </motion.form>
              )}

              {isSupabaseConfigured && mode === "signup" && (
                <div className="mb-6 p-5 rounded-sm bg-[#141414] border border-[#D4AF37]/50 space-y-4">
                  <div className="font-mono-tech text-xs text-[#D4AF37] uppercase font-bold">
                    Secure cloud account (recommended)
                  </div>
                  <SignupForm />
                  <div className="text-center text-[10px] font-mono-tech uppercase tracking-widest text-[#B3B3B3] pt-3 border-t border-[#2A2A2A]">
                    Or use instant preview demo access below
                  </div>
                </div>
              )}
              {mode === "signup" && (
                <motion.form
                  key="signup-form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  onSubmit={handleSignup}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#B3B3B3] absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Zayan Rahman"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full h-11 pl-10 pr-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1">
                        Bangladesh Phone
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#B3B3B3] absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full h-11 pl-10 pr-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1">
                        Preferred Home Branch
                      </label>
                      <select
                        value={branchSlug}
                        onChange={(e) => setBranchSlug(e.target.value)}
                        className="w-full h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white"
                      >
                        <option value="lalbagh">
                          Lalbagh Branch (From ৳1,700)
                        </option>
                        <option value="dhanmondi">
                          Dhanmondi Branch (From ৳3,450)
                        </option>
                        <option value="mirpur">
                          Mirpur Branch (From ৳3,500)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1">
                      Create Strong Password (Bcrypt Salted)
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white"
                    />
                  </div>

                  {/* Password Strength Meter */}
                  <div className="p-3.5 rounded-sm bg-[#111111] border border-[#242424] space-y-2">
                    <div className="flex justify-between text-[10px] font-mono-tech uppercase">
                      <span className="text-[#B3B3B3]">
                        PASSWORD STRENGTH TELEMETRY
                      </span>
                      <span
                        className={
                          pwdScore === 5 ? "text-emerald-400" : "text-[#D4AF37]"
                        }
                      >
                        {pwdScore}/5 RULES MET
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((bar) => (
                        <div
                          key={bar}
                          className={`h-1.5 rounded-full ${
                            pwdScore >= bar
                              ? pwdScore === 5
                                ? "bg-emerald-500"
                                : "bg-[#D4AF37]"
                              : "bg-[#262626]"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {pwdChecks.map((c, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-mono-tech px-2 py-0.5 rounded-sm border ${
                            c.pass
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                              : "border-[#2A2A2A] text-[#B3B3B3]"
                          }`}
                        >
                          {c.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-crimson-primary py-4 rounded-sm text-xs font-bold uppercase tracking-[0.18em]"
                  >
                    {loading
                      ? "HASHING & CREATING PROFILE..."
                      : "COMPLETE ATHLETE REGISTRATION"}
                  </button>
                </motion.form>
              )}

              {mode === "forgot" && (
                <motion.form
                  key="forgot-form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setError("");
                    setInfoMessage("");
                    setLoading(true);
                    try {
                      const res = await apiFetch("/api/auth/forgot-password", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                      });
                      const data = await res.json();
                      setInfoMessage(
                        data.message ||
                          "If an account exists for this email, a secure reset link has been sent. It expires in 15 minutes."
                      );
                    } catch {
                      setError("Network error. Please try again.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5">
                      Registered Account Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full btn-crimson-primary py-4 rounded-sm text-xs font-bold uppercase tracking-[0.18em]"
                  >
                    SEND SECURE RESET LINK
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
