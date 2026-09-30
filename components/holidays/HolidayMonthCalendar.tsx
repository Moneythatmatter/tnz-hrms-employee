"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Gift } from "lucide-react";
import { cn } from "@/lib/cn";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type HolidayCalendarRow = {
  id: string;
  holidayName: string;
  holidayDate: string;
  category?: string;
  extraPayMultiplier?: number;
};

function toLocalIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function categoryTone(category?: string): string {
  if (category === "National") return "bg-violet-100 text-violet-900 border-violet-200";
  if (category === "Festival") return "bg-amber-100 text-amber-900 border-amber-200";
  return "bg-slate-100 text-slate-800 border-slate-200";
}

export function HolidayMonthCalendar({
  year,
  holidays,
  selectedIso,
  onSelectDate,
}: {
  year: number;
  holidays: HolidayCalendarRow[];
  selectedIso: string | null;
  onSelectDate: (iso: string | null) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => toLocalIso(today), [today]);
  const [viewMonth, setViewMonth] = useState(
    year === today.getFullYear() ? today.getMonth() : 0,
  );

  useEffect(() => {
    setViewMonth(year === today.getFullYear() ? today.getMonth() : 0);
  }, [year, today]);

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, HolidayCalendarRow>();
    for (const h of holidays) {
      const iso = h.holidayDate.slice(0, 10);
      if (iso) map.set(iso, h);
    }
    return map;
  }, [holidays]);

  const monthGrid = useMemo(() => {
    const first = new Date(year, viewMonth, 1);
    const last = new Date(year, viewMonth + 1, 0);
    const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const cells: Array<{ iso: string; day: number; inMonth: boolean } | null> = [];

    for (let i = 0; i < startPad; i++) cells.push(null);

    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(year, viewMonth, d);
      cells.push({ iso: toLocalIso(date), day: d, inMonth: true });
    }

    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, viewMonth]);

  const selectedHoliday = selectedIso ? holidaysByDate.get(selectedIso) : null;

  function shiftMonth(delta: number) {
    const next = viewMonth + delta;
    if (next < 0 || next > 11) return;
    setViewMonth(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 rounded-lg border border-slate-100 bg-slate-50/70 p-2">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={viewMonth === 0}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white",
            viewMonth === 0 ? "cursor-not-allowed opacity-40" : "hover:bg-slate-50",
          )}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-0 flex-1 truncate text-center text-xs font-semibold text-slate-900">
          {formatMonthLabel(year, viewMonth)}
        </span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={viewMonth === 11}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white",
            viewMonth === 11 ? "cursor-not-allowed opacity-40" : "hover:bg-slate-50",
          )}
          aria-label="Next month"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-2">
        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={`${label}-${i}`}
              className="py-0.5 text-center text-[10px] font-semibold uppercase text-slate-400"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {monthGrid.map((cell, i) => {
            if (!cell) {
              return <span key={`pad-${i}`} className="aspect-square w-full" aria-hidden />;
            }

            const holiday = holidaysByDate.get(cell.iso);
            const isToday = cell.iso === todayIso;
            const isSelected = cell.iso === selectedIso;

            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => onSelectDate(isSelected ? null : cell.iso)}
                title={holiday ? `${cell.day} — ${holiday.holidayName}` : String(cell.day)}
                className={cn(
                  "flex aspect-square w-full flex-col items-center justify-center rounded-lg border text-[10px] font-semibold transition-all",
                  holiday
                    ? categoryTone(holiday.category)
                    : "border-transparent bg-slate-50/50 text-slate-600",
                  isToday && "ring-2 ring-emerald-700 ring-offset-1",
                  isSelected && "ring-2 ring-violet-600 ring-offset-1 shadow-sm",
                  "hover:brightness-95",
                )}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        <LegendDot className="bg-violet-300" label="National" />
        <LegendDot className="bg-amber-200 border border-amber-300" label="Festival" />
        <LegendDot className="ring-2 ring-emerald-700 ring-offset-1 bg-white" label="Today" />
      </div>

      {selectedHoliday ? (
        <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-3.5">
          <div className="flex items-start gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <Gift className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{selectedHoliday.holidayName}</p>
              <p className="mt-0.5 text-xs text-slate-600">
                {new Date(selectedHoliday.holidayDate.slice(0, 10)).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedHoliday.category ? (
                  <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200">
                    {selectedHoliday.category}
                  </span>
                ) : null}
                {selectedHoliday.extraPayMultiplier && selectedHoliday.extraPayMultiplier > 1 ? (
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {selectedHoliday.extraPayMultiplier}x extra pay
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
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
