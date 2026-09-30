"use client";
import { apiFetch } from "@/lib/api-client";

import React, { useState } from "react";
import Link from "next/link";
import { Activity, Flame, Dumbbell, Calculator, ArrowRight } from "lucide-react";

interface CalcResult {
  bmi: number;
  bmiCategory: string;
  bmr: number;
  tdee: number;
  targetCalories: number;
  bodyFatEstimate: number;
  macros: {
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
  };
  recommendedProgram: string;
  recommendedPlan: string;
}

export default function BiometricCalculator() {
  const [age, setAge] = useState(26);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(76);
  const [activityMultiplier, setActivityMultiplier] = useState(1.55);
  const [goal, setGoal] = useState<"cut" | "recomp" | "bulk">("recomp");
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<CalcResult>({
    bmi: 24.8,
    bmiCategory: "ATHLETIC / OPTIMAL",
    bmr: 1749,
    tdee: 2711,
    targetCalories: 2711,
    bodyFatEstimate: 16.9,
    macros: {
      proteinGrams: 167,
      carbGrams: 341,
      fatGrams: 75,
    },
    recommendedProgram: "MIDNIGHT HYPERTROPHY PROTOCOL",
    recommendedPlan: "6 Months — Most Popular",
  });

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age,
          gender,
          heightCm,
          weightKg,
          activityMultiplier,
          goal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.bmi) {
        setResult(data);
      }
    } catch {
      // keep previous calculation
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      {/* Left: Biometric Telemetry Form */}
      <form
        onSubmit={handleCalculate}
        className="lg:col-span-6 iron-glass-card rounded-sm p-6 sm:p-8 space-y-6"
      >
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
          <div>
            <span className="font-mono-tech text-[11px] uppercase tracking-[0.2em] text-[#D4AF37]">
              SPORTS SCIENCE MICROSERVICE // TELEMETRY
            </span>
            <h3 className="font-display text-3xl text-white tracking-wider mt-0.5">
              BIOMETRIC BMI & MACRO ENGINE
            </h3>
          </div>
          <Calculator className="w-7 h-7 text-[#D4AF37]" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-1.5">
              Biological Sex
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`h-11 rounded-sm font-mono-tech text-xs font-bold uppercase border transition-all ${
                    gender === g
                      ? "bg-[#D4AF37] border-[#E8C766] text-[#0A0A0A]"
                      : "bg-[#111111] border-[#2A2A2A] text-[#B3B3B3]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-1.5">
              Age (Years)
            </label>
            <input
              type="number"
              min={14}
              max={85}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A] font-mono-tech text-sm text-white focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-1.5">
              Height (CM): <span className="text-white">{heightCm} cm</span>
            </label>
            <input
              type="range"
              min={140}
              max={210}
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className="w-full accent-[#D4AF37] cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-1.5">
              Weight (KG): <span className="text-white">{weightKg} kg</span>
            </label>
            <input
              type="range"
              min={40}
              max={150}
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="w-full accent-[#D4AF37] cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-1.5">
              Training Frequency
            </label>
            <select
              value={activityMultiplier}
              onChange={(e) => setActivityMultiplier(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-xs font-mono-tech text-white focus:border-[#D4AF37] focus:outline-none"
            >
              <option value={1.2}>Sedentary (0–1 workouts/wk)</option>
              <option value={1.375}>Light Iron (2–3 workouts/wk)</option>
              <option value={1.55}>Moderate Athlete (4–5 workouts/wk)</option>
              <option value={1.725}>High Output (6 workouts/wk)</option>
              <option value={1.9}>2x Daily Fight Camp / Elite</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono-tech uppercase tracking-wider text-[#B3B3B3] mb-1.5">
              Physique Objective
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "cut" as const, label: "SHRED" },
                { id: "recomp" as const, label: "RECOMP" },
                { id: "bulk" as const, label: "MASS" },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={`h-11 rounded-sm font-mono-tech text-[11px] font-bold uppercase border transition-all ${
                    goal === g.id
                      ? "bg-[#D4AF37] border-[#E8C766] text-[#0A0A0A]"
                      : "bg-[#111111] border-[#2A2A2A] text-[#B3B3B3]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-crimson-primary py-3.5 rounded-sm text-xs font-bold uppercase tracking-[0.18em]"
        >
          {loading ? "COMPUTING BIOMETRICS..." : "COMPUTE BIOMETRIC BLUEPRINT"}
        </button>
      </form>

      {/* Right: Live Telemetry Readout */}
      <div className="lg:col-span-6 iron-glass-card rounded-sm p-6 sm:p-8 flex flex-col justify-between border border-[#D4AF37]/40">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A2A2A] pb-4">
            <div>
              <span className="font-mono-tech text-[11px] uppercase tracking-[0.2em] text-emerald-400">
                DIAGNOSTIC OUTPUT READY
              </span>
              <h4 className="font-display text-3xl text-white tracking-wider mt-0.5">
                ATHLETE METABOLIC PROFILE
              </h4>
            </div>
            <span className="px-3 py-1 rounded-sm bg-[#D4AF37]/20 border border-[#D4AF37] font-mono-tech text-xs font-bold text-white">
              {result.bmiCategory}
            </span>
          </div>

          {/* 4 Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A]">
              <div className="text-[10px] font-mono-tech text-[#B3B3B3] uppercase">
                BMI INDEX
              </div>
              <div className="font-mono-tech text-2xl font-bold text-white mt-1">
                {result.bmi}
              </div>
            </div>
            <div className="p-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A]">
              <div className="text-[10px] font-mono-tech text-[#B3B3B3] uppercase">
                EST. BODY FAT
              </div>
              <div className="font-mono-tech text-2xl font-bold text-[#D4AF37] mt-1">
                {result.bodyFatEstimate}%
              </div>
            </div>
            <div className="p-3.5 rounded-sm bg-[#111111] border border-[#2A2A2A]">
              <div className="text-[10px] font-mono-tech text-[#B3B3B3] uppercase">
                BASE BMR
              </div>
              <div className="font-mono-tech text-2xl font-bold text-white mt-1">
                {result.bmr}
              </div>
            </div>
            <div className="p-3.5 rounded-sm bg-[#111111] border border-[#D4AF37]/50">
              <div className="text-[10px] font-mono-tech text-[#D4AF37] uppercase">
                TARGET KCAL
              </div>
              <div className="font-mono-tech text-2xl font-bold text-white mt-1">
                {result.targetCalories}
              </div>
            </div>
          </div>

          {/* Daily Macro Split */}
          <div className="p-4 rounded-sm bg-[#0D0D0D] border border-[#2A2A2A] space-y-3">
            <div className="text-xs font-mono-tech uppercase tracking-wider text-[#B3B3B3] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#D4AF37]" />
              <span>DAILY MACRO PRESCRIPTION ({result.targetCalories} KCAL/DAY)</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-sm bg-[#151515] border border-[#2A2A2A]">
                <div className="font-mono-tech text-lg font-bold text-[#D4AF37]">
                  {result.macros.proteinGrams}g
                </div>
                <div className="text-[10px] font-mono-tech text-[#B3B3B3] uppercase">
                  PROTEIN
                </div>
              </div>
              <div className="p-2.5 rounded-sm bg-[#151515] border border-[#2A2A2A]">
                <div className="font-mono-tech text-lg font-bold text-white">
                  {result.macros.carbGrams}g
                </div>
                <div className="text-[10px] font-mono-tech text-[#B3B3B3] uppercase">
                  CARBOHYDRATES
                </div>
              </div>
              <div className="p-2.5 rounded-sm bg-[#151515] border border-[#2A2A2A]">
                <div className="font-mono-tech text-lg font-bold text-amber-400">
                  {result.macros.fatGrams}g
                </div>
                <div className="text-[10px] font-mono-tech text-[#B3B3B3] uppercase">
                  HEALTHY FATS
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Program & CTA */}
        <div className="mt-6 pt-4 border-t border-[#2A2A2A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono-tech text-[#B3B3B3] uppercase flex items-center gap-1">
              <Dumbbell className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>RECOMMENDED RAYHAN PROTOCOL:</span>
            </div>
            <div className="font-display text-xl text-white tracking-wider mt-0.5">
              {result.recommendedProgram}
            </div>
          </div>

          <Link
            href="/pricing"
            className="btn-matte-iron px-4 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shrink-0"
          >
            <Activity className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>START THIS PLAN</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
