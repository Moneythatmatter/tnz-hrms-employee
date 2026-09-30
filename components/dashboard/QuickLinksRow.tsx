"use client";

import Link from "next/link";
import {
  CalendarCheck,
  CalendarDays,
  Clock,
  Banknote,
  Palmtree,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/attendance", label: "Attendance", icon: CalendarCheck, tone: "text-emerald-700 bg-emerald-50" },
  { href: "/leave", label: "Leave", icon: Palmtree, tone: "text-amber-700 bg-amber-50" },
  { href: "/schedule", label: "Schedule", icon: Clock, tone: "text-blue-700 bg-blue-50" },
  { href: "/holidays", label: "Holidays", icon: CalendarDays, tone: "text-violet-700 bg-violet-50" },
  { href: "/overtime", label: "Overtime", icon: Timer, tone: "text-purple-700 bg-purple-50" },
  { href: "/payslips", label: "Payslips", icon: Banknote, tone: "text-slate-700 bg-slate-100" },
] as const;

export function QuickLinksRow({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6", className)}>
      {LINKS.map(({ href, label, icon: Icon, tone }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tone)}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </div>
  );
}
