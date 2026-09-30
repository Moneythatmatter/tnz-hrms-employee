import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "danger" | "none";

const variants: Record<Variant, string> = {
  primary:
    "bg-emerald-700 text-white hover:bg-emerald-800 focus:ring-emerald-500 shadow-xs",
  secondary:
    "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-500 shadow-xs",
  outline:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:ring-emerald-500",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-xs",
  none: "",
};

export function Button({
  children,
  variant = "primary",
  className,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
