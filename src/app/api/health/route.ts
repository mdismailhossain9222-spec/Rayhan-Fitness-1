import { db } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    await ensureSeeded();
    return Response.json({
      ok: true,
      service: "Rayhan Fitness API",
      security: "JWT-HttpOnly + Bcrypt + Drizzle-ORM + Helmet-Headers",
    });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
