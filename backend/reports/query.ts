import "server-only";
import { backend } from "@/backend/data";
import type { RegistrationRow, ReportFilters, ReportMeta, SessionUser } from "@/shared/types";
import { formatDateKigali, todayKigali } from "@/shared/utils";
import { ATTENDANCE_STATUS_LABEL, REGISTRATION_STATUS_LABEL, SCHOOL } from "@/shared/constants";

export function parseReportFilters(source: URLSearchParams | Record<string, string | undefined>): ReportFilters {
  const get = (key: string): string | undefined => {
    const value = source instanceof URLSearchParams ? source.get(key) : source[key];
    return value?.trim() || undefined;
  };
  return {
    dateFrom: get("dateFrom"),
    dateTo: get("dateTo"),
    className: get("className"),
    student: get("student"),
    visitor: get("visitor"),
    status: get("status"),
    attendance: get("attendance"),
  };
}

export function reportQueryString(filters: ReportFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}

export function periodLabel(filters: ReportFilters): string {
  if (filters.dateFrom && filters.dateTo) {
    if (filters.dateFrom === filters.dateTo) {
      return formatDateKigali(`${filters.dateFrom}T12:00:00`, "EEEE, dd MMMM yyyy");
    }
    return `${formatDateKigali(`${filters.dateFrom}T12:00:00`, "dd MMM yyyy")} – ${formatDateKigali(
      `${filters.dateTo}T12:00:00`,
      "dd MMM yyyy",
    )}`;
  }
  if (filters.dateFrom) {
    return `From ${formatDateKigali(`${filters.dateFrom}T12:00:00`, "dd MMM yyyy")}`;
  }
  if (filters.dateTo) {
    return `Up to ${formatDateKigali(`${filters.dateTo}T12:00:00`, "dd MMM yyyy")}`;
  }
  return "All recorded visit days";
}

export function filtersLabel(filters: ReportFilters): string {
  const parts: string[] = [];
  if (filters.className) parts.push(`Class contains "${filters.className}"`);
  if (filters.student) parts.push(`Student "${filters.student}"`);
  if (filters.visitor) parts.push(`Visitor "${filters.visitor}"`);
  if (filters.status) parts.push(`Status: ${REGISTRATION_STATUS_LABEL[filters.status as keyof typeof REGISTRATION_STATUS_LABEL] ?? filters.status}`);
  if (filters.attendance) {
    parts.push(
      `Attendance: ${ATTENDANCE_STATUS_LABEL[filters.attendance as keyof typeof ATTENDANCE_STATUS_LABEL] ?? filters.attendance}`,
    );
  }
  return parts.length ? parts.join(" · ") : "No additional filters";
}

export interface ReportPayload {
  rows: RegistrationRow[];
  meta: ReportMeta;
  filters: ReportFilters;
}

export async function buildReport(filters: ReportFilters, user: SessionUser): Promise<ReportPayload> {
  const rows = await backend.getReportRowsByFilters(filters);
  return {
    rows,
    filters,
    meta: {
      title: `${SCHOOL.project} Attendance Report`,
      period_label: periodLabel(filters),
      generated_at: formatDateKigali(new Date(), "dd MMM yyyy, HH:mm"),
      generated_by: `${user.full_name} (${user.role_name})`,
      filters_label: filtersLabel(filters),
      row_count: rows.length,
    },
  };
}

export function defaultFilters(): ReportFilters {
  const today = todayKigali();
  return { dateFrom: today, dateTo: today };
}
