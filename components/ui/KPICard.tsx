import { cn } from "@/lib/cn";

export type KPITone = "emerald" | "amber" | "blue" | "purple" | "rose" | "slate";

const toneColors: Record<KPITone, string> = {
  emerald: "#059669",
  amber: "#d97706",
  blue: "#0284c7",
  purple: "#7c3aed",
  rose: "#e11d48",
  slate: "#64748b",
};

export function KPICard({
  label,
  value,
  subtitle,
  icon,
  tone = "emerald",
  className,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  tone?: KPITone;
  className?: string;
}) {
  const color = toneColors[tone];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md",
        className,
      )}
    >
      <div
        className="absolute inset-0 opacity-30 transition-opacity group-hover:opacity-45"
        style={{ background: `linear-gradient(135deg, ${color}14, transparent 65%)` }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold leading-tight tracking-tight text-slate-900">
            {value}
          </p>
          {subtitle ? (
            <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/** Format raw API status strings for display */
export function formatStatusLabel(status?: string | null): string {
  if (!status) return "Not marked";
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
