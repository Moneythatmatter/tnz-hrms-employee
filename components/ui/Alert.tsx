import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/cn";

export function Alert({
  children,
  variant = "error",
  className,
}: {
  children: React.ReactNode;
  variant?: "error" | "success" | "info";
  className?: string;
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  }[variant];

  const Icon = variant === "success" ? CheckCircle2 : variant === "info" ? Info : AlertCircle;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm",
        styles,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
