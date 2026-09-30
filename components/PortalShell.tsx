"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  CalendarRange,
  Clock,
  CreditCard,
  LayoutGrid,
  LogOut,
  Repeat,
  Timer,
  User,
} from "lucide-react";
import { logoutSession, type AuthUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/attendance", label: "My Attendance", icon: Clock },
  { href: "/schedule", label: "My Schedule", icon: Repeat },
  { href: "/leave", label: "Leave", icon: Calendar },
  { href: "/holidays", label: "Holidays", icon: CalendarRange },
  { href: "/overtime", label: "Overtime", icon: Timer },
  { href: "/payslips", label: "Payslips", icon: CreditCard },
  { href: "/profile", label: "Profile", icon: User },
];

export function PortalShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const emp = user.employee;

  function onLogout() {
    logoutSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-sm font-black text-white shadow-sm">
              HR
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                Employee Portal
              </p>
              <h1 className="text-base font-bold text-slate-900 sm:text-lg">
                Employee Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 ring-2 ring-emerald-200">
                {user.initials}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-[11px] text-slate-500">
                  {emp?.empCode ?? user.role}
                  {emp?.designation ? ` · ${emp.designation}` : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        <nav
          aria-label="Employee portal navigation"
          className="mx-auto flex max-w-7xl gap-0.5 overflow-x-auto px-4 scrollbar-none sm:gap-1 sm:px-6"
        >
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4",
                  active
                    ? "border-emerald-700 text-emerald-700"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
