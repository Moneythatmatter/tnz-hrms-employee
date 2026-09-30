"use client";

import { Download, FileText, Banknote, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatMoneyNumber } from "@/lib/currency";
import { StatusBadge } from "./StatusBadge";

export function PayslipCard({
  monthLabel,
  payslipNo,
  generatedDate,
  netSalary,
  status,
  featured = false,
  downloading = false,
  onDownload,
}: {
  monthLabel?: string;
  payslipNo?: string;
  generatedDate?: string;
  netSalary?: number;
  status?: string;
  featured?: boolean;
  downloading?: boolean;
  onDownload?: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md",
        featured
          ? "border-emerald-200 ring-1 ring-emerald-100"
          : "border-slate-200/80 hover:border-emerald-100",
      )}
    >
      <div
        className={cn(
          "h-1.5 w-full",
          featured
            ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500"
            : "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200",
        )}
      />
      <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm",
              featured
                ? "bg-emerald-600 text-white"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            <FileText className="h-5 w-5" />
          </div>
          <div>
            {featured ? (
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Latest payslip
              </p>
            ) : null}
            <p className="text-sm font-bold text-slate-900">
              {monthLabel ?? payslipNo ?? "Payslip"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Generated {generatedDate?.slice(0, 10) ?? "—"}
            </p>
            <div className="mt-2">
              <StatusBadge label={status ?? "Generated"} />
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-0.5 text-xl font-black text-emerald-800">
            <Banknote className="h-4 w-4" />
            {formatMoneyNumber(Number(netSalary ?? 0))}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Net pay
          </p>
          <button
            type="button"
            onClick={onDownload}
            disabled={!onDownload || downloading}
            className={cn(
              "mt-2 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all",
              featured
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                : "border-slate-200 bg-white text-slate-600 opacity-0 group-hover:opacity-100 hover:border-emerald-200 hover:text-emerald-700",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {downloading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            {downloading ? "Downloading…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
