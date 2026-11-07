import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Printer,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { PageHeader } from "@/frontend/components/ui/page-header";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { StatCard } from "@/frontend/components/ui/stat-card";
import { StatusBadge } from "@/frontend/components/ui/badge";
import { EmptyState } from "@/frontend/components/ui/empty-state";
import { AttendanceDatePicker } from "@/frontend/components/attendance/attendance-date-picker";
import { ReportExportButtons } from "@/frontend/components/reports/report-export-buttons";
import { REGISTRATION_STATUSES } from "@/shared/constants";
import { formatDateKigali, formatLongDateKigali, formatTimeKigali } from "@/shared/utils";
import type { RegistrationRow, Role } from "@/shared/types";

export function ReportsView({
  role,
  date,
  rows,
  summary,
}: {
  role: Role;
  date: string;
  rows: RegistrationRow[];
  summary: Record<string, number>;
}) {
  const base = role === "admin" ? "/admin" : "/dean";
  const expected = rows.filter((r) => r.status === "pending" || r.status === "confirmed").length;
  const arrived = rows.filter((r) => r.attendance?.arrival_time).length;
  const onCampus = rows.filter((r) => r.attendance?.status === "on_campus").length;
  const completed = rows.filter(
    (r) => r.status === "completed" || r.attendance?.status === "departed",
  ).length;
  const noShow = rows.filter((r) => r.attendance?.status === "no_show").length;
  const preview = rows.slice(0, 25);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Reports & exports"
        title="Visit reports"
        description={`Attendance summary and printable register for ${formatLongDateKigali(date)}. Export to CSV, Excel or PDF for record keeping.`}
        actions={
          <>
            <AttendanceDatePicker date={date} />
            <Link href={`${base}/reports/print?date=${date}`}>
              <Button size="sm">
                <Printer />
                Print register
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registrations" value={rows.length} hint="For the selected date" icon={ClipboardList} tone="blue" />
        <StatCard label="Expected" value={expected} hint="Pending & confirmed" icon={Users} tone="navy" />
        <StatCard label="Arrived" value={arrived} hint="Arrival recorded" icon={UserCheck} tone="green" />
        <StatCard label="On campus" value={onCampus} hint="Currently inside" icon={Clock3} tone="sky" />
        <StatCard label="Completed" value={completed} hint="Visits finished" icon={CheckCircle2} tone="green" />
        <StatCard label="No-shows" value={noShow} hint="Did not arrive" icon={UserX} tone="red" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold text-navy">Register preview</h2>
              <p className="text-xs text-muted">
                {rows.length > 25
                  ? `Showing the first 25 of ${rows.length} registrations. Export or print for the full register.`
                  : `${rows.length} registration${rows.length === 1 ? "" : "s"} on this date.`}
              </p>
            </div>
            <ReportExportButtons rows={rows} date={date} />
          </div>

          {preview.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={ClipboardList}
                title="No data for this date"
                description={`There are no registrations for ${formatDateKigali(date, "dd MMM yyyy")}. Choose another date to generate a report.`}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface/60">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">#</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Visitor</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Student</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Arrival</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Departure</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={row.id} className="border-b border-line/60 last:border-0">
                      <td className="px-5 py-3 text-[12px] text-slate-400">{index + 1}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`${base}/registrations/${row.id}`}
                          className="font-medium text-navy hover:text-primary"
                        >
                          {row.visitor.full_name}
                        </Link>
                        <p className="font-mono text-[10px] text-slate-400">{row.reference_code}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[13px] text-slate-700">{row.student.full_name}</p>
                        <p className="text-[11px] text-slate-400">
                          {row.student.trade} · {row.student.level}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-600">
                        {row.attendance?.arrival_time ? formatTimeKigali(row.attendance.arrival_time) : "—"}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-slate-600">
                        {row.attendance?.departure_time ? formatTimeKigali(row.attendance.departure_time) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-navy">All-time status summary</h2>
            <p className="mt-0.5 text-xs text-muted">Every registration in the system.</p>
            <div className="mt-4 space-y-2">
              {REGISTRATION_STATUSES.map((status) => (
                <div
                  key={status.value}
                  className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5"
                >
                  <StatusBadge status={status.value} />
                  <span className="text-sm font-semibold text-navy">{summary[status.value] ?? 0}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-blue-100 bg-sky-soft/50 p-5">
            <h2 className="text-[15px] font-semibold text-navy">Need a signed copy?</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              The print view produces an A4 attendance register with signature and remarks columns,
              ready for the Dean of Discipline to sign.
            </p>
            <Link href={`${base}/reports/print?date=${date}`} className="mt-3 block">
              <Button size="sm" className="w-full">
                <Printer />
                Open print view
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
