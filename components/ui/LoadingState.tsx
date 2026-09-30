export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-700" />
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
