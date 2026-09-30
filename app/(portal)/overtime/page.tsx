"use client";

import { formatMoney, formatMoneyNumber } from "@/lib/currency";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Banknote, ListChecks, Timer } from "lucide-react";
import { api } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { DataTable } from "@/components/ui/DataTable";
import { KPICard } from "@/components/ui/KPICard";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

type OtRow = {
  recordDate?: string;
  otType?: string;
  overtimeHours?: number;
  payableAmount?: number;
  status?: string;
};

function normalizeStatus(raw?: string) {
  return String(raw ?? "").toUpperCase();
}

export default function OvertimePage() {
  const [rows, setRows] = useState<OtRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api
      .get<OtRow[]>("/api/employee-portal/overtime")
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    let totalHours = 0;
    let totalAmount = 0;
    let pending = 0;
    let approved = 0;

    for (const r of rows) {
      totalHours += Number(r.overtimeHours ?? 0);
      totalAmount += Number(r.payableAmount ?? 0);
      const status = normalizeStatus(r.status);
      if (status === "PENDING") pending += 1;
      else if (status === "APPROVED") approved += 1;
    }

    return { totalHours, totalAmount, pending, approved };
  }, [rows]);

  if (loading) return <LoadingState label="Loading overtime…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overtime"
        title="My Overtime"
        description="Track overtime hours, payable amounts, and approval status."
      />
      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard
          label="Total hours"
          value={stats.totalHours.toFixed(1)}
          subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
          icon={<Clock className="h-5 w-5" />}
          tone="emerald"
        />
        <KPICard
          label="Total payable"
          value={formatMoney(stats.totalAmount)}
          subtitle="Approved & pending combined"
          icon={<Banknote className="h-5 w-5" />}
          tone="blue"
        />
        <KPICard
          label="Approved"
          value={stats.approved}
          subtitle="Confirmed overtime entries"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="purple"
        />
        <KPICard
          label="Pending"
          value={stats.pending}
          subtitle="Awaiting manager approval"
          icon={<Timer className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <ListChecks className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Overtime records</h2>
            <p className="text-xs text-slate-500">Hours worked beyond regular shift</p>
          </div>
        </div>
        <DataTable
          columns={[
            {
              key: "date",
              header: "Date",
              render: (r) => (
                <span className="font-medium text-slate-900">
                  {r.recordDate?.slice(0, 10) ?? "—"}
                </span>
              ),
            },
            {
              key: "type",
              header: "OT type",
              render: (r) => (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {r.otType ?? "—"}
                </span>
              ),
            },
            {
              key: "hours",
              header: "Hours",
              render: (r) => (
                <span className="font-semibold text-slate-900">{r.overtimeHours ?? 0}h</span>
              ),
            },
            {
              key: "amount",
              header: "Amount",
              render: (r) => (
                <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-800">
                  <Banknote className="h-3.5 w-3.5" />
                  {formatMoneyNumber(Number(r.payableAmount ?? 0))}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusBadge label={r.status ?? "—"} />,
            },
          ]}
          rows={rows}
          rowKey={(r, i) => `${r.recordDate}-${i}`}
          emptyMessage="No overtime records yet."
        />
      </div>
    </div>
  );
}
