"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, Clock, LogIn, LogOut, Timer } from "lucide-react";
import { api } from "@/lib/api";
import { mapPortalAttendanceRow } from "@/lib/attendance-mapper";
import { cn } from "@/lib/cn";
import {
  buildEmployeeAttendanceMonthGrid,
  clampAttendanceMonth,
  formatAttendanceMonthLabel,
  getCalendarCellClass,
  mergeAttendanceRecordsIntoGrid,
  mergeHolidaysIntoGrid,
  parseEmployeeJoinDate,
  summarizeAttendanceMonth,
  type CalendarAttendanceOverlay,
  type CalendarHolidayOverlay,
  type EmployeeAttendanceDay,
  type EmployeeAttendanceStatus,
} from "@/lib/employee-attendance";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";

const COMPACT_WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

const STATUS_BADGE: Record<EmployeeAttendanceStatus, string> = {
  Present: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Late: "bg-amber-100 text-amber-800 border-amber-200",
  Absent: "bg-rose-100 text-rose-800 border-rose-200",
  "Half Day": "bg-purple-100 text-purple-800 border-purple-200",
  "On Leave": "bg-blue-100 text-blue-800 border-blue-200",
  Holiday: "bg-violet-100 text-violet-800 border-violet-200",
  "Weekly Off": "bg-slate-200 text-slate-700 border-slate-300",
  Pending: "bg-amber-50 text-amber-900 border-amber-200",
  Future: "bg-slate-50 text-slate-400 border-slate-100",
  "Before Join": "bg-slate-50 text-slate-300 border-slate-100",
};

type ProfileMeta = {
  employeeId: string;
  joinDate?: string;
  shiftType?: string;
};

