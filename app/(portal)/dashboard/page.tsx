"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  ChevronRight,
  Clock,
  Banknote,
  Palmtree,
  Timer,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatMoneyNumber } from "@/lib/currency";
import { EmployeeAttendanceCalendar } from "@/components/attendance/EmployeeAttendanceCalendar";
import { QuickLinksRow } from "@/components/dashboard/QuickLinksRow";
import { TodayPunchBanner } from "@/components/dashboard/TodayPunchBanner";
import { UpcomingEventsCard } from "@/components/dashboard/UpcomingEventsCard";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatStatusLabel, KPICard } from "@/components/ui/KPICard";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";

type DashboardData = {
  date: string;
  employee: {
    name: string;
    empCode: string;
    department?: string;
    designation?: string;
    shiftType?: string;
  } | null;
  todayShift: {
    shiftName?: string;
    startTime?: string;
    endTime?: string;
  } | null;
  todayAttendance: {
    attendanceStatus?: string;
    punchIn?: string;
    punchOut?: string;
    workedHours?: number;
  } | null;
  monthlySummary: {
    fromDate: string;
    toDate: string;
    presentDays: number;
  };
  leaveBalance: { casual?: number; sick?: number; earned?: number };
  pendingLeaveCount: number;
  latestPayslip: { monthLabel?: string; netSalary?: number } | null;
  overtime: { pendingCount: number; approvedCount: number };
  upcomingBirthdays?: Array<{
    id: string;
    name: string;
    avatar: string;
    department: string;
    displayDate: string;
    daysUntil: number;
  }>;
  upcomingHolidays?: Array<{
    id: string;
    title: string;
    displayDate: string;
    dayOfWeek?: string;
    category?: string;
    daysUntil: number;
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [punchLoading, setPunchLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function load() {
    try {
      const d = await api.get<DashboardData>("/api/employee-portal/dashboard");
      setData(d);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function punchIn() {
    setPunchLoading(true);
    try {
      await api.post("/api/employee-portal/attendance/punch-in", {});
      await load();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Punch in failed");
    } finally {
      setPunchLoading(false);
    }
  }

  async function punchOut() {
    setPunchLoading(true);
    try {
      await api.post("/api/employee-portal/attendance/punch-out", {});
      await load();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Punch out failed");
    } finally {
      setPunchLoading(false);
    }
  }

  if (!data && !error) return <LoadingState label="Loading dashboard…" />;
  if (error && !data) return <Alert variant="error">{error}</Alert>;
  if (!data) return null;

  const att = data.todayAttendance;
  const canPunchIn = !att?.punchIn;
  const canPunchOut = Boolean(att?.punchIn) && !att?.punchOut;
  const totalLeave =
    (data.leaveBalance.casual ?? 0) +
    (data.leaveBalance.sick ?? 0) +
    (data.leaveBalance.earned ?? 0);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Dashboard"
        title={`Good day, ${data.employee?.name ?? "Employee"}`}
        description={`${data.date} · ${data.employee?.department ?? "—"} · ${data.employee?.empCode ?? ""}`}
      />

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard
          label="Today's status"
          value={formatStatusLabel(att?.attendanceStatus)}
          subtitle={
            att?.punchIn
              ? `In at ${new Date(att.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Not punched in yet"
          }
          icon={<Clock className="h-5 w-5" />}
          tone="emerald"
        />
        <KPICard
          label="This month"
          value={data.monthlySummary.presentDays}
          subtitle={`Present · ${data.monthlySummary.fromDate.slice(5)} – ${data.monthlySummary.toDate.slice(5)}`}
          icon={<CalendarCheck className="h-5 w-5" />}
          tone="blue"
        />
        <KPICard
          label="Leave balance"
          value={totalLeave}
          subtitle={`CL ${data.leaveBalance.casual ?? 0} · SL ${data.leaveBalance.sick ?? 0} · EL ${data.leaveBalance.earned ?? 0}`}
          icon={<Palmtree className="h-5 w-5" />}
          tone="amber"
        />
        <KPICard
          label="Pending requests"
          value={data.pendingLeaveCount + data.overtime.pendingCount}
          subtitle={`${data.pendingLeaveCount} leave · ${data.overtime.pendingCount} OT`}
          icon={<Timer className="h-5 w-5" />}
          tone="purple"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-start">
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
            <UpcomingEventsCard
              className="h-full"
              birthdays={data.upcomingBirthdays ?? []}
              holidays={data.upcomingHolidays ?? []}
            />

            <Card className="flex h-full flex-col">
              <CardHeader title="Quick summary" subtitle="At a glance" />
              <dl className="flex flex-1 flex-col justify-evenly gap-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Designation</dt>
                  <dd className="font-semibold text-slate-900">
                    {data.employee?.designation ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Overtime approved</dt>
                  <dd className="font-semibold text-slate-900">{data.overtime.approvedCount}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Leave pending</dt>
                  <dd className="font-semibold text-slate-900">{data.pendingLeaveCount}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Hours today</dt>
                  <dd className="font-semibold text-emerald-800">
                    {att?.workedHours ? `${att.workedHours.toFixed(1)}h` : "—"}
                  </dd>
                </div>
              </dl>
            </Card>
          </div>

          <Card className="flex min-h-[198px] flex-col">
            <CardHeader title="Latest payslip" subtitle="Most recent salary slip" />
            <div className="flex flex-1 flex-col justify-center py-1">
              {data.latestPayslip ? (
                <>
                  <p className="text-sm font-semibold text-slate-800">
                    {data.latestPayslip.monthLabel ?? "Recent payslip"}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-2xl font-black text-emerald-800">
                    <Banknote className="h-5 w-5" />
                    {formatMoneyNumber(Number(data.latestPayslip.netSalary ?? 0))}
                  </p>
                  <Link
                    href="/payslips"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    View all payslips
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              ) : (
                <p className="text-sm text-slate-500">No payslips generated yet.</p>
              )}
            </div>
          </Card>

          <QuickLinksRow />
        </div>

        <div className="space-y-4 lg:sticky lg:top-28">
          <TodayPunchBanner
            variant="header"
            shift={data.todayShift}
            shiftFallback={data.employee?.shiftType}
            attendance={att}
            canPunchIn={canPunchIn}
            canPunchOut={canPunchOut}
            punchLoading={punchLoading}
            onPunchIn={() => void punchIn()}
            onPunchOut={() => void punchOut()}
          />
          <EmployeeAttendanceCalendar
            variant="dashboard"
            showFullAttendanceLink
            refreshKey={refreshKey}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
