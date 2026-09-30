"use client";

import Link from "next/link";
import { ArrowRight, LogIn, LogOut, Sun, Timer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/cn";

type TodayShift = {
  shiftName?: string;
  startTime?: string;
  endTime?: string;
};

type TodayAttendance = {
  attendanceStatus?: string;
  punchIn?: string;
  punchOut?: string;
  workedHours?: number;
};

function formatTime(value?: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function TodayPunchBanner({
  shift,
  shiftFallback,
  attendance,
  canPunchIn,
  canPunchOut,
  punchLoading,
  onPunchIn,
  onPunchOut,
  variant = "default",
  className,
}: {
  shift: TodayShift | null;
  shiftFallback?: string;
  attendance: TodayAttendance | null;
  canPunchIn: boolean;
  canPunchOut: boolean;
  punchLoading: boolean;
  onPunchIn: () => void;
  onPunchOut: () => void;
  variant?: "default" | "header";
  className?: string;
}) {
  const isHeader = variant === "header";
  const shiftName = shift?.shiftName ?? shiftFallback ?? "No shift assigned";
  const shiftHours =
    shift?.startTime && shift?.endTime ? `${shift.startTime} – ${shift.endTime}` : null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 shadow-sm",
        className,
      )}
    >
      <div className={cn("space-y-3", isHeader ? "p-4" : "space-y-4 p-4 sm:p-5")}>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20",
              isHeader ? "h-9 w-9" : "h-11 w-11",
            )}
          >
            <Sun className={cn(isHeader ? "h-4 w-4" : "h-5 w-5")} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-100">
              Today&apos;s shift
            </p>
            <p
              className={cn(
                "font-bold leading-snug text-white break-words",
                isHeader ? "text-sm" : "text-lg",
              )}
            >
              {shiftName}
            </p>
            {shiftHours ? (
              <p className={cn("text-emerald-50", isHeader ? "mt-0.5 text-xs" : "mt-0.5 text-sm")}>
                {shiftHours}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {attendance?.attendanceStatus ? (
            <StatusBadge label={attendance.attendanceStatus} />
          ) : null}

          {(attendance?.punchIn || attendance?.workedHours) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-emerald-50">
              {attendance.punchIn ? (
                <span>
                  In <strong className="text-white">{formatTime(attendance.punchIn)}</strong>
                </span>
              ) : null}
              {attendance.punchOut ? (
                <span>
                  Out <strong className="text-white">{formatTime(attendance.punchOut)}</strong>
                </span>
              ) : null}
              {attendance.workedHours != null && attendance.workedHours > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Timer className="h-3.5 w-3.5" />
                  <strong className="text-white">{attendance.workedHours.toFixed(1)}h</strong>
                </span>
              ) : null}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="none"
            disabled={!canPunchIn || punchLoading}
            onClick={onPunchIn}
            className="w-full border-0 bg-white text-emerald-800 shadow-xs hover:bg-emerald-50 focus:ring-emerald-500 disabled:bg-white/70 disabled:text-emerald-800/60 disabled:opacity-100"
          >
            <LogIn className="h-4 w-4" />
            Punch in
          </Button>
          <Button
            variant="none"
            disabled={!canPunchOut || punchLoading}
            onClick={onPunchOut}
            className="w-full border border-white/25 bg-white/15 text-white shadow-xs hover:bg-white/25 focus:ring-white/40 disabled:bg-white/10 disabled:text-white/50 disabled:opacity-100"
          >
            <LogOut className="h-4 w-4" />
            Punch out
          </Button>
        </div>
      </div>

      {!shift && !isHeader ? (
        <div className="border-t border-white/10 px-5 py-2 text-xs text-emerald-100">
          No active shift for today.{" "}
          <Link
            href="/schedule"
            className="font-semibold text-white underline-offset-2 hover:underline"
          >
            View schedule
            <ArrowRight className="ml-0.5 inline h-3 w-3" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
