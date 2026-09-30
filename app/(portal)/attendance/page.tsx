"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Clock,
  LogIn,
  LogOut,
  Palmtree,
  Timer,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { EmployeeAttendanceCalendar } from "@/components/attendance/EmployeeAttendanceCalendar";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { KPICard } from "@/components/ui/KPICard";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

type AttendanceRow = {
  attendanceDate?: string;
  attendanceStatus?: string;
  dayType?: string;
  punchIn?: string;
  punchOut?: string;
  workedHours?: number;
};

type TodayAttendance = {
  attendanceStatus?: string;
  punchIn?: string;
  punchOut?: string;
  workedHours?: number;
};

function normalizeStatus(raw?: string): string {
  return String(raw ?? "").toUpperCase().replace(/\s+/g, "_");
}

function computeMonthStats(rows: AttendanceRow[], ref = new Date()) {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const monthRows = rows.filter((r) => {
    const iso = String(r.attendanceDate ?? "").slice(0, 10);
    if (!iso) return false;
    const d = new Date(iso);
    return d.getFullYear() === y && d.getMonth() === m;
  });

  let present = 0;
  let absent = 0;
  let onLeave = 0;
  let totalHours = 0;

  for (const r of monthRows) {
    const status = normalizeStatus(r.attendanceStatus);
    const dayType = normalizeStatus(r.dayType);

    if (status === "PRESENT" || status === "LATE" || status === "HALF_DAY") {
      present += 1;
    } else if (status === "ABSENT") {
      absent += 1;
    } else if (status === "LEAVE" || dayType === "LEAVE") {
      onLeave += 1;
    }

    totalHours += Number(r.workedHours ?? 0);
  }

  const monthLabel = ref.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return { present, absent, onLeave, totalHours, monthLabel, totalRecords: monthRows.length };
}

export default function AttendancePage() {
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    const [list, today] = await Promise.all([
      api.get<AttendanceRow[]>("/api/employee-portal/attendance"),
      api.get<TodayAttendance | null>("/api/employee-portal/attendance/today"),
    ]);
    setRows(list);
    setTodayAttendance(today);
  }, []);

  useEffect(() => {
    void load()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [load]);

  const stats = useMemo(() => computeMonthStats(rows), [rows]);
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const canPunchIn = !todayAttendance?.punchIn;
  const canPunchOut = Boolean(todayAttendance?.punchIn) && !todayAttendance?.punchOut;

  async function punchIn() {
    setPunchLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/api/employee-portal/attendance/punch-in", {});
      await load();
      setRefreshKey((k) => k + 1);
      setSuccess("Punched in successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Punch in failed");
    } finally {
      setPunchLoading(false);
    }
  }

  async function punchOut() {
    setPunchLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/api/employee-portal/attendance/punch-out", {});
      await load();
      setRefreshKey((k) => k + 1);
      setSuccess("Punched out successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Punch out failed");
    } finally {
      setPunchLoading(false);
    }
  }

  if (loading) return <LoadingState label="Loading attendance…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Attendance"
        title="My Attendance"
        description="Monthly calendar, summary stats, and daily punch history."
        actions={
          <>
            <Button disabled={!canPunchIn || punchLoading} onClick={() => void punchIn()}>
              <LogIn className="h-4 w-4" />
              Punch in
            </Button>
            <Button
              variant="secondary"
              disabled={!canPunchOut || punchLoading}
              onClick={() => void punchOut()}
            >
              <LogOut className="h-4 w-4" />
              Punch out
            </Button>
          </>
        }
      />
      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard
          label="Present"
          value={stats.present}
          subtitle={`${stats.monthLabel} · days marked present`}
          icon={<CalendarCheck className="h-5 w-5" />}
          tone="emerald"
        />
        <KPICard
          label="Absent"
          value={stats.absent}
          subtitle="Days marked absent"
          icon={<XCircle className="h-5 w-5" />}
          tone="rose"
        />
        <KPICard
          label="On leave"
          value={stats.onLeave}
          subtitle="Leave days this month"
          icon={<Palmtree className="h-5 w-5" />}
          tone="blue"
        />
        <KPICard
          label="Total hours"
          value={stats.totalHours.toFixed(1)}
          subtitle={`${stats.totalRecords} records this month`}
          icon={<Timer className="h-5 w-5" />}
          tone="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <EmployeeAttendanceCalendar refreshKey={refreshKey} />
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900">Attendance log</h2>
            <span className="text-xs text-slate-500">({rows.length} records)</span>
          </div>
          <DataTable
            columns={[
              {
                key: "date",
                header: "Date",
                render: (r) => {
                  const iso = r.attendanceDate?.slice(0, 10);
                  const isToday = iso === todayIso;
                  return (
                    <span className={cn("font-medium", isToday ? "text-emerald-800" : "text-slate-900")}>
                      {iso ?? "—"}
                      {isToday ? (
                        <span className="ml-2 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          Today
                        </span>
                      ) : null}
                    </span>
                  );
                },
              },
              {
                key: "status",
                header: "Status",
                render: (r) => <StatusBadge label={r.attendanceStatus ?? "—"} />,
              },
              {
                key: "day",
                header: "Day type",
                render: (r) => (
                  <span className="text-xs font-semibold uppercase text-slate-500">
                    {r.dayType?.replace(/_/g, " ") ?? "—"}
                  </span>
                ),
              },
              {
                key: "in",
                header: "Punch in",
                render: (r) =>
                  r.punchIn
                    ? new Date(r.punchIn).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—",
              },
              {
                key: "out",
                header: "Punch out",
                render: (r) =>
                  r.punchOut
                    ? new Date(r.punchOut).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—",
              },
              {
                key: "hours",
                header: "Hours",
                render: (r) => (
                  <span className="font-semibold text-slate-900">{r.workedHours ?? 0}h</span>
                ),
              },
            ]}
            rows={rows}
            rowKey={(r, i) => `${r.attendanceDate}-${i}`}
            getRowClassName={(r) =>
              r.attendanceDate?.slice(0, 10) === todayIso
                ? "bg-emerald-50/80 ring-1 ring-inset ring-emerald-200"
                : undefined
            }
            emptyMessage="No attendance records yet."
          />
        </div>
      </div>
    </div>
  );
}