export function EmployeeAttendanceCalendar({
  showFullAttendanceLink = false,
  variant = "default",
  refreshKey = 0,
  className,
}: {
  showFullAttendanceLink?: boolean;
  /** Compact fixed-size card for the employee dashboard sidebar. */
  variant?: "default" | "dashboard";
  /** Bump to reload attendance from API (e.g. after punch in/out). */
  refreshKey?: number;
  className?: string;
}) {
  const isDashboard = variant === "dashboard";
  const today = useMemo(() => new Date(), []);
  const [profile, setProfile] = useState<ProfileMeta | null>(null);
  const [recordsByDate, setRecordsByDate] = useState<Map<string, CalendarAttendanceOverlay>>(
    new Map(),
  );
  const [holidaysByDate, setHolidaysByDate] = useState<Map<string, CalendarHolidayOverlay>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [prof, rows] = await Promise.all([
          api.get<Record<string, unknown>>("/api/employee-portal/profile"),
          api.get<Record<string, unknown>[]>("/api/employee-portal/attendance"),
        ]);
        setProfile({
          employeeId: String(prof.id ?? ""),
          joinDate: prof.joinDate ? String(prof.joinDate) : undefined,
          shiftType: prof.shiftType ? String(prof.shiftType) : "General Shift",
        });
        const map = new Map<string, CalendarAttendanceOverlay>();
        for (const row of rows) {
          const { iso, overlay } = mapPortalAttendanceRow(row);
          if (iso) map.set(iso, overlay);
        }
        setRecordsByDate(map);

        try {
          const holidayRows = await api.get<Record<string, unknown>[]>("/api/employee-portal/holidays");
          const holidayMap = new Map<string, CalendarHolidayOverlay>();
          for (const row of holidayRows) {
            const raw = String(row.holidayDate ?? "");
            const iso = /^\d{4}-\d{2}-\d{2}/.test(raw)
              ? raw.slice(0, 10)
              : (() => {
                  const parts = raw.split("/");
                  if (parts.length !== 3) return "";
                  const [day, month, year] = parts;
                  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
                })();
            if (!iso) continue;
            holidayMap.set(iso, { name: String(row.holidayName ?? "Holiday") });
          }
          setHolidaysByDate(holidayMap);
        } catch {
          setHolidaysByDate(new Map());
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  const parsedJoinDate = useMemo(
    () => parseEmployeeJoinDate(profile?.joinDate ?? today.toISOString().slice(0, 10)),
    [profile?.joinDate, today],
  );

  const joinLabel = parsedJoinDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const monthGrid = useMemo(() => {
    if (!profile?.employeeId) return [];
    const base = buildEmployeeAttendanceMonthGrid(
      profile.employeeId,
      viewYear,
      viewMonth,
      parsedJoinDate,
      profile.shiftType ?? "General Shift",
      today,
    );
    const withHolidays = mergeHolidaysIntoGrid(base, holidaysByDate);
    return mergeAttendanceRecordsIntoGrid(withHolidays, recordsByDate);
  }, [profile, viewYear, viewMonth, parsedJoinDate, today, recordsByDate, holidaysByDate]);

  const monthSummary = useMemo(() => summarizeAttendanceMonth(monthGrid), [monthGrid]);
  const calendarRows = Math.ceil(monthGrid.length / 7) || 5;
  const todayIso = useMemo(() => {
    const d = today;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, [today]);

  const selectedDay = useMemo(
    () => monthGrid.find((d) => d.iso === selectedDayIso) ?? null,
    [monthGrid, selectedDayIso],
  );

  useEffect(() => {
    const clamped = clampAttendanceMonth(
      today.getFullYear(),
      today.getMonth(),
      parsedJoinDate,
      today,
    );
    setViewYear(clamped.year);
    setViewMonth(clamped.month);
    setSelectedDayIso(null);
  }, [profile?.employeeId, parsedJoinDate, today]);

  if (loading) {
    return (
      <Card className={cn(isDashboard && "w-full p-5 shadow-sm", className)}>
        <LoadingState label="Loading attendance calendar…" />
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "flex flex-col",
        isDashboard && "w-full shrink-0 self-start p-5 shadow-sm",
        className,
      )}
    >
      <div className={cn("flex flex-col", isDashboard ? "gap-2.5" : "flex-1 space-y-3")}>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Calendar className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900">Attendance</h3>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
              {monthSummary.workingDays} working days · joined {joinLabel}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2">
          <MonthNav
            viewYear={viewYear}
            viewMonth={viewMonth}
            joinDate={parsedJoinDate}
            today={today}
            onChange={(y, m) => {
              setViewYear(y);
              setViewMonth(m);
              setSelectedDayIso(null);
            }}
          />
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-2">
          <div className="mb-1 grid shrink-0 grid-cols-7 gap-1">
            {COMPACT_WEEKDAY_LABELS.map((label, index) => (
              <div
                key={`${label}-${index}`}
                className="py-0.5 text-center text-[10px] font-semibold uppercase text-slate-400"
              >
                {label}
              </div>
            ))}
          </div>
          <div
            className="grid grid-cols-7 gap-1"
            style={
              isDashboard
                ? undefined
                : { gridTemplateRows: `repeat(${calendarRows}, minmax(0, 1fr))` }
            }
          >
            {monthGrid.map((day) => (
              <CalendarCell
                key={day.iso}
                day={day}
                isToday={day.iso === todayIso}
                selected={selectedDayIso === day.iso}
                compact={isDashboard}
                onSelect={() => {
                  if (!day.inMonth || day.status === "Before Join") {
                    return;
                  }
                  setSelectedDayIso(day.iso);
                }}
              />
            ))}
          </div>
        </div>

        {!isDashboard && selectedDay ? (
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">{selectedDay.label}</p>
              <StatusBadge status={selectedDay.status} />
            </div>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <DetailField icon={Clock} label="Shift" value={selectedDay.shift} />
              <DetailField icon={LogIn} label="In" value={selectedDay.checkIn} />
              <DetailField icon={LogOut} label="Out" value={selectedDay.checkOut} />
              <DetailField
                icon={Timer}
                label="Hours"
                value={`${selectedDay.workedHours.toFixed(1)} hrs`}
              />
            </dl>
          </div>
        ) : null}

        <div className="grid shrink-0 grid-cols-2 gap-x-3 gap-y-1.5">
          <LegendDot className="bg-emerald-600" label="Present" />
          <LegendDot className="bg-sky-300" label="Leave" />
          <LegendDot className="bg-amber-100 border border-amber-300" label="Pending" />
          <LegendDot className="bg-rose-300" label="Absent" />
          <LegendDot className="bg-violet-300" label="Holiday" />
        </div>

        {showFullAttendanceLink ? (
          <div
            className={cn(
              "shrink-0 border-t border-slate-100 pt-2 text-center",
              !isDashboard && "mt-auto",
            )}
          >
            <Link
              href="/attendance"
              className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Full attendance →
            </Link>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: EmployeeAttendanceStatus }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-bold",
        STATUS_BADGE[status],
      )}
    >
      {status}
    </span>
  );
}

