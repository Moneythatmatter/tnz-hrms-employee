"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Flag, Gift, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { HolidayMonthCalendar } from "@/components/holidays/HolidayMonthCalendar";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { KPICard } from "@/components/ui/KPICard";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

type HolidayRow = {
  id: string;
  holidayCode?: string;
  holidayName: string;
  holidayDate: string;
  dayOfWeek?: string;
  category?: string;
  isMandatory?: boolean;
  extraPayMultiplier?: number;
  year?: number;
  description?: string;
  status?: string;
};

function formatHolidayDate(value: string): string {
  const iso = value.slice(0, 10);
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toLocalIso(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function HolidaysPage() {
  const currentYear = new Date().getFullYear();
  const todayIso = useMemo(() => toLocalIso(), []);
  const [rows, setRows] = useState<HolidayRow[]>([]);
  const [year, setYear] = useState(currentYear);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      setSelectedIso(null);
      try {
        const data = await api.get<HolidayRow[]>(
          `/api/employee-portal/holidays?year=${year}`,
        );
        setRows(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load holidays");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [year]);

  const yearOptions = useMemo(() => {
    const years = new Set(rows.map((row) => Number(row.year ?? year)));
    years.add(currentYear);
    years.add(currentYear + 1);
    return Array.from(years).sort((a, b) => b - a);
  }, [rows, currentYear, year]);

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) =>
        a.holidayDate.slice(0, 10).localeCompare(b.holidayDate.slice(0, 10)),
      ),
    [rows],
  );

  const stats = useMemo(() => {
    const national = rows.filter((r) => r.category === "National").length;
    const festival = rows.filter((r) => r.category === "Festival").length;
    const withExtraPay = rows.filter((r) => (r.extraPayMultiplier ?? 1) > 1).length;
    return { total: rows.length, national, festival, withExtraPay };
  }, [rows]);

  const nextHoliday = useMemo(() => {
    return sortedRows.find((r) => r.holidayDate.slice(0, 10) >= todayIso) ?? null;
  }, [sortedRows, todayIso]);

  if (loading) return <LoadingState label="Loading holiday calendar…" />;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Calendar"
        title="Holiday Calendar"
        description="Official public holidays and festival offs for your property."
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <CalendarRange className="h-4 w-4 text-amber-600" />
            <label className="text-xs font-semibold text-slate-600" htmlFor="holiday-year">
              Year
            </label>
            <select
              id="holiday-year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border-0 bg-transparent py-0 pl-1 pr-6 text-sm font-bold text-slate-900 focus:outline-none focus:ring-0"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard
          label="Total holidays"
          value={stats.total}
          subtitle={`${year} calendar`}
          icon={<Gift className="h-5 w-5" />}
          tone="amber"
        />
        <KPICard
          label="National"
          value={stats.national}
          subtitle="Public holidays"
          icon={<Flag className="h-5 w-5" />}
          tone="purple"
        />
        <KPICard
          label="Festival"
          value={stats.festival}
          subtitle="Festival offs"
          icon={<Sparkles className="h-5 w-5" />}
          tone="blue"
        />
        <KPICard
          label="Extra pay days"
          value={stats.withExtraPay}
          subtitle="Eligible for premium pay"
          icon={<CalendarRange className="h-5 w-5" />}
          tone="emerald"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4 lg:sticky lg:top-28">
          {nextHoliday ? (
            <Card className="overflow-hidden p-0">
              <div className="bg-gradient-to-br from-violet-600 to-violet-700 px-4 py-4 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-100">
                  Next holiday
                </p>
                <p className="mt-1 text-lg font-bold leading-snug">{nextHoliday.holidayName}</p>
                <p className="mt-1 text-sm text-violet-50">
                  {formatHolidayDate(nextHoliday.holidayDate)}
                  {nextHoliday.dayOfWeek ? ` · ${nextHoliday.dayOfWeek}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3">
                {nextHoliday.category ? (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                    {nextHoliday.category}
                  </span>
                ) : null}
                {nextHoliday.extraPayMultiplier && nextHoliday.extraPayMultiplier > 1 ? (
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    {nextHoliday.extraPayMultiplier}x pay
                  </span>
                ) : null}
                {nextHoliday.status ? <StatusBadge label={nextHoliday.status} /> : null}
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title="Month view"
              subtitle="Tap a date to see holiday details"
              action={
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <CalendarRange className="h-4 w-4" />
                </div>
              }
            />
            <HolidayMonthCalendar
              year={year}
              holidays={sortedRows}
              selectedIso={selectedIso}
              onSelectDate={setSelectedIso}
            />
          </Card>
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-slate-900">All holidays</h2>
            <span className="text-xs text-slate-500">({sortedRows.length} in {year})</span>
          </div>
          <DataTable
            columns={[
              {
                key: "holidayName",
                header: "Holiday",
                render: (row: HolidayRow) => (
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        row.category === "National"
                          ? "bg-violet-50 text-violet-700"
                          : row.category === "Festival"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600",
                      )}
                    >
                      <Gift className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{row.holidayName}</p>
                      <p className="text-[11px] font-mono text-slate-400">
                        {row.holidayCode ?? "—"}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: "holidayDate",
                header: "Date",
                render: (row: HolidayRow) => {
                  const iso = row.holidayDate.slice(0, 10);
                  const isToday = iso === todayIso;
                  return (
                    <div>
                      <p className={cn("font-semibold", isToday ? "text-emerald-800" : "text-slate-800")}>
                        {formatHolidayDate(row.holidayDate)}
                        {isToday ? (
                          <span className="ml-2 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                            Today
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-slate-500">{row.dayOfWeek ?? "—"}</p>
                    </div>
                  );
                },
              },
              {
                key: "category",
                header: "Category",
                render: (row: HolidayRow) => (
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px] font-bold",
                      row.category === "National"
                        ? "bg-violet-100 text-violet-800"
                        : row.category === "Festival"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-slate-100 text-slate-700",
                    )}
                  >
                    {row.category ?? "Holiday"}
                  </span>
                ),
              },
              {
                key: "extraPayMultiplier",
                header: "Extra pay",
                render: (row: HolidayRow) =>
                  row.extraPayMultiplier && row.extraPayMultiplier > 1 ? (
                    <span className="text-xs font-bold text-emerald-800">
                      {row.extraPayMultiplier}x
                    </span>
                  ) : (
                    "—"
                  ),
              },
              {
                key: "status",
                header: "Status",
                render: (row: HolidayRow) => (
                  <StatusBadge label={row.status ?? "Active"} />
                ),
              },
            ]}
            rows={sortedRows}
            rowKey={(row) => row.id}
            getRowClassName={(row) => {
              const iso = row.holidayDate.slice(0, 10);
              if (iso === selectedIso) return "bg-violet-50/80 ring-1 ring-inset ring-violet-200";
              if (iso === todayIso) return "bg-emerald-50/80 ring-1 ring-inset ring-emerald-200";
              return undefined;
            }}
            emptyMessage={`No holidays found for ${year}.`}
          />
        </div>
      </div>
    </div>
  );
}
