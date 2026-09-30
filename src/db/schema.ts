import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  real,
  jsonb,
} from "drizzle-orm/pg-core";

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  hours: text("hours").notNull(),
  mapEmbedUrl: text("map_embed_url").notNull(),
  coordinates: text("coordinates").notNull(),
  heroImage: text("hero_image").notNull(),
  gallery: jsonb("gallery").$type<string[]>().notNull(),
  facilities: jsonb("facilities").$type<string[]>().notNull(),
  equipment: jsonb("equipment").$type<string[]>().notNull(),
  stats: jsonb("stats")
    .$type<{
      areaSqFt: string;
      machines: number;
      trainers: number;
      maxCapacity: number;
    }>()
    .notNull(),
  price3Months: integer("price_3_months").notNull(),
  price6Months: integer("price_6_months").notNull(),
  price12Months: integer("price_12_months").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull().default("member"), // 'member' | 'trainer' | 'admin'
  branchSlug: text("branch_slug").notNull().default("dhanmondi"),
  avatarUrl: text("avatar_url").notNull(),
  emailVerified: boolean("email_verified").notNull().default(true),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorSecret: text("two_factor_secret"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  tokenVersion: integer("token_version").notNull().default(1),
  lastLoginAt: timestamp("last_login_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  branchSlug: text("branch_slug").notNull(),
  planName: text("plan_name").notNull(), // '3 Months' | '6 Months' | '12 Months'
  durationMonths: integer("duration_months").notNull(),
  amountBdt: integer("amount_bdt").notNull(),
  status: text("status").notNull().default("active"), // 'active' | 'expired' | 'cancelled'
  startDate: timestamp("start_date").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  paymentMethod: text("payment_method").notNull(), // 'bKash' | 'Nagad' | 'Card'
  transactionId: text("transaction_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  membershipId: integer("membership_id"),
  invoiceNumber: text("invoice_number").notNull(),
  branchSlug: text("branch_slug").notNull(),
  planName: text("plan_name").notNull(),
  amountBdt: integer("amount_bdt").notNull(),
  paymentMethod: text("payment_method").notNull(),
  transactionId: text("transaction_id").notNull(),
  accountMasked: text("account_masked").notNull(),
  status: text("status").notNull().default("paid"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendanceLogs = pgTable("attendance_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  branchSlug: text("branch_slug").notNull(),
  workoutFocus: text("workout_focus").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  checkedInAt: timestamp("checked_in_at").defaultNow().notNull(),
});

export const progressLogs = pgTable("progress_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  weightKg: real("weight_kg").notNull(),
  bmi: real("bmi").notNull(),
  bodyFatPct: real("body_fat_pct").notNull(),
  benchPressKg: real("bench_press_kg").notNull(),
  squatKg: real("squat_kg").notNull(),
  deadliftKg: real("deadlift_kg").notNull(),
  caloriesBurned: integer("calories_burned").notNull(),
  workoutNotes: text("workout_notes").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const trainers = pgTable("trainers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  roleTitle: text("role_title").notNull(),
  specialty: text("specialty").notNull(),
  branchSlug: text("branch_slug").notNull(),
  experienceYears: integer("experience_years").notNull(),
  certifications: jsonb("certifications").$type<string[]>().notNull(),
  bio: text("bio").notNull(),
  imageUrl: text("image_url").notNull(),
  instagramHandle: text("instagram_handle").notNull(),
  clientsTrained: integer("clients_trained").notNull(),
});

export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  intensity: text("intensity").notNull(), // 'EXTREME' | 'HIGH' | 'MODERATE'
  durationMinutes: integer("duration_minutes").notNull(),
  caloriesBurn: text("calories_burn").notNull(),
  schedule: text("schedule").notNull(),
  branchSlug: text("branch_slug").notNull(),
  coachName: text("coach_name").notNull(),
  description: text("description").notNull(),
  features: jsonb("features").$type<string[]>().notNull(),
  imageUrl: text("image_url").notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("reminder"), // 'reminder' | 'promo' | 'security' | 'system'
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  branchSlug: text("branch_slug").notNull(),
  goal: text("goal").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  ipAddress: text("ip_address").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userEmail: text("user_email").notNull(),
  action: text("action").notNull(),
  severity: text("severity").notNull().default("INFO"), // 'INFO' | 'WARN' | 'CRITICAL'
  ipAddress: text("ip_address").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
