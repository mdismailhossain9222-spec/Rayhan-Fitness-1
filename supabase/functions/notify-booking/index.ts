// ============================================================================
// RAYHAN FITNESS — Edge Function: booking email notifications (Deno).
// Fires on new bookings via Database Webhook (Dashboard → Database →
// Webhooks → Create trigger on public.bookings AFTER INSERT → this URL),
// emailing the admin through Resend so they never miss a request — and
// optionally confirming back to the member.
//
// Deploy:
//   supabase functions deploy notify-booking --no-verify-jwt
//   supabase secrets set RESEND_API_KEY=re_xxx ADMIN_EMAIL=admin@rayhanfitness.com
//
// Get a key: https://resend.com → API Keys (free tier covers gym volume).
// Alternative: swap the fetch below for SendGrid's /v3/mail/send endpoint.
// ============================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "admin@rayhanfitness.com";
const FROM_EMAIL =
  Deno.env.get("FROM_EMAIL") ?? "Rayhan Fitness <bookings@rayhanfitness.com>";

interface BookingPayload {
  type?: string;
  table?: string;
  record?: {
    id?: string;
    session_type?: string;
    preferred_date?: string;
    preferred_time_slot?: string;
    note?: string | null;
  };
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend failed (${res.status}): ${text}`);
  }
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!RESEND_API_KEY) {
    return new Response("RESEND_API_KEY not configured", { status: 500 });
  }
  let payload: BookingPayload;
  try {
    payload = (await req.json()) as BookingPayload;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const record = payload.record ?? {};

  const esc = (v: unknown) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .slice(0, 500);

  const subject = `New booking request — ${esc(record.session_type)} on ${esc(
    record.preferred_date
  )}`;
  const html = `
    <div style="font-family:Arial,sans-serif;background:#0A0A0A;color:#F5F5F5;padding:24px">
      <h2 style="color:#D4AF37;margin:0 0 12px">New trainer booking request</h2>
      <p><strong>Session:</strong> ${esc(record.session_type)}</p>
      <p><strong>Date:</strong> ${esc(record.preferred_date)}</p>
      <p><strong>Slot:</strong> ${esc(record.preferred_time_slot)}</p>
      <p><strong>Note:</strong> ${esc(record.note || "—")}</p>
      <p style="margin-top:16px">
        <a href="https://rayhanfitness.com/admin/bookings?focus=${esc(record.id)}"
           style="background:#D4AF37;color:#0A0A0A;padding:10px 20px;text-decoration:none;font-weight:bold">
          Review in admin console
        </a>
      </p>
    </div>`;

  try {
    // Admin always gets the alert…
    await sendEmail(ADMIN_EMAIL, subject, html);
    // …and the member gets a lightweight acknowledgement when their
    // address is included on the webhook payload (see README §8).
    const memberEmail = (payload as { member_email?: unknown }).member_email;
    if (typeof memberEmail === "string" && memberEmail.includes("@")) {
      await sendEmail(
        memberEmail,
        "Booking request received — Rayhan Fitness",
        `<div style="font-family:Arial,sans-serif;background:#0A0A0A;color:#F5F5F5;padding:24px">
           <h2 style="color:#D4AF37">Request received ✅</h2>
           <p>Your ${esc(record.session_type)} request for ${esc(
             record.preferred_date
           )} (${esc(record.preferred_time_slot)}) is with our team.
           Track it under <strong>My Bookings</strong> in your dashboard.</p>
         </div>`
      );
    }
    return new Response(JSON.stringify({ sent: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-booking failed:", err);
    return new Response("Email send failed", { status: 502 });
  }
});
