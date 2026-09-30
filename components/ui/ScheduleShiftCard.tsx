import { ArrowRight, Clock } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

export function ScheduleShiftCard({
  shiftName,
  startTime,
  endTime,
  effectiveFrom,
  effectiveTo,
  status,
}: {
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  status?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/80 px-4 py-3.5 transition-all hover:border-emerald-200 hover:shadow-sm">
      <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500/80 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{shiftName ?? "Shift"}</p>
            <p className="mt-0.5 text-xs font-medium text-emerald-700">
              {startTime ?? "—"} – {endTime ?? "—"}
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-slate-500">
              {effectiveFrom?.slice(0, 10) ?? "—"}
              <ArrowRight className="h-3 w-3" />
              {effectiveTo?.slice(0, 10) ?? "ongoing"}
            </p>
          </div>
        </div>
        {status ? <StatusBadge label={status} /> : null}
      </div>
    </div>
  );
}
