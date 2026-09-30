import { db, pool } from "@/db";
import {
  branches,
  users,
  memberships,
  payments,
  attendanceLogs,
  progressLogs,
  trainers,
  programs,
  notifications,
  contactSubmissions,
  auditLogs,
} from "@/db/schema";
import { hashPassword } from "@/lib/security";
import { count } from "drizzle-orm";

let isSeeded = false;

export async function ensureSeeded() {
  if (isSeeded) return;

  try {
    // 1. Ensure tables exist via safe idempotent DDL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        tagline TEXT NOT NULL,
        description TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        hours TEXT NOT NULL,
        map_embed_url TEXT NOT NULL,
        coordinates TEXT NOT NULL,
        hero_image TEXT NOT NULL,
        gallery JSONB NOT NULL,
        facilities JSONB NOT NULL,
        equipment JSONB NOT NULL,
        stats JSONB NOT NULL,
        price_3_months INTEGER NOT NULL,
        price_6_months INTEGER NOT NULL,
        price_12_months INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        phone TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        branch_slug TEXT NOT NULL DEFAULT 'dhanmondi',
        avatar_url TEXT NOT NULL,
        email_verified BOOLEAN NOT NULL DEFAULT true,
        two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
        two_factor_secret TEXT,
        reset_token TEXT,
        reset_token_expiry TIMESTAMP,
        token_version INTEGER NOT NULL DEFAULT 1,
        last_login_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS memberships (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        branch_slug TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        duration_months INTEGER NOT NULL,
        amount_bdt INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        start_date TIMESTAMP DEFAULT NOW() NOT NULL,
        expiry_date TIMESTAMP NOT NULL,
        payment_method TEXT NOT NULL,
        transaction_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        membership_id INTEGER,
        invoice_number TEXT NOT NULL,
        branch_slug TEXT NOT NULL,
        plan_name TEXT NOT NULL,
        amount_bdt INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        transaction_id TEXT NOT NULL,
        account_masked TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'paid',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS attendance_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        branch_slug TEXT NOT NULL,
        workout_focus TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        checked_in_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS progress_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        weight_kg REAL NOT NULL,
        bmi REAL NOT NULL,
        body_fat_pct REAL NOT NULL,
        bench_press_kg REAL NOT NULL,
        squat_kg REAL NOT NULL,
        deadlift_kg REAL NOT NULL,
        calories_burned INTEGER NOT NULL,
        workout_notes TEXT NOT NULL,
        recorded_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trainers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        role_title TEXT NOT NULL,
        specialty TEXT NOT NULL,
        branch_slug TEXT NOT NULL,
        experience_years INTEGER NOT NULL,
        certifications JSONB NOT NULL,
        bio TEXT NOT NULL,
        image_url TEXT NOT NULL,
        instagram_handle TEXT NOT NULL,
        clients_trained INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS programs (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        intensity TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        calories_burn TEXT NOT NULL,
        schedule TEXT NOT NULL,
        branch_slug TEXT NOT NULL,
        coach_name TEXT NOT NULL,
        description TEXT NOT NULL,
        features JSONB NOT NULL,
        image_url TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'reminder',
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS contact_submissions (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        branch_slug TEXT NOT NULL,
        goal TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        ip_address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        user_email TEXT NOT NULL,
        action TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'INFO',
        ip_address TEXT NOT NULL,
        details TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    const [{ value: branchCount }] = await db.select({ value: count() }).from(branches);
    if (branchCount > 0) {
      isSeeded = true;
      return;
    }

    // 2. Seed the 3 Signature Branches with EXACT BDT pricing
    await db.insert(branches).values([
      {
        slug: "lalbagh",
        name: "Lalbagh Branch",
        code: "CLUB 01 // LALBAGH",
        tagline: "The Iron Forge",
        description:
          "Born in the heart of Old Dhaka, the Lalbagh Iron Forge is built for raw powerlifting, classic bodybuilding, and relentless hypertrophy. Outfitted with calibrated competition plates, heavy-duty squat monoliths, and high-output climate ventilation.",
        address: "42 Shaheed Nagar, Lalbagh Fort Road, Old Dhaka 1211",
        phone: "01736-574900",
        email: "lalbagh@rayhanfitness.com",
        hours: "6:00 AM – 11:30 PM Daily (Ladies Dedicated Slot: 2:00 PM – 5:00 PM)",
        mapEmbedUrl:
          "https://www.openstreetmap.org/export/embed.html?bbox=90.3800%2C23.7130%2C90.3960%2C23.7250&layer=mapnik&marker=23.7189%2C90.3882",
        coordinates: "23.7189° N, 90.3882° E",
        heroImage:
          "https://images.pexels.com/photos/2261481/pexels-photo-2261481.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        gallery: [
          "https://images.pexels.com/photos/2261481/pexels-photo-2261481.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          "https://images.pexels.com/photos/11618177/pexels-photo-11618177.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          "https://images.pexels.com/photos/17944268/pexels-photo-17944268.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          "https://images.pexels.com/photos/30191517/pexels-photo-30191517.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        ],
        facilities: [
          "Heavy Free-Weight & Powerlifting Zone",
          "Calibrated Olympic Deadlifting Platforms",
          "Biometric Fingerprint & RFID Turnstiles",
          "Digital Locker Rooms & High-Pressure Showers",
          "Whey Protein & Pre-Workout Fuel Bar",
          "Dedicated Certified Floor Coaches",
        ],
        equipment: [
          "6x Rogue Monster Squat Racks",
          "Dumbbells up to 65 KG Pairs",
          "Hammer Strength Plate-Loaded Line",
          "Concept2 Rowers & Assault AirBikes",
          "Competition IPF Bench Press Stations",
        ],
        stats: {
          areaSqFt: "7,800 sq.ft",
          machines: 64,
          trainers: 6,
          maxCapacity: 140,
        },
        price3Months: 1700,
        price6Months: 3200,
        price12Months: 5700,
      },
      {
        slug: "dhanmondi",
        name: "Dhanmondi Branch",
        code: "CLUB 02 // DHANMONDI",
        tagline: "The Flagship Club",
        description:
          "Our two-story flagship sanctuary on Dhanmondi Road 27 blends midnight luxury with elite athletic engineering. Featuring imported Hammer Strength & Life Fitness biomechanics, infrared recovery saunas, 3D InBody scanners, and an executive combat conditioning cage.",
        address: "Level 5 & 6, Imperial Tower, House 24, Road 27 (Old), Dhanmondi, Dhaka 1209",
        phone: "01736-574900",
        email: "dhanmondi@rayhanfitness.com",
        hours: "5:30 AM – 12:00 AM Midnight (24/7 Biometric VIP Access)",
        mapEmbedUrl:
          "https://www.openstreetmap.org/export/embed.html?bbox=90.3650%2C23.7400%2C90.3820%2C23.7540&layer=mapnik&marker=23.7465%2C90.3742",
        coordinates: "23.7465° N, 90.3742° E",
        heroImage:
          "https://images.pexels.com/photos/30191517/pexels-photo-30191517.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        gallery: [
          "https://images.pexels.com/photos/30191517/pexels-photo-30191517.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          "https://images.pexels.com/photos/7674492/pexels-photo-7674492.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          "https://images.pexels.com/photos/17706044/pexels-photo-17706044.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          "https://images.pexels.com/photos/4720790/pexels-photo-4720790.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        ],
        facilities: [
          "Full Hammer Strength & Eleiko Biomechanics Floor",
          "Infrared Dry Sauna & Cold Plunge Recovery Suite",
          "InBody 770 3D Biometric Body Composition Scanner",
          "25-Meter Sled Turf Track & MMA Octagon Zone",
          "Executive Smart Lockers with Towel Service",
          "Macro-Calculated Espresso & Nutrition Lounge",
        ],
        equipment: [
          "Eleiko IPF Powerlifting Competition Combo Racks",
          "Full Panatta & Hammer Strength Isolateral Suite",
          "Woodway Curve Treadmills & StairMaster Gauntlets",
          "Keiser Functional Pneumatic Cable Columns",
          "Dedicated Glute Builder & Biomechanical Leg Presses",
        ],
        stats: {
          areaSqFt: "14,500 sq.ft",
          machines: 112,
          trainers: 9,
          maxCapacity: 240,
        },
        price3Months: 3450,
        price6Months: 6300,
        price12Months: 9800,
      },
      {
        slug: "mirpur",
        name: "Mirpur Branch",
        code: "CLUB 03 // MIRPUR",
        tagline: "The Performance Lab",
        description:
          "Positioned right at Mirpur-10 Circle, The Performance Lab is engineered for high-output athletic conditioning, metabolic HIIT, Olympic weightlifting, and functional combat readiness. Includes an expansive indoor sprint turf, steam bath suite, and biometric telemetry.",
        address: "Plot 14, Block C, Rokeya Sarani, Mirpur-10 Circle, Dhaka 1216",
        phone: "01736-574900",
        email: "mirpur@rayhanfitness.com",
        hours: "6:00 AM – 11:30 PM Daily (Dedicated Women's Studio Floor Available)",
        mapEmbedUrl:
          "https://www.openstreetmap.org/export/embed.html?bbox=90.3600%2C23.8000%2C90.3780%2C23.8140&layer=mapnik&marker=23.8069%2C90.3687",
        coordinates: "23.8069° N, 90.3687° E",
        heroImage:
          "https://images.pexels.com/photos/7674492/pexels-photo-7674492.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        gallery: [
          "https://images.pexels.com/photos/7674492/pexels-photo-7674492.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          "https://images.pexels.com/photos/14524650/pexels-photo-14524650.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          "https://images.pexels.com/photos/15046713/pexels-photo-15046713.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          "https://images.pexels.com/photos/32695892/pexels-photo-32695892.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        ],
        facilities: [
          "30-Meter Athletic Prowler Sled & Sprint Turf",
          "Steam Room & Hydro-Recovery Lockers",
          "Private Ladies-Only Training Sanctuary Zone",
          "Olympic Weightlifting Shock-Absorbing Platforms",
          "Metabolic HIIT & Battle-Rope Stadium",
          "Underground Secure Car & Bike Parking",
        ],
        equipment: [
          "8x Olympic Lifting Platforms with Bumper Plates",
          "Concept2 SkiErgs, RowErgs & Assault Runners",
          "Life Fitness Signature Cable Jungle",
          "Heavy Boxing Bags & Muay Thai Conditioning Rig",
          "InBody 570 Biometric Assessment Kiosk",
        ],
        stats: {
          areaSqFt: "12,200 sq.ft",
          machines: 96,
          trainers: 8,
          maxCapacity: 210,
        },
        price3Months: 3500,
        price6Months: 6000,
        price12Months: 10000,
      },
    ]);

    // 3. Seed Users (Member, Trainer, Admin + additional members)
    const defaultPasswordHash = await hashPassword("Rayhan#2026");

    const insertedUsers = await db
      .insert(users)
      .values([
        {
          name: "Farhan Ahmed",
          email: "member@rayhanfitness.com",
          passwordHash: defaultPasswordHash,
          phone: "+880 1712-556677",
          role: "member",
          branchSlug: "dhanmondi",
          avatarUrl:
            "https://images.pexels.com/photos/29886673/pexels-photo-29886673.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
          emailVerified: true,
          twoFactorEnabled: false,
          twoFactorSecret: "RF-OTP-8842",
          tokenVersion: 1,
        },
        {
          name: "Coach Tariq Mahmud",
          email: "trainer@rayhanfitness.com",
          passwordHash: defaultPasswordHash,
          phone: "+880 1819-334455",
          role: "trainer",
          branchSlug: "dhanmondi",
          avatarUrl:
            "https://images.pexels.com/photos/10305231/pexels-photo-10305231.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
          emailVerified: true,
          twoFactorEnabled: true,
          twoFactorSecret: "RF-OTP-9102",
          tokenVersion: 1,
        },
        {
          name: "Rayhan Chowdhury",
          email: "admin@rayhanfitness.com",
          passwordHash: defaultPasswordHash,
          phone: "+880 1711-000999",
          role: "admin",
          branchSlug: "dhanmondi",
          avatarUrl:
            "https://images.pexels.com/photos/32996772/pexels-photo-32996772.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
          emailVerified: true,
          twoFactorEnabled: true,
          twoFactorSecret: "RF-ADMIN-2026",
          tokenVersion: 1,
        },
        {
          name: "Nafisa Rahman",
          email: "nafisa@rayhanfitness.com",
          passwordHash: defaultPasswordHash,
          phone: "+880 1911-223344",
          role: "member",
          branchSlug: "mirpur",
          avatarUrl:
            "https://images.pexels.com/photos/32695892/pexels-photo-32695892.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
          emailVerified: true,
          twoFactorEnabled: false,
          tokenVersion: 1,
        },
        {
          name: "Tanvir Hossain",
          email: "tanvir@rayhanfitness.com",
          passwordHash: defaultPasswordHash,
          phone: "+880 1611-778899",
          role: "member",
          branchSlug: "lalbagh",
          avatarUrl:
            "https://images.pexels.com/photos/11041241/pexels-photo-11041241.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
          emailVerified: true,
          twoFactorEnabled: false,
          tokenVersion: 1,
        },
      ])
      .returning();

    const primaryMember = insertedUsers[0];
    const nafisaMember = insertedUsers[3];
    const tanvirMember = insertedUsers[4];

    // 4. Seed Memberships & Payment Invoices
    const now = new Date();
    const start6M = new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000); // started 42 days ago
    const expiry6M = new Date(now.getTime() + 138 * 24 * 60 * 60 * 1000); // 138 days remaining

    const [m1] = await db
      .insert(memberships)
      .values([
        {
          userId: primaryMember.id,
          branchSlug: "dhanmondi",
          planName: "6 Months",
          durationMonths: 6,
          amountBdt: 6300,
          status: "active",
          startDate: start6M,
          expiryDate: expiry6M,
          paymentMethod: "bKash",
          transactionId: "BKX984120DHN",
        },
        {
          userId: nafisaMember.id,
          branchSlug: "mirpur",
          planName: "12 Months",
          durationMonths: 12,
          amountBdt: 10000,
          status: "active",
          startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
          expiryDate: new Date(now.getTime() + 345 * 24 * 60 * 60 * 1000),
          paymentMethod: "Nagad",
          transactionId: "NGD772190MIR",
        },
        {
          userId: tanvirMember.id,
          branchSlug: "lalbagh",
          planName: "3 Months",
          durationMonths: 3,
          amountBdt: 1700,
          status: "active",
          startDate: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000),
          expiryDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
          paymentMethod: "bKash",
          transactionId: "BKX331098LAL",
        },
      ])
      .returning();

    await db.insert(payments).values([
      {
        userId: primaryMember.id,
        membershipId: m1.id,
        invoiceNumber: "INV-2026-0841",
        branchSlug: "dhanmondi",
        planName: "6 Months — Flagship Club Access",
        amountBdt: 6300,
        paymentMethod: "bKash",
        transactionId: "BKX984120DHN",
        accountMasked: "01712-***677",
        status: "paid",
        createdAt: start6M,
      },
      {
        userId: primaryMember.id,
        membershipId: m1.id,
        invoiceNumber: "INV-2025-1192",
        branchSlug: "dhanmondi",
        planName: "3 Months — Flagship Club Access",
        amountBdt: 3450,
        paymentMethod: "Card",
        transactionId: "VISA449182DHN",
        accountMasked: "4321 •••• •••• 8819",
        status: "paid",
        createdAt: new Date(now.getTime() - 135 * 24 * 60 * 60 * 1000),
      },
      {
        userId: nafisaMember.id,
        membershipId: m1.id + 1,
        invoiceNumber: "INV-2026-0912",
        branchSlug: "mirpur",
        planName: "12 Months — Performance Lab VIP",
        amountBdt: 10000,
        paymentMethod: "Nagad",
        transactionId: "NGD772190MIR",
        accountMasked: "01911-***344",
        status: "paid",
      },
      {
        userId: tanvirMember.id,
        membershipId: m1.id + 2,
        invoiceNumber: "INV-2026-0719",
        branchSlug: "lalbagh",
        planName: "3 Months — Iron Forge Access",
        amountBdt: 1700,
        paymentMethod: "bKash",
        transactionId: "BKX331098LAL",
        accountMasked: "01611-***899",
        status: "paid",
      },
    ]);

    // 5. Seed Attendance Logs for primary member
    await db.insert(attendanceLogs).values([
      {
        userId: primaryMember.id,
        branchSlug: "dhanmondi",
        workoutFocus: "Heavy Chest & Triceps Hypertrophy",
        durationMinutes: 78,
        checkedInAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        userId: primaryMember.id,
        branchSlug: "dhanmondi",
        workoutFocus: "Deadlift Protocol & Posterior Chain",
        durationMinutes: 85,
        checkedInAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        userId: primaryMember.id,
        branchSlug: "dhanmondi",
        workoutFocus: "Metabolic HIIT & Infrared Sauna Recovery",
        durationMinutes: 65,
        checkedInAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        userId: primaryMember.id,
        branchSlug: "mirpur",
        workoutFocus: "Olympic Squat & Sled Turf Conditioning",
        durationMinutes: 92,
        checkedInAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        userId: primaryMember.id,
        branchSlug: "dhanmondi",
        workoutFocus: "Overhead Press & Core Stabilization",
        durationMinutes: 70,
        checkedInAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
    ]);

    // 6. Seed 7 Weeks of Biometric Progress Logs for Interactive Charts
    const weeks = [42, 35, 28, 21, 14, 7, 1];
    const weights = [84.6, 83.8, 82.9, 81.7, 80.8, 79.9, 79.1];
    const bmis = [26.7, 26.4, 26.1, 25.8, 25.5, 25.2, 24.9];
    const bodyFats = [21.4, 20.6, 19.8, 18.9, 18.1, 17.2, 16.4];
    const benches = [80, 82.5, 85, 87.5, 92.5, 95, 100];
    const squats = [110, 115, 120, 125, 130, 135, 142.5];
    const deadlifts = [140, 145, 152.5, 160, 165, 172.5, 180];

    for (let i = 0; i < weeks.length; i++) {
      await db.insert(progressLogs).values({
        userId: primaryMember.id,
        weightKg: weights[i],
        bmi: bmis[i],
        bodyFatPct: bodyFats[i],
        benchPressKg: benches[i],
        squatKg: squats[i],
        deadliftKg: deadlifts[i],
        caloriesBurned: 620 + i * 35,
        workoutNotes: `Week ${i + 1} Biometric Check — Progressive overload target hit cleanly.`,
        recordedAt: new Date(now.getTime() - weeks[i] * 24 * 60 * 60 * 1000),
      });
    }

    // 7. Seed Notifications
    await db.insert(notifications).values([
      {
        userId: primaryMember.id,
        title: "6-Month Dhanmondi Membership Active",
        message:
          "Your Flagship Club 6-Month Plan is active with 138 days remaining. Complimentary InBody 770 scan unlocked this month.",
        type: "reminder",
        isRead: false,
      },
      {
        userId: primaryMember.id,
        title: "New PR Milestone Logged: 100 KG Bench Press",
        message:
          "Coach Tariq verified your 100 KG 1RM Bench Press at Dhanmondi Club. Welcome to the 100KG Iron Club.",
        type: "promo",
        isRead: false,
      },
      {
        userId: primaryMember.id,
        title: "Security Telemetry: Biometric + JWT Session Verified",
        message:
          "HttpOnly SameSite=Strict session established. Enable 2FA OTP in your Security Settings for extra protection.",
        type: "security",
        isRead: true,
      },
    ]);

    // 8. Seed Elite Trainers across Lalbagh, Dhanmondi, and Mirpur
    await db.insert(trainers).values([
      {
        name: "Tariq Mahmud",
        slug: "tariq-mahmud",
        roleTitle: "Head Strength & Hypertrophy Director",
        specialty: "Powerlifting & Biomechanical Hypertrophy",
        branchSlug: "dhanmondi",
        experienceYears: 11,
        certifications: ["NSCA-CSCS", "IPF Senior Powerlifting Coach", "Precision Nutrition L2"],
        bio: "Former National Powerlifting gold medalist (93kg class) with over a decade engineering body recomposition and raw strength blocks for Dhaka's top athletes.",
        imageUrl:
          "https://images.pexels.com/photos/10305231/pexels-photo-10305231.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
        instagramHandle: "@tariq.iron.rf",
        clientsTrained: 480,
      },
      {
        name: "Rayhan Chowdhury",
        slug: "rayhan-chowdhury",
        roleTitle: "Founder & Master Performance Architect",
        specialty: "Elite Athletic Conditioning & Physique Prep",
        branchSlug: "dhanmondi",
        experienceYears: 14,
        certifications: ["IFBB Pro League Prep Advisor", "ISSA Master Trainer", "EXOS Performance Specialist"],
        bio: "Founder of Rayhan Fitness. Built the 3-club Dhaka network to bring international midnight-iron standards and sports science to Bangladesh.",
        imageUrl:
          "https://images.pexels.com/photos/32996772/pexels-photo-32996772.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
        instagramHandle: "@rayhanfitness.official",
        clientsTrained: 920,
      },
      {
        name: "Arman Khan",
        slug: "arman-khan",
        roleTitle: "Master Iron Coach — Lalbagh",
        specialty: "Old-School Bodybuilding & Mass Architecture",
        branchSlug: "lalbagh",
        experienceYears: 9,
        certifications: ["ACE Certified Personal Trainer", "BBF National Judge", "Kettlebell Sport L2"],
        bio: "Commanding the Lalbagh Iron Forge, Arman specializes in high-density hypertrophy, deadlift mechanics, and breaking stubborn strength plateaus.",
        imageUrl:
          "https://images.pexels.com/photos/11041241/pexels-photo-11041241.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
        instagramHandle: "@arman.forge.rf",
        clientsTrained: 390,
      },
      {
        name: "Zarin Tasnim",
        slug: "zarin-tasnim",
        roleTitle: "Lead Women's Strength & Metabolic Coach",
        specialty: "Female Strength, Glute Biomechanics & HIIT",
        branchSlug: "mirpur",
        experienceYears: 7,
        certifications: ["NASM-CPT", "Pre & Postnatal Fitness Specialist", "CrossFit L2 Trainer"],
        bio: "Leading the Mirpur Performance Lab's athletic conditioning and dedicated women's strength blocks, empowering over 300 women in Dhaka to lift heavy with precision.",
        imageUrl:
          "https://images.pexels.com/photos/7674492/pexels-photo-7674492.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
        instagramHandle: "@zarin.lifts.rf",
        clientsTrained: 340,
      },
      {
        name: "Shafin Karim",
        slug: "shafin-karim",
        roleTitle: "Combat Conditioning & MMA Striking Coach",
        specialty: "Muay Thai, Explosive VO2 Max & Fight Camp",
        branchSlug: "mirpur",
        experienceYears: 8,
        certifications: ["Kru Muay Thai Certified", "USA Weightlifting L1", "First Aid & Sports Trauma"],
        bio: "Combines striking combinations, prowler sled sprints, and anaerobic lactic threshold drills at the Mirpur Performance Lab.",
        imageUrl:
          "https://images.pexels.com/photos/8874437/pexels-photo-8874437.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
        instagramHandle: "@shafin.combat.rf",
        clientsTrained: 275,
      },
      {
        name: "Rafiqul Islam",
        slug: "rafiqul-islam",
        roleTitle: "Senior Strength & Rehab Specialist",
        specialty: "Joint Mobility, Injury Rehab & Squat Mechanics",
        branchSlug: "lalbagh",
        experienceYears: 10,
        certifications: ["FMS Level 2", "BSc Physiotherapy & Sports Rehab", "CSCS"],
        bio: "Ensures every athlete at Lalbagh trains pain-free while building bulletproof shoulders, knees, and lower backs.",
        imageUrl:
          "https://images.pexels.com/photos/17706040/pexels-photo-17706040.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
        instagramHandle: "@rafiq.rehab.rf",
        clientsTrained: 410,
      },
    ]);

    // 9. Seed Signature Programs / Classes
    await db.insert(programs).values([
      {
        slug: "midnight-hypertrophy-protocol",
        title: "MIDNIGHT HYPERTROPHY PROTOCOL",
        category: "Strength & Mass",
        intensity: "EXTREME",
        durationMinutes: 75,
        caloriesBurn: "550–780 kcal",
        schedule: "Sat, Mon, Wed — 7:00 PM & 9:00 PM",
        branchSlug: "all",
        coachName: "Coach Tariq Mahmud",
        description:
          "Scientific mechanical-tension hypertrophy engineered with Hammer Strength isolateral machines, tempo control, and progressive overload tracking.",
        features: [
          "Biomechanical Form Calibration",
          "8-Week Progressive Overload Mesocycle",
          "Monthly InBody 3D Lean Mass Scan",
          "Post-Workout Macro & Creatine Protocol",
        ],
        imageUrl:
          "https://images.pexels.com/photos/17706044/pexels-photo-17706044.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      },
      {
        slug: "dhaka-powerlifting-syndicate",
        title: "DHAKA POWERLIFTING SYNDICATE",
        category: "Powerlifting",
        intensity: "EXTREME",
        durationMinutes: 90,
        caloriesBurn: "600–850 kcal",
        schedule: "Sun, Tue, Thu — 6:30 PM",
        branchSlug: "lalbagh",
        coachName: "Coach Arman Khan",
        description:
          "Master the Big Three — Squat, Bench Press, and Deadlift — on calibrated competition platforms with RPE-based periodization.",
        features: [
          "Calibrated Competition Bars & Plates",
          "1RM Velocity & Bar-Path Telemetry",
          "Powerlifting Belt & Knee Sleeve Guidance",
          "Quarterly Rayhan Fitness Mock Meet",
        ],
        imageUrl:
          "https://images.pexels.com/photos/2261481/pexels-photo-2261481.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      },
      {
        slug: "redline-metabolic-hiit",
        title: "REDLINE METABOLIC HIIT & TURF",
        category: "Conditioning",
        intensity: "HIGH",
        durationMinutes: 50,
        caloriesBurn: "650–920 kcal",
        schedule: "Daily — 8:00 AM, 5:30 PM & 8:30 PM",
        branchSlug: "mirpur",
        coachName: "Coach Shafin Karim",
        description:
          "High-voltage anaerobic intervals combining Assault AirBikes, Concept2 SkiErgs, heavy kettlebell swings, and 30m prowler sled sprints.",
        features: [
          "Live Heart-Rate Zone Telemetry",
          "EPOC 36-Hour Afterburn Effect",
          "Turf Prowler Sled & Battle Ropes",
          "Electrolyte Hydration Included",
        ],
        imageUrl:
          "https://images.pexels.com/photos/30191517/pexels-photo-30191517.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      },
      {
        slug: "combat-mma-conditioning",
        title: "COMBAT & MUAY THAI ENGINE",
        category: "Combat",
        intensity: "EXTREME",
        durationMinutes: 60,
        caloriesBurn: "700–950 kcal",
        schedule: "Sat, Mon, Wed — 6:00 PM",
        branchSlug: "dhanmondi",
        coachName: "Coach Shafin Karim",
        description:
          "Strike precision, bag work, rotational core torque, and fight-camp stamina inside our octagonal combat zone.",
        features: [
          "Heavy Bag & Thai Pad Combinations",
          "Rotational Core & Neck Strengthening",
          "Footwork & Explosive Agility Drills",
          "Hand-Wrap & Guard Technique Clinic",
        ],
        imageUrl:
          "https://images.pexels.com/photos/4720790/pexels-photo-4720790.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      },
      {
        slug: "valkyrie-womens-strength",
        title: "VALKYRIE WOMEN'S STRENGTH SANCTUARY",
        category: "Women's Elite",
        intensity: "HIGH",
        durationMinutes: 60,
        caloriesBurn: "480–680 kcal",
        schedule: "Daily — 2:30 PM, 4:00 PM & 6:30 PM",
        branchSlug: "all",
        coachName: "Coach Zarin Tasnim",
        description:
          "Dedicated female-led strength, glute biomechanics, core sculpting, and metabolic conditioning in a private, empowering environment.",
        features: [
          "Female Certified Strength Coaches",
          "Barbell Hip Thrust & Lower-Body Focus",
          "PCOS & Hormonal-Friendly Nutrition Guide",
          "Private Studio Access Hours",
        ],
        imageUrl:
          "https://images.pexels.com/photos/7674492/pexels-photo-7674492.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      },
      {
        slug: "executive-1on1-transformation",
        title: "1-ON-1 EXECUTIVE BIOMETRIC COACHING",
        category: "Personal Training",
        intensity: "MODERATE",
        durationMinutes: 60,
        caloriesBurn: "500–750 kcal",
        schedule: "Custom Flexible Slot (5:30 AM – 11:30 PM)",
        branchSlug: "all",
        coachName: "Rayhan Chowdhury & Master Roster",
        description:
          "Bespoke 1-on-1 personal training with weekly bloodwork/InBody review, custom Bangladeshi macro meal plans, and injury-proof biomechanics.",
        features: [
          "Dedicated Master Coach Every Rep",
          "Custom Bangladeshi Diet & Macro Blueprint",
          "Infrared Sauna & Mobility Recovery",
          "Direct WhatsApp Coach Accountability",
        ],
        imageUrl:
          "https://images.pexels.com/photos/14524650/pexels-photo-14524650.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      },
    ]);

    // 10. Seed Initial Contact Submissions & Security Audit Logs
    await db.insert(contactSubmissions).values([
      {
        name: "Mahmudul Hasan",
        email: "mahmud.hasan@gmail.com",
        phone: "+880 1755-889900",
        branchSlug: "dhanmondi",
        goal: "6-Month Body Recomposition & VIP Tour",
        message:
          "Looking to join Dhanmondi branch with a colleague. Would like to inspect the Hammer Strength floor this evening at 7 PM.",
        status: "new",
        ipAddress: "103.148.21.44",
      },
      {
        name: "Sadia Islam",
        email: "sadia.mirpur@outlook.com",
        phone: "+880 1833-441122",
        branchSlug: "mirpur",
        goal: "Valkyrie Women's Strength Program",
        message:
          "Interested in the 6-month package (৳6,000) at Mirpur-10 and the afternoon women's strength sessions with Coach Zarin.",
        status: "contacted",
        ipAddress: "103.92.84.19",
      },
    ]);

    await db.insert(auditLogs).values([
      {
        userId: 3,
        userEmail: "admin@rayhanfitness.com",
        action: "SYSTEM_WAF_HELMET_ACTIVE",
        severity: "INFO",
        ipAddress: "127.0.0.1",
        details:
          "Strict HSTS, CSP, X-Frame-Options, CSRF validation, and Drizzle parameterized query enforcement initialized.",
      },
      {
        userId: 1,
        userEmail: "member@rayhanfitness.com",
        action: "MEMBERSHIP_PURCHASE_VERIFIED",
        severity: "INFO",
        ipAddress: "103.148.20.11",
        details:
          "Verified bKash TrxID BKX984120DHN for Dhanmondi 6-Month Plan (৳6,300).",
      },
      {
        userId: null,
        userEmail: "unknown@scanner.bot",
        action: "AUTH_LOGIN_FAILED_BLOCKED",
        severity: "WARN",
        ipAddress: "185.220.101.42",
        details:
          "Failed password attempt blocked by bcrypt verification & sliding-window brute-force limiter.",
      },
    ]);

    isSeeded = true;
  } catch (err) {
    console.error("Database seed warning:", err);
  }
}
