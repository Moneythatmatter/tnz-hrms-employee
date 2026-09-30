"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  Palmtree,
  Plus,
} from "lucide-react";
import { ApplyLeaveModal } from "@/components/leave/ApplyLeaveModal";
import { LeaveBalanceSummary } from "@/components/leave/LeaveBalanceSummary";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

type LeaveRow = {
  id: string;
  leaveTypeName?: string;
  leaveTypeCode?: string;
  fromDate?: string;
  toDate?: string;
  totalDays?: number;
  status?: string;
};

type LeaveBalance = { casual?: number; sick?: number; earned?: number };

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function normalizeStatus(raw?: string) {
  return String(raw ?? "").toUpperCase();
}

function formatLeaveDate(value?: string): string {
  const iso = value?.slice(0, 10);
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toLocalIso(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function LeavePage() {
  const todayIso = useMemo(() => toLocalIso(), []);
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [balance, setBalance] = useState<LeaveBalance>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const load = useCallback(async () => {
    const [apps, bal] = await Promise.all([
      api.get<LeaveRow[]>("/api/employee-portal/leave/applications"),
      api.get<LeaveBalance>("/api/employee-portal/leave/balance"),
    ]);
    setRows(apps);
    setBalance(bal);
  }, []);

  useEffect(() => {
    void load()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [load]);

  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let daysTaken = 0;

    for (const r of rows) {
      const status = normalizeStatus(r.status);
      if (status === "PENDING") pending += 1;
      else if (status === "APPROVED") {
        approved += 1;
        daysTaken += Number(r.totalDays ?? 0);
      }
    }

    return { pending, approved, daysTaken };
  }, [rows]);

  const filteredRows = useMemo(() => {
    let list = [...rows];
    if (filter !== "all") {
      list = list.filter((r) => normalizeStatus(r.status) === filter.toUpperCase());
    }
    list.sort((a, b) => {
      const sa = normalizeStatus(a.status);
      const sb = normalizeStatus(b.status);
      if (sa === "PENDING" && sb !== "PENDING") return -1;
      if (sb === "PENDING" && sa !== "PENDING") return 1;
      return (b.fromDate ?? "").localeCompare(a.fromDate ?? "");
    });
    return list;
  }, [rows, filter]);

  const upcomingLeave = useMemo(() => {
    return rows
      .filter(
        (r) =>
          normalizeStatus(r.status) === "APPROVED" &&
          (r.fromDate?.slice(0, 10) ?? "") >= todayIso,
      )
      .sort((a, b) => (a.fromDate ?? "").localeCompare(b.fromDate ?? ""))[0];
  }, [rows, todayIso]);

  const pendingRows = useMemo(
    () => rows.filter((r) => normalizeStatus(r.status) === "PENDING"),
    [rows],
  );

  if (loading) return <LoadingState label="Loading leave data…" />;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Leave"
        title="Leave Management"
        description="Track your leave balance, pending requests, and application history."
        actions={
          <Button type="button" onClick={() => setApplyOpen(true)}>
            <Plus className="h-4 w-4" />
            Apply for leave
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4 lg:sticky lg:top-28">
          <Card>
            <CardHeader
              title="Leave balance"
              subtitle="Available days by type"
              action={
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Palmtree className="h-4 w-4" />
                </div>
              }
            />
            <LeaveBalanceSummary balance={balance} />
          </Card>

          <Card>
            <CardHeader title="Activity" subtitle="Your leave requests at a glance" />
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Pending", value: stats.pending, tone: "text-amber-800 bg-amber-50 border-amber-100" },
                { label: "Approved", value: stats.approved, tone: "text-blue-800 bg-blue-50 border-blue-100" },
                { label: "Days taken", value: stats.daysTaken, tone: "text-purple-800 bg-purple-50 border-purple-100" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn("rounded-xl border px-2 py-2.5 text-center", item.tone)}
                >
                  <p className="text-[9px] font-bold uppercase tracking-wide opacity-80">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-lg font-black">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          {upcomingLeave ? (
            <Card className="overflow-hidden p-0">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-4 text-white">
                <div className="flex items-center gap-2 text-blue-100">
                  <CalendarCheck className="h-4 w-4" />
                  <p className="text-[11px] font-semibold uppercase tracking-wide">Upcoming leave</p>
                </div>
                <p className="mt-2 text-lg font-bold leading-snug">
                  {upcomingLeave.leaveTypeName ?? upcomingLeave.leaveTypeCode ?? "Leave"}
                </p>
                <p className="mt-1 text-sm text-blue-50">
                  {formatLeaveDate(upcomingLeave.fromDate)}
                  {upcomingLeave.toDate &&
                  upcomingLeave.toDate.slice(0, 10) !== upcomingLeave.fromDate?.slice(0, 10)
                    ? ` – ${formatLeaveDate(upcomingLeave.toDate)}`
                    : ""}
                </p>
                <p className="mt-1 text-xs text-blue-100">
                  {upcomingLeave.totalDays ?? 1} day
                  {(upcomingLeave.totalDays ?? 1) === 1 ? "" : "s"}
                </p>
              </div>
            </Card>
          ) : null}

          {pendingRows.length ? (
            <Card>
              <CardHeader
                title="Awaiting approval"
                subtitle={`${pendingRows.length} pending request${pendingRows.length === 1 ? "" : "s"}`}
                action={
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                    <Clock className="h-4 w-4" />
                  </div>
                }
              />
              <ul className="space-y-2">
                {pendingRows.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2.5"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {r.leaveTypeName ?? r.leaveTypeCode ?? "Leave"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {formatLeaveDate(r.fromDate)}
                      {r.toDate && r.toDate.slice(0, 10) !== r.fromDate?.slice(0, 10)
                        ? ` – ${formatLeaveDate(r.toDate)}`
                        : ""}
                      · {r.totalDays ?? 1}d
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Application history</h2>
                <p className="text-xs text-slate-500">
                  {filteredRows.length} of {rows.length} request{rows.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-1">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilter(opt.value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    filter === opt.value
                      ? "bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {filteredRows.length ? (
            <DataTable
              columns={[
                {
                  key: "type",
                  header: "Type",
                  render: (r) => (
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
                      <CalendarCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span className="truncate">
                        {r.leaveTypeName ?? r.leaveTypeCode ?? "—"}
                      </span>
                    </span>
                  ),
                },
                {
                  key: "from",
                  header: "From",
                  render: (r) => (
                    <span className="font-medium text-slate-800">{formatLeaveDate(r.fromDate)}</span>
                  ),
                },
                {
                  key: "to",
                  header: "To",
                  render: (r) => (
                    <span className="font-medium text-slate-800">{formatLeaveDate(r.toDate)}</span>
                  ),
                },
                {
                  key: "days",
                  header: "Days",
                  render: (r) => (
                    <span className="font-semibold text-slate-900">{r.totalDays ?? "—"}</span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => <StatusBadge label={r.status ?? "—"} />,
                },
              ]}
              rows={filteredRows}
              rowKey={(r) => r.id}
              getRowClassName={(r) => {
                const status = normalizeStatus(r.status);
                const fromIso = r.fromDate?.slice(0, 10) ?? "";
                if (status === "PENDING") {
                  return "bg-amber-50/80 ring-1 ring-inset ring-amber-200";
                }
                if (status === "APPROVED" && fromIso >= todayIso) {
                  return "bg-blue-50/60 ring-1 ring-inset ring-blue-100";
                }
                return undefined;
              }}
              emptyMessage="No leave applications yet."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <EmptyState
                message={
                  filter === "all"
                    ? "No leave applications yet. Apply for leave to submit your first request."
                    : `No ${filter} leave applications.`
                }
              />
              {filter === "all" ? (
                <div className="border-t border-slate-100 px-4 pb-4 text-center">
                  <Button type="button" onClick={() => setApplyOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Apply for leave
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {stats.approved > 0 ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p>
                You have <strong>{stats.approved}</strong> approved request
                {stats.approved === 1 ? "" : "s"} totalling{" "}
                <strong>{stats.daysTaken}</strong> day{stats.daysTaken === 1 ? "" : "s"} taken this
                period.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <ApplyLeaveModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        onSubmitted={() => {
          setSuccess("Leave application submitted successfully. HR will review it shortly.");
          setError("");
          void load().catch((e) =>
            setError(e instanceof Error ? e.message : "Failed to refresh leave data"),
          );
        }}
      />
    </div>
  );
}
