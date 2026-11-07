import type { Metadata } from "next";
import { requirePermission } from "@/backend/auth/session";
import { backend } from "@/backend/data";
import { todayKigali } from "@/shared/utils";
import { ErrorState } from "@/frontend/components/ui/error-state";
import { AttendanceBoard } from "@/frontend/components/attendance/attendance-board";
import type { RegistrationFilters } from "@/shared/types";

export const metadata: Metadata = { title: "Attendance" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pick(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DeanAttendancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requirePermission("attendance.view");
  const raw = await searchParams;
  const date = pick(raw.date) ?? todayKigali();

  const filters: RegistrationFilters = {
    search: pick(raw.search),
    status: pick(raw.status),
    trade: pick(raw.trade),
    level: pick(raw.level),
    className: pick(raw.class),
    visitDate: date,
    pageSize: 500,
    sort: pick(raw.sort),
    direction: pick(raw.direction) === "asc" ? "asc" : "desc",
  };

  try {
    const data = await backend.listRegistrations(filters);
    return <AttendanceBoard role="dean" date={date} rows={data.rows} actorId={user.id} />;
  } catch {
    return <ErrorState title="Could not load attendance" showHome={false} />;
  }
}