function DetailField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 ring-1 ring-slate-100">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      <div>
        <dt className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </dt>
        <dd className="text-xs font-medium text-slate-800">{value}</dd>
      </div>
    </div>
  );
}

function CalendarCell({
  day,
  isToday = false,
  selected,
  compact = false,
  onSelect,
}: {
  day: EmployeeAttendanceDay;
  isToday?: boolean;
  selected: boolean;
  compact?: boolean;
  onSelect: () => void;
}) {
  if (!day.inMonth) {
    return <span className="flex aspect-square w-full rounded-md" aria-hidden />;
  }

  const interactive = day.status !== "Before Join";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!interactive}
      title={
        interactive
          ? `${day.label} — ${day.status}`
          : day.status === "Before Join"
            ? "Before joining date"
            : undefined
      }
      className={cn(
        "flex w-full items-center justify-center rounded-lg font-semibold transition-all",
        compact ? "aspect-square text-[10px]" : "aspect-square rounded-md text-[10px]",
        getCalendarCellClass(day.status, day.inMonth),
        interactive ? "cursor-pointer hover:brightness-95 active:scale-95" : "cursor-default",
        isToday && "ring-2 ring-emerald-700 ring-offset-1 shadow-sm",
        selected && !isToday && "shadow-sm ring-2 ring-emerald-600 ring-offset-1",
        selected && isToday && "ring-2 ring-emerald-800 ring-offset-2",
      )}
    >
      {day.day}
    </button>
  );
}

function MonthNav({
  viewYear,
  viewMonth,
  joinDate,
  today,
  onChange,
}: {
  viewYear: number;
  viewMonth: number;
  joinDate: Date;
  today: Date;
  onChange: (year: number, month: number) => void;
}) {
  const clamped = clampAttendanceMonth(viewYear, viewMonth, joinDate, today);
  const canPrev =
    clamped.year > joinDate.getFullYear() ||
    (clamped.year === joinDate.getFullYear() && clamped.month > joinDate.getMonth());
  const canNext =
    clamped.year < today.getFullYear() ||
    (clamped.year === today.getFullYear() && clamped.month < 11);

  const go = (delta: number) => {
    let y = clamped.year;
    let m = clamped.month + delta;
    if (m < 0) {
      y -= 1;
      m = 11;
    } else if (m > 11) {
      y += 1;
      m = 0;
    }
    const next = clampAttendanceMonth(y, m, joinDate, today);
    onChange(next.year, next.month);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => go(-1)}
        disabled={!canPrev}
        className={cn(
          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white transition-colors",
          canPrev ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-40",
        )}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-0 flex-1 truncate text-center text-xs font-semibold text-slate-900">
        {formatAttendanceMonthLabel(clamped.year, clamped.month)}
      </span>
      <button
        type="button"
        onClick={() => go(1)}
        disabled={!canNext}
        className={cn(
          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white transition-colors",
          canNext ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-40",
        )}
        aria-label="Next month"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500">
      <span className={cn("h-2 w-2 rounded-full", className)} />
      {label}
    </span>
  );
}
