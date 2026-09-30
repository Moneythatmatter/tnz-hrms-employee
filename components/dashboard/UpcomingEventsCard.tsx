"use client";

import Link from "next/link";
import { ArrowRight, Cake, CalendarRange, Gift } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type UpcomingBirthday = {
  id: string;
  name: string;
  avatar: string;
  department: string;
  displayDate: string;
  daysUntil: number;
};

export type UpcomingHolidayPreview = {
  id: string;
  title: string;
  displayDate: string;
  dayOfWeek?: string;
  category?: string;
  daysUntil: number;
};

export function UpcomingEventsCard({
  birthdays,
  holidays,
  className,
}: {
  birthdays: UpcomingBirthday[];
  holidays: UpcomingHolidayPreview[];
  className?: string;
}) {
  const hasBirthdays = birthdays.length > 0;
  const hasHolidays = holidays.length > 0;

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader
        title="Upcoming events"
        subtitle="Birthdays and holidays at your property"
      />

      <div className="flex flex-1 flex-col space-y-3">
        <section>
          <div className="mb-2 flex items-center gap-2">
            <Cake className="h-4 w-4 text-amber-600" />
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Birthdays
            </h4>
          </div>
          {hasBirthdays ? (
            <ul className="space-y-2">
              {birthdays.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[10px] font-bold text-amber-900">
                      {item.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500">{item.department}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-semibold text-slate-700">
                      {item.displayDate}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {item.daysUntil === 0
                        ? "Today"
                        : item.daysUntil === 1
                          ? "Tomorrow"
                          : `In ${item.daysUntil} days`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-3 py-3 text-center text-xs text-slate-500">
              No upcoming birthdays in the next 60 days.
            </p>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-violet-600" />
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Holidays
              </h4>
            </div>
            <Link
              href="/holidays"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {hasHolidays ? (
            <ul className="space-y-2">
              {holidays.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {item.category ?? "Holiday"}
                      {item.dayOfWeek ? ` · ${item.dayOfWeek}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-semibold text-slate-700">
                      {item.displayDate}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {item.daysUntil === 0
                        ? "Today"
                        : item.daysUntil === 1
                          ? "Tomorrow"
                          : `In ${item.daysUntil} days`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-3 py-3 text-center text-xs text-slate-500">
              No upcoming holidays scheduled.
            </p>
          )}
        </section>

        <Link
          href="/holidays"
          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <CalendarRange className="h-4 w-4 text-emerald-600" />
          Open holiday calendar
        </Link>
      </div>
    </Card>
  );
}
