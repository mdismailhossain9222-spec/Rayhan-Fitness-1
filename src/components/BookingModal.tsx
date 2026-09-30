"use client";

/**
 * BookingModal — Framer Motion animated trainer booking dialog.
 * Dark & Gold themed: trainer auto-filled, branch picker, date picker
 * (past dates disabled), time-slot chips, session-type dropdown, note.
 * Inserts into `bookings` via the unified data layer + success animation.
 */

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Dumbbell,
  MessageSquareText,
  CheckCircle2,
  Loader2,
  User,
} from "lucide-react";
import {
  createBooking,
  todayISO,
  TIME_SLOTS,
  SESSION_TYPES,
  DEMO_BRANCHES,
  type TrainerRow,
} from "@/lib/bookings";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: TrainerRow | null;
  memberId: string;
  memberName: string;
  onBooked?: () => void;
  notifySuccess?: (title: string, message: string) => void;
  notifyError?: (title: string, message: string) => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  trainer,
  memberId,
  memberName,
  onBooked,
  notifySuccess,
  notifyError,
}: BookingModalProps) {
  const [branchId, setBranchId] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<string>("");
  const [sessionType, setSessionType] = useState<string>(SESSION_TYPES[0]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Reset + auto-fill whenever a new trainer is selected.
  useEffect(() => {
    if (trainer && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBranchId(trainer.branch_id ?? trainer.branch_slug ?? "");
      setDate("");
      setSlot("");
      setSessionType(SESSION_TYPES[0]);
      setNote("");
      setLoading(false);
      setDone(false);
      setError("");
    }
  }, [trainer, isOpen]);

  // Escape closes + lock background scroll.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  const slots = useMemo(() => {
    const custom = trainer?.availability?.slots;
    if (Array.isArray(custom) && custom.length > 0) {
      return custom.filter((s): s is string => typeof s === "string");
    }
    return [...TIME_SLOTS];
  }, [trainer]);

  if (!trainer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createBooking(
        {
          trainer_id: trainer.id,
          branch_id: branchId,
          session_type: sessionType,
          preferred_date: date,
          preferred_time_slot: slot,
          note: note || undefined,
        },
        { id: memberId, name: memberName }
      );
      setDone(true);
      notifySuccess?.(
        "Booking request sent!",
        `${trainer.name} will confirm shortly.`
      );
      onBooked?.();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not send your booking.";
      setError(msg);
      notifyError?.("Booking failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="booking-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Book ${trainer.name}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg iron-glass-card rounded-sm border border-[#D4AF37]/60 p-6 sm:p-8 shadow-[0_0_60px_rgba(212,175,55,0.22)] max-h-[92vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close booking dialog"
              className="absolute top-4 right-4 min-w-[44px] min-h-[44px] p-2 rounded-sm bg-[#151515] border border-[#2A2A2A] text-[#B3B3B3] hover:text-white hover:border-[#D4AF37] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-center py-8 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/50 flex items-center justify-center mx-auto shadow-[0_0_36px_rgba(16,185,129,0.35)]"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </motion.div>
                <h3 className="font-display text-4xl text-white tracking-wider uppercase">
                  Booking request sent!
                </h3>
                <p className="text-sm text-[#B3B3B3] max-w-sm mx-auto leading-relaxed">
                  <strong className="text-white">{trainer.name}</strong> will
                  confirm shortly. Track the status any time in your dashboard
                  under <strong className="text-[#D4AF37]">My Bookings</strong>.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-crimson-primary px-8 py-3 min-h-[44px] rounded-sm text-xs font-bold uppercase tracking-[0.18em]"
                >
                  Done
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex items-center gap-4">
                  {trainer.photo_url ? (
                    <img
                      src={trainer.photo_url}
                      alt={trainer.name}
                      loading="lazy"
                      decoding="async"
                      className="w-16 h-16 rounded-sm object-cover border border-[#D4AF37]/50"
                    />
                  ) : (
                    <span className="w-16 h-16 rounded-sm bg-[#1a1a1a] border border-[#D4AF37]/50 flex items-center justify-center">
                      <User className="w-7 h-7 text-[#D4AF37]" />
                    </span>
                  )}
                  <div>
                    <span className="font-mono-tech text-[11px] text-[#D4AF37] uppercase tracking-[0.2em]">
                      Book this trainer
                    </span>
                    <h3 className="font-display text-3xl text-white tracking-wider uppercase leading-none mt-1">
                      {trainer.name}
                    </h3>
                    <p className="text-xs text-[#B3B3B3] mt-1">
                      {trainer.specialty ?? "Personal Trainer"}
                      {trainer.branch_name ? ` · ${trainer.branch_name}` : ""}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-sm bg-red-950/60 border border-red-500 text-xs text-red-200">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="bk-branch"
                      className="flex items-center gap-1.5 text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> Branch
                    </label>
                    <select
                      id="bk-branch"
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      required
                      className="w-full h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                    >
                      <option value="" disabled>
                        Select branch
                      </option>
                      {DEMO_BRANCHES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                      {trainer.branch_id &&
                        !DEMO_BRANCHES.some((b) => b.id === trainer.branch_id) && (
                          <option value={trainer.branch_id}>
                            {trainer.branch_name ?? "Trainer home branch"}
                          </option>
                        )}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="bk-session"
                      className="flex items-center gap-1.5 text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5"
                    >
                      <Dumbbell className="w-3.5 h-3.5 text-[#D4AF37]" /> Session
                      type
                    </label>
                    <select
                      id="bk-session"
                      value={sessionType}
                      onChange={(e) => setSessionType(e.target.value)}
                      className="w-full h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                    >
                      {SESSION_TYPES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="bk-date"
                    className="flex items-center gap-1.5 text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" /> Preferred
                    date
                  </label>
                  <input
                    id="bk-date"
                    type="date"
                    required
                    value={date}
                    min={todayISO()}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white focus:border-[#D4AF37] focus:outline-none [color-scheme:dark]"
                  />
                </div>

                <div>
                  <span className="flex items-center gap-1.5 text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]" /> Preferred
                    time slot
                  </span>
                  <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Time slot">
                    {slots.map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={slot === s}
                        onClick={() => setSlot(s)}
                        className={`px-4 py-3 min-h-[48px] rounded-sm text-left text-xs font-mono-tech border transition-all ${
                          slot === s
                            ? "bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-[0_0_16px_rgba(212,175,55,0.25)]"
                            : "bg-[#111111] border-[#2A2A2A] text-[#B3B3B3] hover:text-white hover:border-[#3D3D3D]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="bk-note"
                    className="flex items-center gap-1.5 text-[11px] font-mono-tech uppercase text-[#B3B3B3] mb-1.5"
                  >
                    <MessageSquareText className="w-3.5 h-3.5 text-[#D4AF37]" />{" "}
                    Note <span className="text-[#B3B3B3]/60">(optional)</span>
                  </label>
                  <textarea
                    id="bk-note"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={600}
                    placeholder="e.g. First time, want to focus on weight loss…"
                    className="w-full p-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-sm text-white placeholder:text-[#B3B3B3]/50 focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !slot || !date || !branchId}
                  className="w-full btn-crimson-primary py-4 min-h-[52px] rounded-sm text-xs font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {loading ? "Sending request…" : "Confirm booking"}
                  </span>
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
