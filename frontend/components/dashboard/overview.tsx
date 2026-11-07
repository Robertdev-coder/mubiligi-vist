import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileBarChart2,
  Plus,
  UserCheck,
  UserRound,
  UserX,
  Users,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/frontend/components/ui/page-header";
import { StatCard } from "@/frontend/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { Badge, StatusBadge } from "@/frontend/components/ui/badge";
import { EmptyState } from "@/frontend/components/ui/empty-state";
import { ActivityChart, StatusPie } from "@/frontend/components/dashboard/charts";
import {
  formatDateKigali,
  formatDateTimeKigali,
  formatLongDateKigali,
  truncate,
} from "@/shared/utils";
import type { DashboardData, Role } from "@/shared/types";

export function DashboardOverview({
  data,
  role,
  userName,
}: {
  data: DashboardData;
  role: Role;
  userName: string;
}) {
  const base = role === "admin" ? "/admin" : "/dean";
  const { stats } = data;
  const greeting = getGreeting();
  const arrivalRate =
    stats.expectedVisitors > 0 ? Math.round((stats.arrived / stats.expectedVisitors) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={role === "admin" ? "Administration overview" : "Discipline office"}
        title={`${greeting}, ${userName.split(" ")[0]}`}
        description={`${formatLongDateKigali(stats.date)} · Here is what is happening for MUBILIGI VISIT DAY.`}
        actions={
          <>
            {role === "admin" ? (
              <Link href="/admin/registrations/new">
                <Button size="sm">
                  <Plus />
                  Register visitor
                </Button>
              </Link>
            ) : null}
            <Link href={`${base}/reports/print?date=${stats.date}`} target="_blank">
              <Button size="sm" variant="outline">
                <FileBarChart2 />
                Print attendance
              </Button>
            </Link>
            <Link href={`${base}/registrations`}>
              <Button size="sm" variant="outline">
                <ClipboardList />
                Registrations
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Registrations today"
          value={stats.totalRegistrations}
          hint={`${stats.newRegistrations} pending review`}
          icon={ClipboardList}
          tone="blue"
        />
        <StatCard
          label="Expected visitors"
          value={stats.expectedVisitors}
          hint="Pending + confirmed"
          icon={Users}
          tone="navy"
        />
        <StatCard
          label="Visitors arrived"
          value={stats.arrived}
          hint={`${arrivalRate}% of expected`}
          icon={UserCheck}
          tone="green"
        />
        <StatCard
          label="Not yet arrived"
          value={stats.notArrived}
          hint="Expected but not checked in"
          icon={UserX}
          tone="amber"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Currently on campus"
          value={stats.onCampus}
          hint="Arrived, not yet departed"
          icon={UserRound}
          tone="sky"
        />
        <StatCard
          label="Completed visits"
          value={stats.completed}
          hint="Arrived and departed"
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          label="Cancelled"
          value={stats.cancelled}
          hint="Cancelled registrations"
          icon={XCircle}
          tone="red"
        />
        <StatCard
          label="Upcoming visitors"
          value={stats.totalUpcoming}
          hint="Future visit days"
          icon={CalendarClock}
          tone="slate"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Registration activity</CardTitle>
              <p className="text-xs text-muted">Registrations and arrivals over the last 7 days</p>
            </div>
            <Badge variant="neutral">Last 7 days</Badge>
          </CardHeader>
          <CardContent>
            <ActivityChart data={data.trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registration status</CardTitle>
            <p className="text-xs text-muted">Status breakdown for the selected visit day</p>
          </CardHeader>
          <CardContent>
            <StatusPie data={data.statusBreakdown} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent registrations</CardTitle>
              <p className="text-xs text-muted">Latest visitor registrations for today</p>
            </div>
            <Link
              href={`${base}/registrations`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-0 pb-0 sm:px-0">
            {data.recent.length === 0 ? (
              <div className="px-5 pb-6 sm:px-6">
                <EmptyState
                  icon={ClipboardList}
                  title="No registrations yet"
                  description="Visitor registrations for this visit day will appear here as soon as they are submitted."
                  action={
                    role === "admin" ? (
                      <Link href="/admin/registrations/new">
                        <Button size="sm">
                          <Plus />
                          Register a visitor
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/dean/registrations">
                        <Button size="sm" variant="outline">
                          Open registrations
                        </Button>
                      </Link>
                    )
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-line bg-surface/60">
                      <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        Visitor
                      </th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Student
                      </th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:px-6">
                        Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((row) => (
                      <tr key={row.id} className="border-b border-line/60 last:border-0 hover:bg-surface/50">
                        <td className="px-5 py-3 sm:px-6">
                          <Link
                            href={`${base}/registrations/${row.id}`}
                            className="font-semibold text-navy hover:text-primary"
                          >
                            {row.visitor.full_name}
                          </Link>
                          <p className="text-[11px] text-slate-400">{row.visitor.phone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-700">{row.student.full_name}</p>
                          <p className="text-[11px] text-slate-400">{row.student.class_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-5 py-3 text-right text-[11px] text-slate-400 sm:px-6">
                          {formatDateTimeKigali(row.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Notifications</CardTitle>
              <p className="text-xs text-muted">New registration alerts</p>
            </div>
            <span className="relative flex size-8 items-center justify-center rounded-lg bg-sky-soft text-primary">
              <BellRing className="size-4" />
              {data.unreadNotifications > 0 ? (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
                  {data.unreadNotifications}
                </span>
              ) : null}
            </span>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.notifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-surface/50 px-4 py-8 text-center">
                <BellRing className="mx-auto size-5 text-slate-300" />
                <p className="mt-2 text-xs text-slate-400">No notifications yet.</p>
              </div>
            ) : (
              data.notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-xl border border-line/70 bg-surface/40 p-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-navy">{notification.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                        {truncate(notification.message, 110)}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
                        {formatDateKigali(notification.created_at, "dd MMM, HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Upcoming visits</CardTitle>
            <p className="text-xs text-muted">Registrations for the next visit days</p>
          </div>
          <Link
            href={`${base}/registrations`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Manage <ArrowRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {data.upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming visits"
              description="Future visit-day registrations will be listed here."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.upcoming.map((row) => (
                <Link
                  key={row.id}
                  href={`${base}/registrations/${row.id}`}
                  className="card-hover flex items-start gap-3 rounded-xl border border-line bg-white p-4"
                >
                  <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-navy text-white">
                    <span className="text-[8px] font-semibold uppercase text-sky-200/80">
                      {formatDateKigali(row.visit_day.visit_date, "MMM")}
                    </span>
                    <span className="text-sm font-bold leading-none">
                      {formatDateKigali(row.visit_day.visit_date, "dd")}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-navy">
                      {row.visitor.full_name}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {row.student.full_name} · {row.student.class_name}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Clock3 className="size-3" />
                      {row.visit_day.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Africa/Kigali",
    }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
