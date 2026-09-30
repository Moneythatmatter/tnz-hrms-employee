import { cn } from "@/lib/cn";
import { EmptyState } from "./EmptyState";

export type DataColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => React.ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No records found.",
  getRowClassName,
}: {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyMessage?: string;
  getRowClassName?: (row: T, index: number) => string | undefined;
}) {
  if (!rows.length) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              className={cn(
                "border-b border-slate-50 transition-colors hover:bg-emerald-50/30",
                getRowClassName?.(row, i),
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3.5 text-slate-700", col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
