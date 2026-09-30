import { cn } from "@/lib/cn";

type Tone = "emerald" | "sky" | "amber" | "rose" | "slate" | "violet" | "blue";

const toneStyles: Record<Tone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  rose: "bg-red-50 text-red-700 ring-red-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
};

export function statusTone(status?: string): Tone {
  const s = String(status ?? "").toUpperCase();
  if (["PRESENT", "APPROVED", "ACTIVE", "GENERATED", "PAID"].includes(s)) return "emerald";
  if (["LATE", "HALF DAY", "PENDING", "PARTIAL"].includes(s)) return "amber";
  if (["ABSENT", "REJECTED", "CANCELLED", "INACTIVE"].includes(s)) return "rose";
  if (["LEAVE", "HOLIDAY", "WEEKLY_OFF"].includes(s)) return "blue";
  return "slate";
}

export function StatusBadge({
  label,
  tone,
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  const resolved = tone ?? statusTone(label);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset",
        toneStyles[resolved],
        className,
      )}
    >
      {label}
    </span>
  );
}
