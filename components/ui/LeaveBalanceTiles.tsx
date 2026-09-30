import { Palmtree, Stethoscope, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

export type LeaveBalance = { casual?: number; sick?: number; earned?: number };

type LeaveTone = "amber" | "rose" | "emerald";

const ITEMS: Array<{
  key: keyof LeaveBalance;
  label: string;
  title: string;
  icon: typeof Sun;
  tone: LeaveTone;
}> = [
  { key: "casual", label: "CL", title: "Casual leave", icon: Sun, tone: "amber" },
  { key: "sick", label: "SL", title: "Sick leave", icon: Stethoscope, tone: "rose" },
  { key: "earned", label: "EL", title: "Earned leave", icon: Palmtree, tone: "emerald" },
];

const toneStyles: Record<LeaveTone, string> = {
  amber: "border-amber-100 bg-amber-50/70 text-amber-800",
  rose: "border-rose-100 bg-rose-50/70 text-rose-800",
  emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
};

export function LeaveBalanceTiles({
  balance,
  className,
  compact = false,
}: {
  balance: LeaveBalance;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {ITEMS.map(({ key, label, title, icon: Icon, tone }) => (
        <div
          key={key}
          title={title}
          className={cn(
            "rounded-xl border text-center transition-shadow hover:shadow-sm",
            toneStyles[tone],
            compact ? "px-2 py-2" : "px-2.5 py-2.5",
          )}
        >
          <Icon className={cn("mx-auto opacity-80", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
          <p
            className={cn(
              "mt-1 font-bold uppercase tracking-wide opacity-80",
              compact ? "text-[9px]" : "text-[10px]",
            )}
          >
            {label}
          </p>
          <p className={cn("font-black leading-none", compact ? "text-lg" : "text-xl")}>
            {balance[key] ?? 0}
          </p>
          {!compact ? (
            <p className="mt-0.5 text-[9px] font-medium opacity-70">days left</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
