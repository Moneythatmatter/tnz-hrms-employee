"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquareWarning } from "lucide-react";
import { api } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type GrievanceCategory = {
  id: string;
  categoryName?: string;
  description?: string;
  slaDays?: number;
  defaultPriority?: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-xs transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RaiseGrievanceModal({
  open,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [categories, setCategories] = useState<GrievanceCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("Medium");
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setLoadingCategories(true);
    void api
      .get<GrievanceCategory[]>("/api/employee-portal/grievances/categories")
      .then((rows) => {
        setCategories(rows);
        if (rows[0]?.id) {
          setCategoryId(rows[0].id);
          const p = rows[0].defaultPriority;
          if (p && PRIORITIES.includes(p as (typeof PRIORITIES)[number])) {
            setPriority(p as (typeof PRIORITIES)[number]);
          }
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load categories"))
      .finally(() => setLoadingCategories(false));
  }, [open]);

  function resetForm() {
    setSubject("");
    setDescription("");
    setIncidentDate("");
    setPriority("Medium");
    if (categories[0]?.id) setCategoryId(categories[0].id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/employee-portal/grievances", {
        categoryId,
        subject: subject.trim(),
        description: description.trim(),
        incidentDate: incidentDate || undefined,
        priority,
      });
      resetForm();
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit grievance");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Raise a grievance"
      description="Describe your concern. HR will review and respond on this ticket."
      className="max-w-lg"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {error ? <Alert variant="error">{error}</Alert> : null}

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Category
          </label>
          {loadingCategories ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading categories…
            </p>
          ) : (
            <select
              value={categoryId}
              onChange={(e) => {
                const id = e.target.value;
                setCategoryId(id);
                const cat = categories.find((c) => c.id === id);
                const p = cat?.defaultPriority;
                if (p && PRIORITIES.includes(p as (typeof PRIORITIES)[number])) {
                  setPriority(p as (typeof PRIORITIES)[number]);
                }
              }}
              className={inputClass}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.categoryName ?? "Category"}
                </option>
              ))}
            </select>
          )}
          {selectedCategory?.description ? (
            <p className="mt-1.5 text-xs text-slate-500">{selectedCategory.description}</p>
          ) : null}
          {selectedCategory?.slaDays ? (
            <p className="mt-1 text-xs text-slate-500">
              HR SLA: action within <strong>{selectedCategory.slaDays} days</strong>.
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
            placeholder="Brief summary of the issue"
            maxLength={200}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Incident date
            </label>
            <input
              type="date"
              value={incidentDate}
              max={todayIso()}
              onChange={(e) => setIncidentDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}
              className={inputClass}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} min-h-[120px] resize-y`}
            placeholder="What happened? Include dates, people involved, and what outcome you expect."
            required
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || loadingCategories || !categoryId}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <MessageSquareWarning className="h-4 w-4" /> Submit grievance
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
