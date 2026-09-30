import type { CalendarAttendanceOverlay } from "./employee-attendance";

const STATUS_FROM_API: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LEAVE: "On Leave",
  HOLIDAY: "Holiday",
  WEEKLY_OFF: "Weekly Off",
  PENDING: "Pending",
  LATE: "Late",
  "HALF DAY": "Half Day",
};

function formatPunchTime(value: unknown): string {
  if (!value) return "—";
  const raw = String(value);
  if (raw.includes("T")) {
    try {
      return new Date(raw).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return raw;
    }
  }
  return raw;
}

export function mapPortalAttendanceRow(row: Record<string, unknown>): {
  iso: string;
  overlay: CalendarAttendanceOverlay;
} {
  const iso = String(row.attendanceDate ?? "").slice(0, 10);
  const apiStatus = String(row.attendanceStatus ?? row.status ?? "PENDING").toUpperCase();
  let status = STATUS_FROM_API[apiStatus] ?? "Present";

  const dayType = String(row.dayType ?? "").toUpperCase();
  if (dayType === "HOLIDAY") status = "Holiday";
  if (dayType === "WEEKLY_OFF") status = "Weekly Off";
  if (dayType === "LEAVE" || apiStatus === "LEAVE") status = "On Leave";

  const remarks = String(row.remarks ?? "");
  if (remarks.toLowerCase().includes("late") && status === "Present") {
    status = "Late";
  }

  const holidayName = row.holidayName ? String(row.holidayName) : undefined;

  return {
    iso,
    overlay: {
      status,
      shiftName:
        status === "Holiday" && holidayName
          ? holidayName
          : String(row.shiftName ?? row.shiftType ?? "—"),
      checkIn: formatPunchTime(row.punchIn),
      checkOut: formatPunchTime(row.punchOut),
      workedHours: Number(row.workedHours ?? 0),
      leaveTypeName: row.leaveTypeName as string | undefined,
      dayType: String(row.dayType ?? ""),
    },
  };
}
