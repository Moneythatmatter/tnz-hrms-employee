"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CreditCard,
  IdCard,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { api } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader } from "@/components/ui/Card";
import { LeaveBalanceTiles, type LeaveBalance } from "@/components/ui/LeaveBalanceTiles";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

type Profile = Record<string, string | number | LeaveBalance | null | undefined>;

const SECTIONS: Array<{
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  fields: Array<{ key: string; label: string }>;
}> = [
  {
    title: "Personal",
    icon: UserRound,
    tone: "bg-emerald-50 text-emerald-700",
    fields: [
      { key: "empCode", label: "Employee code" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "gender", label: "Gender" },
      { key: "dob", label: "Date of birth" },
      { key: "bloodGroup", label: "Blood group" },
      { key: "address", label: "Address" },
    ],
  },
  {
    title: "Employment",
    icon: Building2,
    tone: "bg-blue-50 text-blue-700",
    fields: [
      { key: "department", label: "Department" },
      { key: "designation", label: "Designation" },
      { key: "employmentType", label: "Employment type" },
      { key: "shiftType", label: "Shift type" },
      { key: "joinDate", label: "Join date" },
      { key: "reportingManager", label: "Reporting manager" },
      { key: "emergencyContact", label: "Emergency contact" },
    ],
  },
  {
    title: "Bank & statutory",
    icon: CreditCard,
    tone: "bg-purple-50 text-purple-700",
    fields: [
      { key: "bankName", label: "Bank" },
      { key: "bankAccount", label: "Account number" },
      { key: "ifscCode", label: "IFSC" },
      { key: "panNumber", label: "PAN" },
      { key: "uanNumber", label: "UAN" },
      { key: "esicNumber", label: "ESIC" },
    ],
  },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api
      .get<Profile>("/api/employee-portal/profile")
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const leaveBalance = useMemo(() => {
    const raw = profile?.leaveBalance;
    if (raw && typeof raw === "object") return raw as LeaveBalance;
    return { casual: 0, sick: 0, earned: 0 };
  }, [profile?.leaveBalance]);

  if (loading) return <LoadingState label="Loading profile…" />;
  if (error && !profile) return <Alert variant="error">{error}</Alert>;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title={String(profile.name ?? "My Profile")}
        description="Personal and employment details are read-only. Contact HR to request changes."
      />
      {error ? <Alert variant="error">{error}</Alert> : null}

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-white to-slate-50/40" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-black text-white shadow-md ring-4 ring-emerald-100">
              {String(profile.avatar ?? profile.name ?? "E")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-bold text-slate-900">{String(profile.name ?? "")}</p>
                {profile.status ? (
                  <StatusBadge label={String(profile.status)} />
                ) : null}
              </div>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                <Building2 className="h-3.5 w-3.5" />
                {String(profile.designation ?? "—")} · {String(profile.department ?? "—")}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-1 ring-1 ring-slate-200">
                  <IdCard className="h-3 w-3" />
                  {String(profile.empCode ?? "—")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {String(profile.email ?? "—")}
                </span>
                {profile.phone ? (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {String(profile.phone)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm lg:w-auto lg:min-w-[280px]">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
              Leave balance
            </p>
            <div className="mt-3">
              <LeaveBalanceTiles balance={leaveBalance} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className={section.title === "Bank & statutory" ? "lg:col-span-2" : ""}>
              <CardHeader
                title={section.title}
                action={
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${section.tone}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                }
              />
              <dl className="grid gap-3 sm:grid-cols-2">
                {section.fields.map(({ key, label }) => (
                  <div
                    key={key}
                    className="rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/60 px-3 py-2.5 transition-colors hover:border-emerald-100"
                  >
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium text-slate-800">
                      {profile[key] != null && profile[key] !== ""
                        ? String(profile[key])
                        : "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
