"use client";

import React, { useState, useRef } from "react";
import { Check, Crown, ShieldCheck, ArrowUpRight } from "lucide-react";
import { CheckoutSelection } from "./CheckoutModal";

interface PackageCard3DProps {
  branchSlug: "lalbagh" | "dhanmondi" | "mirpur";
  branchName: string;
  durationMonths: 3 | 6 | 12;
  planName: string;
  subtitle: string;
  amountBdt: number;
  monthlyEquivalent: number;
  originalPriceBdt?: number;
  savingsText?: string;
  isPopular?: boolean;
  features: string[];
  onSelectCheckout: (selection: CheckoutSelection) => void;
}

export default function PackageCard3D({
  branchSlug,
  branchName,
  durationMonths,
  planName,
  subtitle,
  amountBdt,
  monthlyEquivalent,
  originalPriceBdt,
  savingsText,
  isPopular = false,
  features,
  onSelectCheckout,
}: PackageCard3DProps) {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const savePct =
    originalPriceBdt && originalPriceBdt > amountBdt
      ? Math.round(((originalPriceBdt - amountBdt) / originalPriceBdt) * 100)
      : 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Smooth mouse-follow parallax tilt (deliberate, cinematic — not bouncy)
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;
    setTilt({ rotateX, rotateY });
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
    setGlare({ x: 50, y: 50 });
    setHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1100px) rotateX(${tilt.rotateX}deg) rotateY(${
          tilt.rotateY
        }deg) ${hovered ? "translateY(-8px)" : "translateY(0px)"} ${
          isPopular ? "scale(1.02)" : "scale(1)"
        }`,
        transition: hovered
          ? "transform 0.1s ease-out"
          : "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        transformStyle: "preserve-3d",
      }}
      className={`relative rounded-sm p-7 sm:p-8 flex flex-col justify-between overflow-hidden ${
        isPopular
          ? "popular-package-card lg:scale-[1.035] z-10"
          : "gold-glass-card"
      }`}
    >
      {/* Mouse-follow gold sheen / glare */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(212,175,55,0.14) 0%, transparent 55%)`,
        }}
      />

      {/* Gold Ribbon Badge for Most Popular */}
      {isPopular && (
        <div className="absolute top-0 left-0 right-0 flex justify-center">
          <div className="gold-ribbon-badge px-5 py-1.5 rounded-b-sm flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-mono-tech text-[10px] font-extrabold uppercase tracking-[0.22em] whitespace-nowrap">
              Most Popular // Best Value
            </span>
          </div>
        </div>
      )}

      <div className="relative z-10 pt-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-mono-tech text-[11px] uppercase tracking-[0.2em] text-[#D4AF37]">
            {branchName}
          </span>
          {(savingsText || savePct > 0) && (
            <span className="px-2.5 py-1 rounded-sm bg-gradient-to-r from-[#D4AF37] to-[#8A6D1F] font-mono-tech text-[10px] font-extrabold text-[#0A0A0A] uppercase tracking-wider shadow-[0_0_14px_rgba(212,175,55,0.4)]">
              {savePct > 0 ? `Save ${savePct}%` : savingsText}
            </span>
          )}
        </div>

        <h3 className="font-display text-3xl sm:text-4xl text-white tracking-wider uppercase">
          {planName}
        </h3>
        <p className="text-xs text-[#B3B3B3] mt-1">{subtitle}</p>

        {/* Premium BDT Price Display — ৳ in distinct gold */}
        <div className="my-6 pb-6 border-b border-[#2A2A2A]">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className="font-display text-3xl sm:text-4xl text-[#D4AF37] gold-glow-text"
              style={{ transform: "translateZ(30px)" }}
            >
              ৳
            </span>
            <span className="font-mono-tech text-5xl sm:text-[52px] leading-none font-extrabold text-white tracking-tight">
              {amountBdt.toLocaleString()}
            </span>
            <span className="font-mono-tech text-xs text-[#B3B3B3] uppercase ml-1">
              / {durationMonths} MONTHS
            </span>
          </div>

          {originalPriceBdt && originalPriceBdt > amountBdt && (
            <div className="flex items-center gap-2.5 mt-2.5">
              <span className="font-mono-tech text-sm text-[#B3B3B3]/70 line-through">
                ৳{originalPriceBdt.toLocaleString()}
              </span>
              <span className="font-mono-tech text-xs text-emerald-400">
                You save ৳{(originalPriceBdt - amountBdt).toLocaleString()}
              </span>
            </div>
          )}

          <div className="font-mono-tech text-xs text-[#B3B3B3] mt-2">
            Equivalent to{" "}
            <span className="text-white font-semibold">
              ৳{monthlyEquivalent.toLocaleString()}/mo
            </span>{" "}
            • BDT Net Price
          </div>
        </div>

        {/* Animated gold checkmark features */}
        <ul className="space-y-3 mb-8">
          {features.map((feat, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 text-sm text-[#F5F5F5]/90"
            >
              <span
                className={`gold-check-animated w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-300 ${
                  hovered ? "scale-110" : "scale-100"
                } ${
                  isPopular
                    ? "bg-gradient-to-br from-[#D4AF37] to-[#8A6D1F] text-[#0A0A0A] shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                    : "bg-[#D4AF37]/12 border border-[#D4AF37]/60 text-[#D4AF37]"
                }`}
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <Check className="w-3 h-3 stroke-[3.5]" />
              </span>
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Buy Now CTA — matte black + gold border → gold gradient on hover */}
      <div className="relative z-10 space-y-3">
        <button
          type="button"
          onClick={() =>
            onSelectCheckout({
              branchSlug,
              branchName,
              durationMonths,
              planName,
              amountBdt,
            })
          }
          className={`w-full py-4 px-5 rounded-sm text-xs font-extrabold uppercase tracking-[0.18em] flex items-center justify-center gap-2 ${
            isPopular ? "btn-gold-primary" : "btn-gold-outline"
          }`}
        >
          <span>BUY NOW — ৳{amountBdt.toLocaleString()}</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono-tech text-[#B3B3B3]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>bKash • Nagad • Visa/Mastercard Instant Activation</span>
        </div>
      </div>
    </div>
  );
}
