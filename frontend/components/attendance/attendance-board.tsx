import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  FileBarChart2,
  LogIn,
  Printer,
  UserCheck,
  UserX,
  Users,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/frontend/components/ui/page-header";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { StatCard } from "@/frontend/components/ui/stat-card";
import { StatusBadge } from "@/frontend/components/ui/badge";
import { EmptyState } from "@/frontend/components/ui/empty-state";
import { ActionDialog } from "@/frontend/components/ui/action-dialog";
import { RegistrationFilters } from "@/frontend/components/tables/registration-filters";
import { AttendanceDatePicker } from "@/frontend/components/attendance/attendance-date-picker";
import {
  completeVisitAction,
  markNoShowAction,
  recordArrivalAction,
} from "@/backend/actions/attendance";
import { OfflineGoneButton } from "@/frontend/components/attendance/offline-gone-button";
import { formatDateKigali, formatLongDateKigali, formatTimeKigali } from "@/shared/utils";
import type { RegistrationRow, Role } from "@/shared/types";

export function AttendanceBoard({
  role,
  date,
  rows,
  actorId,
}: {
  role: Role;
  date: string;
  rows: RegistrationRow[];
  actorId: string;
}) {
  const base = role === "admin" ? "/admin" : "/dean";
  const expected = rows.filter((r) => r.status === "pending" || r.status === "confirmed").length;
  const arrived = rows.filter((r) => r.attendance?.arrival_time).length;
  const onCampus = rows.filter((r) => r.attendance?.status === "on_campus").length;
  const notArrived = Math.max(0, expected - arrived);
  const completed = rows.filter(
    (r) => r.status === "completed" || r.attendance?.status === "departed",
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Attendance desk"
        title="Visitor attendance"
        description={`Record arrivals and departures for ${formatLongDateKigali(date)}. All times are recorded in Africa/Kigali.`}
        actions={
          <>
            <AttendanceDatePicker date={date} />
            <Link href={`${base}/reports/print?date=${date}`}>
              <Button size="sm" variant="outline">
                <Printer />
                Print register
              </Button>
            </Link>
            <Link href={`${base}/reports`}>
              <Button size="sm" variant="outline">
                <FileBarChart2 />
                Reports
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Expected" value={expected} hint="Pending & confirmed" icon={Users} tone="blue" />
        <StatCard label="Arrived" value={arrived} hint="Arrival recorded" icon={UserCheck} tone="green" />
        <StatCard label="On campus" value={onCampus} hint="Currently inside" icon={Clock3} tone="sky" />
        <StatCard label="Not arrived" value={notArrived} hint="Still expected" icon={UserX} tone="amber" />
      </div>

      <RegistrationFilters showAttendance={false} />

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState
              icon={UserCheck}
              title="No visitors for this date"
              description={`There are no registrations for ${formatDateKigali(date, "dd MMM yyyy")}. Choose another date or check the registrations page.`}
              action={
                <Link href={`${base}/registrations`}>
                  <Button variant="outline" size="sm">
                    View all registrations
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-line bg-surface/60 px-5 py-3">
              <p className="text-[12px] font-medium text-slate-500">
                {rows.length} registration{rows.length === 1 ? "" : "s"} · {completed} completed
              </p>
              <p className="text-[11px] text-slate-400">
                {formatDateKigali(date, "EEEE, dd MMMM yyyy")}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface/40">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Visitor
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Arrival
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Departure
                    </th>
                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const attendance = row.attendance;
                    const arrivedAt = attendance?.arrival_time;
                    const departedAt = attendance?.departure_time;
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-line/60 transition-colors last:border-0 hover:bg-surface/50"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            href={`${base}/registrations/${row.id}`}
                            className="font-semibold text-navy hover:text-primary"
                          >
                            {row.visitor.full_name}
                          </Link>
                          <p className="text-[11px] text-slate-400">{row.visitor.phone}</p>
                          <p className="font-mono text-[10px] text-slate-400">{row.reference_code}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-700">{row.student.full_name}</p>
                          <p className="text-[11px] text-slate-400">
                            {row.student.trade} · {row.student.level} · {row.student.class_name}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col items-start gap-1">
                            <StatusBadge status={row.status} />
                            <StatusBadge status={attendance?.status ?? "expected"} />
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={arrivedAt ? "font-semibold text-emerald-700" : "text-slate-400"}>
                            {arrivedAt ? formatTimeKigali(arrivedAt) : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={departedAt ? "font-semibold text-slate-700" : "text-slate-400"}>
                            {departedAt ? formatTimeKigali(departedAt) : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {row.status !== "cancelled" && !arrivedAt ? (
                              <ActionDialog
                                trigger={
                                  <Button size="sm" variant="success" className="h-8 px-2.5 text-[11px]">
                                    <LogIn className="size-3.5" />
                                    Arrive
                                  </Button>
                                }
                                title="Record visitor arrival?"
                                description={`Confirm that ${row.visitor.full_name} has arrived. The current Kigali time will be recorded.`}
                                confirmLabel="Record arrival"
                                variant="success"
                                action={recordArrivalAction}
                                hidden={{ registrationId: row.id }}
                              />
                            ) : null}
                            {arrivedAt && !departedAt ? (
                              <OfflineGoneButton
                                registrationId={row.id}
                                visitorName={row.visitor.full_name}
                                actorId={actorId}
                              />
                            ) : null}
                            {row.status !== "cancelled" && !arrivedAt ? (
                              <ActionDialog
                                trigger={
                                  <Button size="sm" variant="outline" className="h-8 px-2.5 text-[11px]">
                                    <XCircle className="size-3.5" />
                                    No show
                                  </Button>
                                }
                                title="Mark visitor as no-show?"
                                description="Use this only when the visitor did not arrive on the visit day."
                                confirmLabel="Mark no-show"
                                variant="warning"
                                action={markNoShowAction}
                                hidden={{ registrationId: row.id }}
                              />
                            ) : null}
                            {row.status !== "completed" && row.status !== "cancelled" ? (
                              <ActionDialog
                                trigger={
                                  <Button size="sm" variant="outline" className="h-8 px-2.5 text-[11px]">
                                    <CheckCircle2 className="size-3.5" />
                                    Complete
                                  </Button>
                                }
                                title="Complete this visit?"
                                description="The registration will be marked as completed."
                                confirmLabel="Mark completed"
                                action={completeVisitAction}
                                hidden={{ registrationId: row.id }}
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
