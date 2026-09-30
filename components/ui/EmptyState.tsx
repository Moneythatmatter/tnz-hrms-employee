import { Inbox } from "lucide-react";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}
