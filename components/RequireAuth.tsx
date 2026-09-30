"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser, type AuthUser } from "@/lib/auth";
import { PortalShell } from "./PortalShell";
import { LoadingState } from "./ui/LoadingState";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchCurrentUser().then((u) => {
      if (!active) return;
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
        <LoadingState label="Loading your workspace…" />
      </div>
    );
  }

  return <PortalShell user={user}>{children}</PortalShell>;
}
