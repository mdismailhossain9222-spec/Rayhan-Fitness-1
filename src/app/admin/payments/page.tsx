"use client";

/**
 * /admin/payments — transaction history + membership ledger.
 * Read-only: payment rows are written only by the verified server webhook.
 */

import React, { useMemo, useState } from "react";
import { Banknote } from "lucide-react";
import AdminGuard, { AdminSkeleton, DemoNotice } from "@/components/admin/AdminGuard";
import { useAdminData } from "@/hooks/useAdminData";

export default function AdminPaymentsPage() {
  return (
    <AdminGuard>
      <PaymentsInner />
    </AdminGuard>
  );
}

function PaymentsInner() {
  const { loading, isDemo, payments, memberships, legacyAdmin, demoAdminLogin } =
    useAdminData();
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");

  const filtered = useMemo(() => {
    let rows = [...payments];
    if (status !== "all") rows = rows.filter((p) => p.status === status);
    if (method !== "all") rows = rows.filter((p) => p.method === method);
    return rows;
  }, [payments, status, method]);

  const totalPaid = useMemo(
    () =>
      payments
        .filter((p) => p.status === "paid")
        .reduce((s, p) => s + (Number(p.amount) || 0), 0),
    [payments]
  );

  if (loading) return <AdminSkeleton />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-mono-tech text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
            {filtered.length} transactions
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wider uppercase">
            Payments
          </h1>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 rounded-sm bg-[#111111] border border-[#D4AF37]/40">
          <Banknote className="w-6 h-6 text-[#D4AF37]" />
          <div>
            <div className="font-display text-2xl text-white leading-none">
              ৳{totalPaid.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono-tech uppercase tracking-widest text-[#B3B3B3]">
              Total collected
            </div>
          </div>
        </div>
      </div>

      {isDemo && !legacyAdmin && <DemoNotice onLogin={demoAdminLogin} />}

      <div className="flex flex-wrap gap-3">
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-xs text-white"
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select
          aria-label="Filter by method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="h-11 px-3 rounded-sm bg-[#111111] border border-[#2A2A2A] text-xs text-white"
        >
          <option value="all">All methods</option>
          <option value="bkash">bKash</option>
          <option value="nagad">Nagad</option>
          <option value="card">Card</option>
          <option value="bKash">bKash (legacy)</option>
          <option value="Nagad">Nagad (legacy)</option>
          <option value="Card">Card (legacy)</option>
        </select>
      </div>

      <div className="rounded-sm bg-[#111111] border border-[#2A2A2A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-tech min-w-[720px]">
            <thead>
              <tr className="border-b border-[#2A2A2A] text-[#B3B3B3]">
                <th className="p-4">TRANSACTION</th>
                <th className="p-4">METHOD</th>
                <th className="p-4">AMOUNT</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-[#D4AF37]/5 transition-colors">
                  <td className="p-4 text-white font-bold">{p.txn}</td>
                  <td className="p-4 text-[#B3B3B3] uppercase">{p.method}</td>
                  <td className="p-4 text-white font-bold">
                    ৳{Number(p.amount).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-sm border text-[10px] font-bold uppercase tracking-widest ${
                        p.status === "paid"
                          ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400"
                          : p.status === "failed"
                            ? "bg-red-500/10 border-red-500/40 text-red-400/90"
                            : "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#E8C766]"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-[#B3B3B3]">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#B3B3B3]">
                    No transactions match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-sm bg-[#111111] border border-[#2A2A2A] overflow-hidden">
        <div className="p-4 border-b border-[#2A2A2A] font-mono-tech text-xs text-[#D4AF37] uppercase tracking-widest">
          Membership ledger ({memberships.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-tech min-w-[640px]">
            <thead>
              <tr className="border-b border-[#2A2A2A] text-[#B3B3B3]">
                <th className="p-4">BRANCH</th>
                <th className="p-4">PERIOD</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">PAYMENT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {memberships.slice(0, 50).map((m) => (
                <tr key={m.id} className="hover:bg-[#D4AF37]/5 transition-colors">
                  <td className="p-4 text-white">{m.branch_name}</td>
                  <td className="p-4 text-[#B3B3B3]">
                    {(m.start || "").slice(0, 10)} → {(m.end || "").slice(0, 10)}
                  </td>
                  <td className="p-4 text-emerald-400 uppercase">{m.status}</td>
                  <td className="p-4 text-[#D4AF37] uppercase">{m.payment_status}</td>
                </tr>
              ))}
              {memberships.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#B3B3B3]">
                    No memberships yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
