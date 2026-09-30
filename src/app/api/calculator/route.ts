import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const age = Math.min(85, Math.max(14, Number(body.age) || 26));
    const gender = body.gender === "female" ? "female" : "male";
    const heightCm = Math.min(230, Math.max(120, Number(body.heightCm) || 175));
    const weightKg = Math.min(220, Math.max(35, Number(body.weightKg) || 76));
    const activityMultiplier = Number(body.activityMultiplier) || 1.55;
    const goal = ["cut", "recomp", "bulk"].includes(body.goal)
      ? body.goal
      : "recomp";

    const heightM = heightCm / 100;
    const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

    let bmiCategory = "ATHLETIC / OPTIMAL";
    if (bmi < 18.5) bmiCategory = "ECTOMORPH / UNDERWEIGHT";
    else if (bmi >= 25 && bmi < 29.9) bmiCategory = "OVERWEIGHT / POWER MASS";
    else if (bmi >= 30) bmiCategory = "HIGH ADIPOSE / METABOLIC PRIORITY";

    // Mifflin-St Jeor BMR
    const bmr = Math.round(
      gender === "male"
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    );

    const tdee = Math.round(bmr * activityMultiplier);

    let targetCalories = tdee;
    let recommendedProgram = "MIDNIGHT HYPERTROPHY PROTOCOL";
    let recommendedPlan = "6 Months — Most Popular";

    if (goal === "cut") {
      targetCalories = Math.max(1350, tdee - 450);
      recommendedProgram = "REDLINE METABOLIC HIIT & TURF";
    } else if (goal === "bulk") {
      targetCalories = tdee + 350;
      recommendedProgram = "DHAKA POWERLIFTING SYNDICATE";
      recommendedPlan = "12 Months — Elite Transformation";
    }

    // Deurenberg body fat estimate adjusted for athletic activity
    const rawBf =
      1.2 * bmi + 0.23 * age - 10.8 * (gender === "male" ? 1 : 0) - 5.4;
    const bodyFatEstimate = Number(Math.max(7, Math.min(42, rawBf - 1.5)).toFixed(1));

    // Macro breakdown
    const proteinGrams = Math.round(weightKg * 2.2);
    const fatGrams = Math.round((targetCalories * 0.25) / 9);
    const carbGrams = Math.max(
      60,
      Math.round((targetCalories - proteinGrams * 4 - fatGrams * 9) / 4)
    );

    return NextResponse.json({
      bmi,
      bmiCategory,
      bmr,
      tdee,
      targetCalories,
      bodyFatEstimate,
      macros: {
        proteinGrams,
        carbGrams,
        fatGrams,
      },
      recommendedProgram,
      recommendedPlan,
    });
  } catch (err) {
    console.error("POST /api/calculator error:", err);
    return NextResponse.json(
      { error: "Failed to calculate biometric metrics" },
      { status: 500 }
    );
  }
}
