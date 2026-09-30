"use client";

import { Coffee, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export type WeekShift = {
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  status?: string;
};

export type WeekWeeklyOff = {
  offType?: string;
  days?: string[];
  fixedDay?: string;
  status?: string;
};

function toLocalIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getWeekStartMonday(ref: Date): Date {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d;
}

function parseOffDayIndexes(weeklyOffs: WeekWeeklyOff[]): Set<number> {
  const indexes = new Set<number>();
  for (const row of weeklyOffs) {
    if (row.status && row.status.toLowerCase() !== "active") continue;
    const rawDays = row.days?.length
      ? row.days
      : row.fixedDay
        ? row.fixedDay.split(/[,/&]+/)
        : [];
    for (const day of rawDays) {
      const key = day.trim().toLowerCase();
      if (key in DAY_NAME_TO_INDEX) indexes.add(DAY_NAME_TO_INDEX[key]);
    }
  }
  return indexes;
}

function isShiftActiveOnDate(shift: WeekShift, iso: string): boolean {
  const from = shift.effectiveFrom?.slice(0, 10);
  const to = shift.effectiveTo?.slice(0, 10);
  if (from && iso < from) return false;
  if (to && to !== "—" && iso > to) return false;
  const status = shift.status?.toLowerCase();
  if (status && status !== "active") return false;
  return true;
}

function pickShiftForDate(shifts: WeekShift[], iso: string): WeekShift | null {
  return shifts.find((s) => isShiftActiveOnDate(s, iso)) ?? shifts[0] ?? null;
}

export function buildWeekSchedule(
  shifts: WeekShift[],
  weeklyOffs: WeekWeeklyOff[],
  holidaysByDate: Map<string, string>,
  ref = new Date(),
) {
  const todayIso = toLocalIso(ref);
  const weekStart = getWeekStartMonday(ref);
  const offDays = parseOffDayIndexes(weeklyOffs);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const iso = toLocalIso(date);
    const dow = date.getDay();
    const holidayName = holidaysByDate.get(iso);
    const isWeeklyOff = offDays.has(dow);
    const shift = pickShiftForDate(shifts, iso);

    let kind: "holiday" | "off" | "work" = "work";
    if (holidayName) kind = "holiday";
    else if (isWeeklyOff) kind = "off";

    return {
      iso,
      date,
      weekdayLabel: WEEKDAY_LABELS[i],
      dayNum: date.getDate(),
      monthLabel: date.toLocaleDateString("en-GB", { month: "short" }),
      isToday: iso === todayIso,
      kind,
      holidayName,
      shift,
    };
  });

  const workingDays = days.filter((d) => d.kind === "work").length;
  const offDaysCount = days.filter((d) => d.kind === "off").length;
  const holidayCount = days.filter((d) => d.kind === "holiday").length;

  return { days, workingDays, offDaysCount, holidayCount, weekLabel: formatWeekLabel(weekStart) };
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const start = weekStart.toLocaleDateString("en-GB", {
    day: "numeric",
    month: sameMonth ? undefined : "short",
  });
  const end = weekEnd.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${start} – ${end}`;
}

export function WeeklyScheduleGrid({
  shifts,
  weeklyOffs,
  holidaysByDate,
}: {
  shifts: WeekShift[];
  weeklyOffs: WeekWeeklyOff[];
  holidaysByDate: Map<string, string>;
}) {
  const schedule = buildWeekSchedule(shifts, weeklyOffs, holidaysByDate);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{schedule.weekLabel}</p>
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
          <span>{schedule.workingDays} working</span>
          <span>·</span>
          <span>{schedule.offDaysCount} off</span>
          {schedule.holidayCount > 0 ? (
            <>
              <span>·</span>
              <span>{schedule.holidayCount} holiday</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {schedule.days.map((day) => (
          <div
            key={day.iso}
            className={cn(
              "flex min-h-[108px] flex-col rounded-xl border px-2.5 py-2.5 transition-colors",
              day.isToday
                ? "border-emerald-300 bg-emerald-50/80 ring-2 ring-emerald-600 ring-offset-1"
                : day.kind === "off"
                  ? "border-blue-100 bg-blue-50/50"
                  : day.kind === "holiday"
                    ? "border-violet-100 bg-violet-50/50"
                    : "border-slate-100 bg-slate-50/40",
            )}
          >
            <div className="flex items-center justify-between gap-1">
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wide",
                  day.isToday ? "text-emerald-700" : "text-slate-400",
                )}
              >
                {day.weekdayLabel}
              </span>
              {day.isToday ? (
                <span className="rounded bg-emerald-600 px-1 py-0.5 text-[8px] font-bold uppercase text-white">
                  Today
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm font-bold text-slate-900">
              {day.dayNum}{" "}
              <span className="text-[10px] font-semibold text-slate-500">{day.monthLabel}</span>
            </p>

            <div className="mt-auto pt-2">
              {day.kind === "holiday" ? (
                <>
                  <p className="text-[10px] font-semibold text-violet-800">Holiday</p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-violet-600">
                    {day.holidayName}
                  </p>
                </>
              ) : day.kind === "off" ? (
                <div className="flex items-center gap-1 text-blue-700">
                  <Coffee className="h-3 w-3 shrink-0" />
                  <p className="text-[10px] font-semibold">Weekly off</p>
                </div>
              ) : day.shift ? (
                <>
                  <div className="flex items-center gap-1 text-emerald-700">
                    <Sun className="h-3 w-3 shrink-0" />
                    <p className="truncate text-[10px] font-semibold">
                      {day.shift.shiftName ?? "Shift"}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-600">
                    {day.shift.startTime ?? "—"} – {day.shift.endTime ?? "—"}
                  </p>
                </>
              ) : (
                <p className="text-[10px] text-slate-400">No shift</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
