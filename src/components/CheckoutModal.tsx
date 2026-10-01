"use client";
import { apiFetch } from "@/lib/api-client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export interface CheckoutSelection {
  branchSlug: string;
  branchName: string;
  durationMonths: 3 | 6 | 12;
  planName: string;
  amountBdt: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelection: CheckoutSelection | null;
}

const BRANCH_PRICES: Record<
  string,
  { name: string; p3: number; p6: number; p12: number }
> = {
  lalbagh: { name: "Lalbagh Branch", p3: 1700, p6: 3200, p12: 5700 },
  dhanmondi: { name: "Dhanmondi Branch", p3: 3450, p6: 6300, p12: 9800 },
  mirpur: { name: "Mirpur Branch", p3: 3500, p6: 6000, p12: 10000 },
  gulshan: { name: "Gulshan Branch", p3: 4200, p6: 7800, p12: 12500 },
  uttara: { name: "Uttara Branch", p3: 3500, p6: 6000, p12: 10000 },
};

export default function CheckoutModal({
  isOpen,
  onClose,
  initialSelection,
}: CheckoutModalProps) {
  const [branchSlug, setBranchSlug] = useState<string>(
    initialSelection?.branchSlug || "dhanmondi"
  );
  const [durationMonths, setDurationMonths] = useState<3 | 6 | 12>(
    initialSelection?.durationMonths || 6
  );
  const [paymentMethod, setPaymentMethod] = useState<"bKash" | "Nagad" | "Card">(
    "bKash"
  );
  const [accountNumber, setAccountNumber] = useState("01712-556677");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{
    invoiceNumber: string;
    transactionId: string;
    branchName: string;
    planName: string;
    amountBdt: number;
    paymentMethod: string;
  } | null>(null);

  React.useEffect(() => {
    if (initialSelection) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBranchSlug(initialSelection.branchSlug);
      setDurationMonths(initialSelection.durationMonths);
      setReceipt(null);
      setError("");
    }
  }, [initialSelection]);

  // Escape closes + background scroll locks while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const branchInfo = BRANCH_PRICES[branchSlug];
  const currentPrice =
    durationMonths === 3
      ? branchInfo.p3
      : durationMonths === 6
      ? branchInfo.p6
      : branchInfo.p12;

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "RayhanFitnessClient",
        },
        body: JSON.stringify({
          branchSlug,
          durationMonths,
          paymentMethod,
          accountNumber,
          transactionId:
            transactionId.trim() ||
            `${paymentMethod.toUpperCase().slice(0, 3)}${Math.floor(
              100000 + Math.random() * 900000
            )}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Payment verification failed");
      } else {
        setReceipt({
          invoiceNumber: data.invoiceNumber,
          transactionId: data.payment.transactionId,
          branchName: data.branchName,
          planName: `${durationMonths} Months`,
          amountBdt: currentPrice,
          paymentMethod,
        });
      }
    } catch {
      setError("Network error while verifying gateway transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Membership checkout"
    >
      <div className="relative w-full max-w-xl iron-glass-card rounded-sm border border-[#D4AF37]/60 p-6 sm:p-8 shadow-[0_0_60px_rgba(212,175,55,0.28)] max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Checkout Modal"
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] p-2 rounded-sm bg-[#151515] border border-[#2A2A2A] text-[#B3B3B3] hover:text-white hover:border-[#D4AF37] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {receipt ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/50 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>

            <div>
              <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-emerald-400">
                TRANSACTION VERIFIED // POSTGRESQL LEDGER
              </span>
              <h3 className="font-display text-4xl text-white tracking-wider mt-1">
                MEMBERSHIP ACTIVATED
              </h3>
              <p className="text-sm text-[#B3B3B3] mt-1">
                Your biometric access pass and digital invoice have been synced
                to your Member Command Center.
              </p>
            </div>

            <div className="p-5 rounded-sm bg-[#0D0D0D] border border-[#2A2A2A] text-left font-mono-tech text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#B3B3B3]">INVOICE NO:</span>
                <span className="text-white font-bold">
                  {receipt.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B3B3B3]">CLUB BRANCH:</span>
                <span className="text-[#D4AF37] font-bold uppercase">
                  {receipt.branchName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B3B3B3]">PACKAGE DURATION:</span>
                <span className="text-white">{receipt.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#B3B3B3]">GATEWAY & TRX ID:</span>
                <span className="text-emerald-400">
                  {receipt.paymentMethod} • {receipt.transactionId}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#222222] text-sm">
                <span className="text-white font-bold">TOTAL PAID (BDT):</span>
                <span className="text-[#D4AF37] font-bold">
                  ৳{receipt.amountBdt.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex-1 btn-crimson-primary py-3.5 rounded-sm text-xs font-bold uppercase tracking-[0.16em] flex items-center justify-center gap-2"
              >
                <span>OPEN MEMBER DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="btn-matte-iron px-6 py-3.5 rounded-sm text-xs font-bold uppercase tracking-[0.16em]"
              >
                DONE
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmPayment} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono-tech text-[#D4AF37] uppercase tracking-[0.2em]">
                <Lock className="w-3.5 h-3.5" />
                <span>ENCRYPTED BDT CHECKOUT GATEWAY</span>
              </div>
              <h3 className="font-display text-3xl sm:text-4xl text-white tracking-wider mt-1">
                ACTIVATE CLUB MEMBERSHIP
              </h3>
            </div>

            {/* Step 1: Select Branch & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                  1. Select Club Branch
                </label>
                <select
                  value={branchSlug}
                  onChange={(e) =>
                    setBranchSlug(
                      e.target.value as "lalbagh" | "dhanmondi" | "mirpur"
                    )
                  }
                  className="w-full h-11 px-3 rounded-sm bg-[#121212] border border-[#2A2A2A] text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="lalbagh">Lalbagh Branch (Iron Forge)</option>
                  <option value="dhanmondi">
                    Dhanmondi Branch (Flagship Club)
                  </option>
                  <option value="mirpur">
                    Mirpur Branch (Performance Lab)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                  2. Package Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([3, 6, 12] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMonths(m)}
                      className={`h-11 rounded-sm font-mono-tech text-xs font-bold uppercase border transition-all ${
                        durationMonths === m
                          ? "bg-[#D4AF37] border-[#E8C766] text-[#0A0A0A] shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                          : "bg-[#121212] border-[#2A2A2A] text-[#B3B3B3] hover:border-white/30"
                      }`}
                    >
                      {m}M
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Summary Banner */}
            <div className="p-4 rounded-sm bg-gradient-to-r from-[#1A1508] via-[#121212] to-[#151515] border border-[#D4AF37]/40 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono-tech text-[#D4AF37] uppercase">
                  {branchInfo.name} • {durationMonths} Months Plan
                </div>
                <div className="text-xs text-[#B3B3B3] mt-0.5">
                  Includes Biometric Access, Smart Locker & Trainer Onboarding
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono-tech text-2xl sm:text-3xl font-bold text-white">
                  ৳{currentPrice.toLocaleString()}
                </span>
                <span className="block text-[10px] font-mono-tech text-[#B3B3B3]">
                  BDT NET TOTAL
                </span>
              </div>
            </div>

            {/* Step 2: Choose Payment Gateway */}
            <div>
              <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-2">
                3. Select Bangladesh Payment Gateway
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    id: "bKash" as const,
                    label: "bKash",
                    sub: "Instant Merchant Pay",
                    badgeColor: "text-pink-400 border-pink-500/40",
                  },
                  {
                    id: "Nagad" as const,
                    label: "Nagad",
                    sub: "Digital Wallet Pay",
                    badgeColor: "text-orange-400 border-orange-500/40",
                  },
                  {
                    id: "Card" as const,
                    label: "Card",
                    sub: "Visa / Mastercard",
                    badgeColor: "text-sky-400 border-sky-500/40",
                  },
                ].map((gw) => (
                  <button
                    key={gw.id}
                    type="button"
                    onClick={() => setPaymentMethod(gw.id)}
                    className={`p-3 rounded-sm border text-left transition-all ${
                      paymentMethod === gw.id
                        ? "bg-[#1C1A10] border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                        : "bg-[#111111] border-[#2A2A2A] hover:border-[#3D3D3D]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">
                        {gw.label}
                      </span>
                      {gw.id === "Card" ? (
                        <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                      ) : (
                        <Smartphone className="w-4 h-4 text-[#D4AF37]" />
                      )}
                    </div>
                    <div className="text-[10px] font-mono-tech text-[#B3B3B3] mt-1">
                      {gw.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Gateway Account Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                  {paymentMethod === "Card"
                    ? "Card Number"
                    : `${paymentMethod} Wallet Number`}
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={
                    paymentMethod === "Card"
                      ? "4321 •••• •••• 8819"
                      : "017XX-XXXXXX"
                  }
                  className="w-full h-11 px-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A] font-mono-tech text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-1.5">
                  TrxID / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Auto-generated if blank"
                  className="w-full h-11 px-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A] font-mono-tech text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-sm bg-red-950/50 border border-red-500 text-xs text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-crimson-primary py-4 rounded-sm text-xs font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {loading
                  ? "VERIFYING GATEWAY LEDGER..."
                  : `AUTHORIZE ৳${currentPrice.toLocaleString()} VIA ${paymentMethod.toUpperCase()}`}
              </span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] font-mono-tech text-[#B3B3B3]">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>
                256-Bit TLS Encrypted • Instant Invoice in Member Dashboard
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
