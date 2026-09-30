"use client";

import { formatMoney, formatMoneyNumber } from "@/lib/currency";
import { useEffect, useMemo, useState } from "react";
import { FileText, Banknote, Receipt, TrendingUp } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { KPICard } from "@/components/ui/KPICard";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PayslipCard } from "@/components/ui/PayslipCard";

type PayslipRow = {
  id: string;
  payslipNo?: string;
  monthLabel?: string;
  netSalary?: number;
  status?: string;
  generatedDate?: string;
};

export default function PayslipsPage() {
  const [rows, setRows] = useState<PayslipRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    void api
      .get<PayslipRow[]>("/api/employee-portal/payslips")
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const latest = rows[0];
    const totalNet = rows.reduce((sum, r) => sum + Number(r.netSalary ?? 0), 0);
    const avgNet = rows.length ? Math.round(totalNet / rows.length) : 0;
    return {
      count: rows.length,
      latestNet: latest?.netSalary ?? 0,
      latestMonth: latest?.monthLabel ?? "—",
      avgNet,
      totalNet,
    };
  }, [rows]);

  const handleDownload = async (row: PayslipRow) => {
    const filename = `${(row.payslipNo ?? `payslip-${row.id}`).replace(/[^\w.-]+/g, "_")}.html`;
    setDownloadingId(row.id);
    setError("");
    try {
      await api.download(`/api/employee-portal/payslips/${row.id}/download`, filename);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to download payslip");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <LoadingState label="Loading payslips…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payroll"
        title="Payslips"
        description="Monthly salary slips, net pay summary, and download history."
      />
      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard
          label="Latest net pay"
          value={formatMoney(Number(stats.latestNet))}
          subtitle={stats.latestMonth}
          icon={<Banknote className="h-5 w-5" />}
          tone="emerald"
        />
        <KPICard
          label="Total slips"
          value={stats.count}
          subtitle="Generated payslips"
          icon={<FileText className="h-5 w-5" />}
          tone="blue"
        />
        <KPICard
          label="Average net"
          value={formatMoney(stats.avgNet)}
          subtitle="Across all payslips"
          icon={<TrendingUp className="h-5 w-5" />}
          tone="purple"
        />
        <KPICard
          label="Total received"
          value={formatMoney(stats.totalNet)}
          subtitle="Cumulative net pay"
          icon={<Receipt className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      {!rows.length ? (
        <Card>
          <EmptyState message="No payslips available yet." />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((r, i) => (
            <PayslipCard
              key={r.id}
              {...r}
              featured={i === 0}
              downloading={downloadingId === r.id}
              onDownload={() => void handleDownload(r)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
