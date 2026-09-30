"use client";

import { Palmtree, Stethoscope, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

type LeaveBalance = { casual?: number; sick?: number; earned?: number };

const BALANCE_ITEMS = [
  { key: "casual" as const, label: "Casual (CL)", icon: Sun, bar: "bg-amber-400", chip: "bg-amber-50 text-amber-800" },
  { key: "sick" as const, label: "Sick (SL)", icon: Stethoscope, bar: "bg-rose-400", chip: "bg-rose-50 text-rose-800" },
  { key: "earned" as const, label: "Earned (EL)", icon: Palmtree, bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-800" },
];

export function LeaveBalanceSummary({ balance }: { balance: LeaveBalance }) {
  const casual = balance.casual ?? 0;
  const sick = balance.sick ?? 0;
  const earned = balance.earned ?? 0;
  const total = casual + sick + earned;

  const segments = [
    { value: casual, className: "bg-amber-400" },
    { value: sick, className: "bg-rose-400" },
    { value: earned, className: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-4 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-100">
          Total leave balance
        </p>
        <p className="mt-1 text-3xl font-black">{total}</p>
        <p className="mt-0.5 text-sm text-emerald-50">days available across all types</p>
      </div>

      {total > 0 ? (
        <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
          {segments.map((seg, i) =>
            seg.value > 0 ? (
              <div
                key={i}
                className={cn("h-full transition-all", seg.className)}
                style={{ width: `${(seg.value / total) * 100}%` }}
              />
            ) : null,
          )}
        </div>
      ) : null}

      <div className="space-y-2">
        {BALANCE_ITEMS.map(({ key, label, icon: Icon, chip }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", chip)}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-slate-700">{label}</span>
            </div>
            <span className="text-lg font-bold text-slate-900">{balance[key] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
