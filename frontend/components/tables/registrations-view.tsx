import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ClipboardList,
  Eye,
  FileBarChart2,
  LogIn,
  LogOut,
  Plus,
  Search,
} from "lucide-react";
import { PageHeader } from "@/frontend/components/ui/page-header";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { StatusBadge } from "@/frontend/components/ui/badge";
import { EmptyState } from "@/frontend/components/ui/empty-state";
import { Pagination } from "@/frontend/components/ui/pagination";
import { ActionDialog } from "@/frontend/components/ui/action-dialog";
import { RegistrationFilters } from "@/frontend/components/tables/registration-filters";
import { recordArrivalAction, recordDepartureAction } from "@/backend/actions/attendance";
import {
  formatDateKigali,
  formatDateTimeKigali,
} from "@/shared/utils";
import type { Paginated, RegistrationFilters as Filters, RegistrationRow, Role } from "@/shared/types";

export type RegistrationSearchParams = {
  search?: string;
  status?: string;
  trade?: string;
  level?: string;
  date?: string;
  attendance?: string;
  class?: string;
  page?: string;
  sort?: string;
  direction?: string;
};

export function RegistrationsView({
  role,
  params,
  data,
}: {
  role: Role;
  params: RegistrationSearchParams;
  data: Paginated<RegistrationRow>;
}) {
  const base = role === "admin" ? "/admin" : "/dean";

  function sortHref(field: string) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) search.set(key, value);
    });
    search.set("sort", field);
    search.set(
      "direction",
      params.sort === field && params.direction !== "asc" ? "asc" : "desc",
    );
    search.delete("page");
    return `${base}/registrations?${search.toString()}`;
  }

  function SortHeader({ field, label }: { field: string; label: string }) {
    const active = params.sort === field;
    const Icon = !active ? ArrowUpDown : params.direction === "asc" ? ArrowUp : ArrowDown;
    return (
      <Link
        href={sortHref(field)}
        className="inline-flex items-center gap-1.5 hover:text-navy"
      >
        {label}
        <Icon className={active ? "size-3 text-primary" : "size-3 text-slate-300"} />
      </Link>
    );
  }

  const hasFilters = Boolean(
    params.search || params.status || params.trade || params.level || params.date || params.attendance,
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={role === "admin" ? "Registration management" : "Visitor registrations"}
        title="Registrations"
        description="Search, filter and manage every visitor registration. All changes are saved to the database and recorded in the audit trail."
        actions={
          <>
            {role === "admin" ? (
              <Link href="/admin/registrations/new">
                <Button size="sm">
                  <Plus />
                  New registration
                </Button>
              </Link>
            ) : null}
            <Link href={`${base}/reports`}>
              <Button size="sm" variant="outline">
                <FileBarChart2 />
                Reports
              </Button>
            </Link>
          </>
        }
      />

      <RegistrationFilters />

      <Card className="overflow-hidden">
        {data.rows.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState
              icon={hasFilters ? Search : ClipboardList}
              title={hasFilters ? "No matching registrations" : "No registrations yet"}
              description={
                hasFilters
                  ? "Try adjusting your search or filters to find the visitor you are looking for."
                  : "Registrations submitted by parents and guardians will appear here."
              }
              action={
                hasFilters ? (
                  <Link href={`${base}/registrations`}>
                    <Button variant="outline" size="sm">
                      Clear filters
                    </Button>
                  </Link>
                ) : role === "admin" ? (
                  <Link href="/admin/registrations/new">
                    <Button size="sm">
                      <Plus />
                      Register a visitor
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface/70">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <SortHeader field="visitor" label="Visitor" />
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <SortHeader field="student" label="Student" />
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <SortHeader field="trade" label="Trade / Level" />
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <SortHeader field="visit_date" label="Visit date" />
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      <SortHeader field="status" label="Status" />
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Attendance
                    </th>
                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
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
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {row.visitor.phone}
                        </p>
                        <p className="font-mono text-[10px] text-slate-400">{row.reference_code}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-700">{row.student.full_name}</p>
                        <p className="text-[11px] text-slate-400">
                          {row.student.registration_number} · {row.student.class_name}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                          {row.student.trade} · {row.student.level}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[13px] font-medium text-slate-700">
                          {formatDateKigali(row.visit_day.visit_date, "dd MMM yyyy")}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatDateTimeKigali(row.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={row.attendance?.status ?? "expected"} />
                        {row.attendance?.arrival_time ? (
                          <p className="mt-1 text-[10px] text-slate-400">
                            In {formatDateKigali(row.attendance.arrival_time, "HH:mm")}
                            {row.attendance.departure_time
                              ? ` · Out ${formatDateKigali(row.attendance.departure_time, "HH:mm")}`
                              : ""}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {row.status !== "cancelled" &&
                          row.status !== "completed" &&
                          !row.attendance?.arrival_time ? (
                            <ActionDialog
                              trigger={
                                <Button size="sm" variant="outline" className="h-8 px-2.5 text-[11px]">
                                  <LogIn className="size-3.5" />
                                  Arrive
                                </Button>
                              }
                              title="Record visitor arrival?"
                              description={`Confirm that ${row.visitor.full_name} has arrived at the school. The current time will be recorded.`}
                              confirmLabel="Record arrival"
                              variant="success"
                              action={recordArrivalAction}
                              hidden={{ registrationId: row.id }}
                              successMessage="Visitor arrival recorded."
                            />
                          ) : null}
                          {row.attendance?.arrival_time && !row.attendance?.departure_time ? (
                            <ActionDialog
                              trigger={
                                <Button size="sm" variant="outline" className="h-8 px-2.5 text-[11px]">
                                  <LogOut className="size-3.5" />
                                  Depart
                                </Button>
                              }
                              title="Record visitor departure?"
                              description={`Confirm that ${row.visitor.full_name} has left the school. The visit will be marked as completed.`}
                              confirmLabel="Record departure"
                              variant="navy"
                              action={recordDepartureAction}
                              hidden={{ registrationId: row.id }}
                              successMessage="Visitor departure recorded."
                            />
                          ) : null}
                          <Link href={`${base}/registrations/${row.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 px-2.5 text-[11px]">
                              <Eye className="size-3.5" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
            />
          </>
        )}
      </Card>
    </div>
  );
}

export function toRegistrationFilters(params: RegistrationSearchParams): Filters {
  return {
    search: params.search,
    status: params.status,
    trade: params.trade,
    level: params.level,
    className: params.class,
    visitDate: params.date,
    attendance: params.attendance,
    page: params.page ? Number(params.page) : 1,
    pageSize: 10,
    sort: params.sort,
    direction: params.direction === "asc" ? "asc" : "desc",
  };
}
