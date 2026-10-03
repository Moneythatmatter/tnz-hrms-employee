"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquareWarning,
  Plus,
} from "lucide-react";
import { RaiseGrievanceModal } from "@/components/grievance/RaiseGrievanceModal";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { KPICard } from "@/components/ui/KPICard";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GRIEVANCE_STATUSES, normalizeGrievanceStatus } from "@/lib/grievance-status";

type GrievanceRow = {
  id: string;
  ticketNo?: string;
  category?: string;
  subject?: string;
  description?: string;
  incidentDate?: string;
  priority?: string;
  status?: string;
  submittedDate?: string;
  dueDate?: string;
  proposedResolution?: string;
  resolutionNotes?: string;
};

type StatusFilter = "all" | "submitted" | "pending" | "closed";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...GRIEVANCE_STATUSES.map((s) => ({
    value: s.toLowerCase() as StatusFilter,
    label: s,
  })),
];

function formatDate(value?: string): string {
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

export default function GrievancesPage() {
  const [rows, setRows] = useState<GrievanceRow[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await api.get<GrievanceRow[]>("/api/employee-portal/grievances");
    setRows(list);
  }, []);

  useEffect(() => {
    void load()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load grievances"))
      .finally(() => setLoading(false));
  }, [load]);

  const stats = useMemo(() => {
    let submitted = 0;
    let pending = 0;
    let closed = 0;
    for (const r of rows) {
      const s = normalizeGrievanceStatus(r.status);
      if (s === "Closed") closed += 1;
      else if (s === "Pending") pending += 1;
      else submitted += 1;
    }
    return { total: rows.length, submitted, pending, closed };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (filter === "all") return rows;
    const want = filter.charAt(0).toUpperCase() + filter.slice(1);
    return rows.filter((r) => normalizeGrievanceStatus(r.status) === want);
  }, [rows, filter]);

  if (loading) return <LoadingState label="Loading grievances…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Support"
        title="Grievances"
        description="Raise workplace concerns and track HR responses on your tickets."
        actions={
          <Button type="button" onClick={() => setRaiseOpen(true)}>
            <Plus className="h-4 w-4" />
            Raise grievance
          </Button>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard
          label="Total tickets"
          value={stats.total}
          icon={<MessageSquareWarning className="h-5 w-5" />}
          tone="blue"
        />
        <KPICard
          label="Submitted"
          value={stats.submitted}
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
        />
        <KPICard
          label="Pending"
          value={stats.pending}
          icon={<AlertCircle className="h-5 w-5" />}
          tone="blue"
        />
        <KPICard
          label="Closed"
          value={stats.closed}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
        />
      </div>

      <Card>
        <CardHeader
          title="My grievances"
          subtitle="Select a subject to view details and any resolution from HR."
        />
        <div className="mb-4 flex flex-wrap gap-2 px-4 sm:px-5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                filter === opt.value
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {!filteredRows.length ? (
          <div className="px-4 pb-6 sm:px-5">
            <EmptyState
              message={
                filter === "all"
                  ? "You have not raised any grievances yet."
                  : "No tickets match this filter."
              }
            />
            {filter === "all" ? (
              <div className="mt-4 flex justify-center">
                <Button type="button" onClick={() => setRaiseOpen(true)}>
                  <Plus className="h-4 w-4" /> Raise your first grievance
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <DataTable<GrievanceRow>
            columns={[
              {
                key: "ticket",
                header: "Ticket",
                render: (r) => (
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {r.ticketNo ?? r.id.slice(0, 8)}
                  </span>
                ),
              },
              {
                key: "subject",
                header: "Subject",
                render: (r) => (
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    className="max-w-[200px] truncate text-left text-sm font-semibold text-slate-900 hover:text-emerald-800 sm:max-w-xs"
                  >
                    {r.subject ?? "—"}
                  </button>
                ),
              },
              {
                key: "category",
                header: "Category",
                render: (r) => (
                  <span className="text-sm text-slate-600">{r.category ?? "—"}</span>
                ),
              },
              {
                key: "priority",
                header: "Priority",
                render: (r) => (
                  <span
                    className={cn(
                      "text-xs font-bold uppercase",
                      r.priority === "Critical" || r.priority === "High"
                        ? "text-rose-700"
                        : "text-slate-600",
                    )}
                  >
                    {r.priority ?? "Medium"}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (r) => (
                  <StatusBadge label={normalizeGrievanceStatus(r.status)} />
                ),
              },
              {
                key: "submitted",
                header: "Submitted",
                render: (r) => (
                  <span className="text-sm text-slate-600">{formatDate(r.submittedDate)}</span>
                ),
              },
            ]}
            rows={filteredRows}
            rowKey={(r) => r.id}
          />
        )}

        {expandedId ? (
          <div className="mx-4 mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:mx-5">
            {(() => {
              const row = rows.find((r) => r.id === expandedId);
              if (!row) return null;
              const resolution = row.resolutionNotes || row.proposedResolution;
              return (
                <>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{row.subject}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                        {row.description ?? "—"}
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">
                        <div>
                          <dt className="font-bold uppercase text-slate-400">Incident</dt>
                          <dd>{formatDate(row.incidentDate)}</dd>
                        </div>
                        <div>
                          <dt className="font-bold uppercase text-slate-400">Due</dt>
                          <dd>{formatDate(row.dueDate)}</dd>
                        </div>
                        <div>
                          <dt className="font-bold uppercase text-slate-400">Priority</dt>
                          <dd>{row.priority ?? "Medium"}</dd>
                        </div>
                        <div>
                          <dt className="font-bold uppercase text-slate-400">Status</dt>
                          <dd>{normalizeGrievanceStatus(row.status)}</dd>
                        </div>
                      </dl>
                      {resolution ? (
                        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                            HR response
                          </p>
                          <p className="mt-1 text-sm text-emerald-950">{resolution}</p>
                        </div>
                      ) : (
                        <p className="mt-4 text-xs text-slate-500">
                          HR has not posted a resolution yet. You will see updates here when
                          available.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        ) : null}
      </Card>

      <RaiseGrievanceModal
        open={raiseOpen}
        onClose={() => setRaiseOpen(false)}
        onSubmitted={() => {
          setSuccess("Your grievance was submitted. HR will review your ticket.");
          setError("");
          void load().catch(() => undefined);
        }}
      />
    </div>
  );
}
