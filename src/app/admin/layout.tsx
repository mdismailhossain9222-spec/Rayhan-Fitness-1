import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin Console | RAYHAN FITNESS",
  description:
    "Rayhan Fitness administration — bookings, members, trainers, branches, packages and payments.",
  robots: { index: false, follow: false },
};

/**
 * /admin uses the dedicated AdminShell (sidebar + top bar).
 * The public Navbar/Footer hide themselves on /admin routes.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
