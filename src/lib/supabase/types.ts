/**
 * RAYHAN FITNESS — Supabase Database TypeScript types.
 * Mirrors `supabase/migrations/*` schema so every query is type-safe.
 */

export type BranchSlug = "lalbagh" | "dhanmondi" | "mirpur";
export type UserRole = "member" | "trainer" | "admin";
export type MembershipStatus = "active" | "expired" | "cancelled";
export type PaymentStatus = "paid" | "pending" | "failed";
export type PaymentMethod = "bkash" | "nagad" | "card";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  preferred_branch: BranchSlug | null;
  role: UserRole;
  created_at: string;
};

export type Branch = {
  id: string;
  name: string;
  slug: BranchSlug;
  location_address: string | null;
  map_lat: number | null;
  map_lng: number | null;
  phone: string | null;
  image_urls: string[];
  created_at: string;
};

export type Package = {
  id: string;
  branch_id: string;
  duration_months: number;
  price_tk: number;
  features: Record<string, unknown> | unknown[];
  is_popular: boolean;
  created_at: string;
};

export type Membership = {
  id: string;
  user_id: string;
  branch_id: string;
  package_id: string | null;
  start_date: string;
  end_date: string;
  status: MembershipStatus;
  payment_status: PaymentStatus;
  created_at: string;
};

export type Payment = {
  id: string;
  membership_id: string | null;
  user_id: string;
  amount_tk: number;
  payment_method: PaymentMethod;
  transaction_id: string | null;
  status: PaymentStatus;
  created_at: string;
};

export type Attendance = {
  id: string;
  user_id: string;
  branch_id: string | null;
  check_in_time: string;
};

export type BookingStatus = "pending" | "confirmed" | "rejected" | "completed" | "cancelled";

export type Trainer = {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  specialty: string | null;
  branch_id: string | null;
  bio: string | null;
  availability: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  user_id: string;
  trainer_id: string;
  branch_id: string;
  session_type: string;
  preferred_date: string;
  preferred_time_slot: string;
  note: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  recipient_role: "admin" | "member";
  recipient_id: string | null;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
};

/**
 * `Database` shape for @supabase/supabase-js generics (generated-type style).
 * The `Relationships` / `Views` / `Functions` / `Enums` keys are required
 * for the client's table inference — without them `.from()` resolves to `never`.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      branches: {
        Row: Branch;
        Insert: Partial<Branch> & { name: string; slug: BranchSlug };
        Update: Partial<Branch>;
        Relationships: [];
      };
      packages: {
        Row: Package;
        Insert: Partial<Package> & { branch_id: string; duration_months: number; price_tk: number };
        Update: Partial<Package>;
        Relationships: [];
      };
      memberships: {
        Row: Membership;
        Insert: Partial<Membership> & { user_id: string; branch_id: string };
        Update: Partial<Membership>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment> & { user_id: string; amount_tk: number; payment_method: PaymentMethod };
        Update: Partial<Payment>;
        Relationships: [];
      };
      attendance: {
        Row: Attendance;
        Insert: Partial<Attendance> & { user_id: string };
        Update: Partial<Attendance>;
        Relationships: [];
      };
      trainers: {
        Row: Trainer;
        Insert: Partial<Trainer> & { name: string; slug: string };
        Update: Partial<Trainer>;
        Relationships: [];
      };
      bookings: {
        Row: Booking;
        Insert: Partial<Booking> & { user_id: string; trainer_id: string; branch_id: string; preferred_date: string; preferred_time_slot: string };
        Update: Partial<Booking>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification> & { title: string; type: string };
        Update: Partial<Notification>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
