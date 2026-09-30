export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.15),transparent_40%)]" />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
