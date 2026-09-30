"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Coffee, Gift, Repeat, Sun } from "lucide-react";
import { api } from "@/lib/api";
import { WeeklyScheduleGrid } from "@/components/schedule/WeeklyScheduleGrid";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScheduleShiftCard } from "@/components/ui/ScheduleShiftCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

type ScheduleData = {
  shifts: Array<{
    shiftName?: string;
    startTime?: string;
    endTime?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    status?: string;
  }>;
  weeklyOffs: Array<{
    offType?: string;
    days?: string[];
    fixedDay?: string;
    rotationPattern?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    status?: string;
  }>;
};

type HolidayRow = {
  holidayName: string;
  holidayDate: string;
};

const DAY_ABBR: Record<string, string> = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
};

function formatHolidayDate(value: string): string {
  const iso = value.slice(0, 10);
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function formatOffDays(weeklyOff: ScheduleData["weeklyOffs"][number]): string[] {
  const raw = weeklyOff.days?.length
    ? weeklyOff.days
    : weeklyOff.fixedDay
      ? weeklyOff.fixedDay.split(/[,/&]+/)
      : [];
  return raw.map((d) => DAY_ABBR[d.trim().toLowerCase()] ?? d.trim()).filter(Boolean);
}

export default function SchedulePage() {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [holidays, setHolidays] = useState<HolidayRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const year = new Date().getFullYear();
    void Promise.all([
      api.get<ScheduleData>("/api/employee-portal/schedule"),
      api.get<HolidayRow[]>(`/api/employee-portal/holidays?year=${year}`).catch(() => []),
    ])
      .then(([schedule, holidayRows]) => {
        setData(schedule);
        setHolidays(holidayRows);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const activeShift =
    data?.shifts.find((s) => s.status?.toLowerCase() === "active") ?? data?.shifts[0];
  const activeWeeklyOff =
    data?.weeklyOffs.find((w) => w.status?.toLowerCase() === "active") ?? data?.weeklyOffs[0];
  const offDayLabels = activeWeeklyOff ? formatOffDays(activeWeeklyOff) : [];

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of holidays) {
      const iso = h.holidayDate.slice(0, 10);
      if (iso) map.set(iso, h.holidayName);
    }
    return map;
  }, [holidays]);

  const upcomingHolidays = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return holidays
      .filter((h) => h.holidayDate.slice(0, 10) >= today)
      .sort((a, b) => a.holidayDate.localeCompare(b.holidayDate))
      .slice(0, 4);
  }, [holidays]);

  if (loading) return <LoadingState label="Loading schedule…" />;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Schedule"
        title="My Schedule"
        description="Shift assignments, working hours, and weekly off configuration."
      />
      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="This week"
              subtitle="Your shift plan for the current week"
              action={
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <CalendarDays className="h-4 w-4" />
                </div>
              }
            />
            <WeeklyScheduleGrid
              shifts={data?.shifts ?? []}
              weeklyOffs={data?.weeklyOffs ?? []}
              holidaysByDate={holidaysByDate}
            />
          </Card>

          <Card>
            <CardHeader
              title="Shift assignments"
              subtitle="Active and upcoming roster entries"
              action={
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Repeat className="h-4 w-4" />
                </div>
              }
            />
            <div className="space-y-2">
              {(data?.shifts ?? []).map((s, i) => (
                <ScheduleShiftCard key={i} {...s} />
              ))}
              {!data?.shifts?.length ? (
                <EmptyState message="No shift assignments found." />
              ) : null}
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-28">
          <Card className="overflow-hidden p-0">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 py-4 text-white">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Sun className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-100">
                    Current shift
                  </p>
                  <p className="mt-0.5 truncate text-lg font-bold">
                    {activeShift?.shiftName ?? "Not assigned"}
                  </p>
                  <p className="mt-1 text-sm text-emerald-50">
                    {activeShift?.startTime && activeShift?.endTime
                      ? `${activeShift.startTime} – ${activeShift.endTime}`
                      : "No timing set"}
                  </p>
                </div>
              </div>
              {activeShift?.status ? (
                <div className="mt-3">
                  <StatusBadge label={activeShift.status} />
                </div>
              ) : null}
            </div>
            {activeShift?.effectiveFrom ? (
              <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
                Effective {activeShift.effectiveFrom.slice(0, 10)} →{" "}
                {activeShift.effectiveTo?.slice(0, 10) ?? "ongoing"}
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHeader
              title="Weekly off"
              subtitle="Rest day configuration"
              action={
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Coffee className="h-4 w-4" />
                </div>
              }
            />
            {(data?.weeklyOffs ?? []).length ? (
              <div className="space-y-2">
                {(data?.weeklyOffs ?? []).map((w, i) => {
                  const days = formatOffDays(w);
                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-100 bg-gradient-to-br from-white to-blue-50/40 px-3.5 py-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {w.offType ?? "Weekly off"}
                          </p>
                          {days.length ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {days.map((day) => (
                                <span
                                  key={day}
                                  className="inline-flex items-center rounded-lg bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800"
                                >
                                  {day}
                                </span>
                              ))}
                            </div>
                          ) : w.rotationPattern ? (
                            <p className="mt-1.5 text-xs text-slate-600">{w.rotationPattern}</p>
                          ) : (
                            <p className="mt-1.5 text-xs text-slate-500">No fixed days set</p>
                          )}
                        </div>
                        {w.status ? <StatusBadge label={w.status} /> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="No weekly off schedule found." />
            )}
            {offDayLabels.length ? (
              <p className="mt-3 text-xs text-slate-500">
                Regular rest:{" "}
                <span className="font-semibold text-slate-700">{offDayLabels.join(", ")}</span>
              </p>
            ) : null}
          </Card>

          <Card>
            <CardHeader
              title="Upcoming holidays"
              subtitle="Official offs on the calendar"
              action={
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <Gift className="h-4 w-4" />
                </div>
              }
            />
            {upcomingHolidays.length ? (
              <ul className="space-y-2">
                {upcomingHolidays.map((h) => (
                  <li
                    key={h.holidayDate + h.holidayName}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                  >
                    <span className="truncate text-sm font-medium text-slate-800">
                      {h.holidayName}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-violet-700">
                      {formatHolidayDate(h.holidayDate)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="No upcoming holidays." />
            )}
            <Link
              href="/holidays"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              View full calendar
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
