"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type LeaveType = {
  id: string;
  leaveCode?: string;
  leaveName?: string;
  payType?: string;
};

type PreviewDays = {
  calendarDays?: number;
  effectiveDays?: number;
  excluded?: Array<{ date?: string; reason?: string }>;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

export function ApplyLeaveModal({
  open,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [durationOption, setDurationOption] = useState("Full Day");
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<PreviewDays | null>(null);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setLoadingTypes(true);
    void api
      .get<LeaveType[]>("/api/employee-portal/leave/types")
      .then(setLeaveTypes)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load leave types"))
      .finally(() => setLoadingTypes(false));
  }, [open]);

  useEffect(() => {
    if (!open || !fromDate) {
      setPreview(null);
      return;
    }
    const to = toDate || fromDate;
    setPreviewLoading(true);
    const timer = setTimeout(() => {
      void api
        .post<PreviewDays>("/api/employee-portal/leave/applications/preview-days", {
          fromDate,
          toDate: to,
          durationOption,
        })
        .then(setPreview)
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [open, fromDate, toDate, durationOption]);

  function resetForm() {
    setLeaveTypeId("");
    setFromDate("");
    setToDate("");
    setDurationOption("Full Day");
    setReason("");
    setPreview(null);
    setError("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lt = leaveTypes.find((x) => x.id === leaveTypeId);
    if (!leaveTypeId || !fromDate || !toDate) {
      setError("Please select leave type and date range.");
      return;
    }

    const totalDays =
      durationOption === "Half Day"
        ? 0.5
        : (preview?.calendarDays ?? preview?.effectiveDays ?? 1);

    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/employee-portal/leave/applications", {
        leaveTypeId: lt?.id,
        leaveTypeCode: lt?.leaveCode,
        leaveTypeName: lt?.leaveName,
        isPaid: lt?.payType !== "Unpaid",
        durationOption,
        priority: "Normal",
        fromDate,
        toDate,
        totalDays,
        reason: reason.trim() || "Leave request submitted via employee portal.",
        appliedOn: new Date().toISOString(),
        approvalChain: [
          { role: "Reporting Manager", status: "Pending" },
          { role: "HR Manager", status: "Pending" },
        ],
      });
      resetForm();
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit leave");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Apply for leave"
      description="Submit a new leave request. HR will review and approve it."
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {error ? <Alert variant="error">{error}</Alert> : null}

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700">
            Leave type <span className="text-rose-500">*</span>
          </label>
          <select
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value)}
            required
            disabled={loadingTypes}
            className={inputClass}
          >
            <option value="">Select leave type</option>
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.leaveName ?? lt.leaveCode} ({lt.leaveCode})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              From date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                if (!toDate || e.target.value > toDate) setToDate(e.target.value);
              }}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              To date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700">Duration</label>
          <select
            value={durationOption}
            onChange={(e) => setDurationOption(e.target.value)}
            className={inputClass}
          >
            <option value="Full Day">Full day</option>
            <option value="Half Day">Half day</option>
          </select>
        </div>

        {fromDate ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <CalendarDays className="h-3.5 w-3.5" />
              {previewLoading ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Calculating days…
                </span>
              ) : (
                <span>
                  {durationOption === "Half Day"
                    ? "0.5 day requested"
                    : `${preview?.calendarDays ?? preview?.effectiveDays ?? "—"} calendar day(s)`}
                </span>
              )}
            </div>
            {preview?.excluded?.length ? (
              <p className="mt-1 text-[11px] text-emerald-700/80">
                {preview.excluded.length} date(s) excluded (weekly off / holiday)
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Brief reason for leave (optional)"
            className={inputClass}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || loadingTypes}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit application"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
