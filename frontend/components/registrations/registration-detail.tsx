import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  GraduationCap,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Printer,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/frontend/components/ui/page-header";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { StatusBadge } from "@/frontend/components/ui/badge";
import { ActionDialog } from "@/frontend/components/ui/action-dialog";
import { RegistrationEditForm } from "@/frontend/components/forms/registration-edit-form";
import {
  deleteRegistrationAction,
  updateStatusAction,
} from "@/backend/actions/registrations";
import {
  completeVisitAction,
  markNoShowAction,
  recordArrivalAction,
  recordDepartureAction,
} from "@/backend/actions/attendance";
import {
  formatDateTimeKigali,
  formatLongDateKigali,
  formatTimeKigali,
} from "@/shared/utils";
import { RELATIONSHIP_LABEL, TRADE_DESCRIPTION, workspaceFor } from "@/shared/constants";
import type { RegistrationRow, Role } from "@/shared/types";

function Detail({
  label,
  value,
  icon: Icon,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {Icon ? <Icon className="size-3" /> : null}
        {label}
      </p>
      <p
        className={
          mono
            ? "mt-1 break-words font-mono text-[13px] text-slate-700"
            : "mt-1 break-words text-[13px] font-medium text-slate-700"
        }
      >
        {value || "—"}
      </p>
    </div>
  );
}

export function RegistrationDetail({
  role,
  registration,
}: {
  role: Role;
  registration: RegistrationRow;
}) {
  const base = workspaceFor(role);
  const attendance = registration.attendance;
  const arrived = Boolean(attendance?.arrival_time);
  const departed = Boolean(attendance?.departure_time);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={registration.reference_code}
        title={registration.visitor.full_name}
        description={`Visiting ${registration.student.full_name} on ${formatLongDateKigali(registration.visit_day.visit_date)}.`}
        actions={
          <>
            <Link href={`${base}/registrations`}>
              <Button variant="outline" size="sm">
                <ArrowLeft />
                Back
              </Button>
            </Link>
            <Link href={`${base}/reports/print?date=${registration.visit_day.visit_date}`}>
              <Button variant="outline" size="sm">
                <Printer />
                Print register
              </Button>
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={registration.status} />
        <StatusBadge status={attendance?.status ?? "expected"} />
        <span className="text-[11px] text-slate-400">
          Submitted {formatDateTimeKigali(registration.created_at)}
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <UserRound className="size-4 text-primary" />
              <h2 className="text-[15px] font-semibold text-navy">Visitor information</h2>
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Detail label="Full name" value={registration.visitor.full_name} icon={UserRound} />
              <Detail label="Relationship" value={RELATIONSHIP_LABEL[registration.visitor.relationship]} />
              <Detail
                label="Phone"
                value={
                  <a href={`tel:${registration.visitor.phone}`} className="text-primary hover:underline">
                    {registration.visitor.phone}
                  </a>
                }
                icon={Phone}
              />
              <Detail
                label="Email"
                value={
                  registration.visitor.email ? (
                    <a href={`mailto:${registration.visitor.email}`} className="text-primary hover:underline">
                      {registration.visitor.email}
                    </a>
                  ) : null
                }
                icon={Mail}
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <GraduationCap className="size-4 text-primary" />
              <h2 className="text-[15px] font-semibold text-navy">Student information</h2>
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Detail label="Student name" value={registration.student.full_name} />
              <Detail
                label="Trade"
                value={`${registration.student.trade} — ${TRADE_DESCRIPTION[registration.student.trade]}`}
              />
              <Detail
                label="Level / Class"
                value={`${registration.student.level} · ${registration.student.class_name}`}
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <CalendarClock className="size-4 text-primary" />
              <h2 className="text-[15px] font-semibold text-navy">Visit information</h2>
            </div>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Detail
                label="Visit day"
                value={formatLongDateKigali(registration.visit_day.visit_date)}
                icon={CalendarClock}
              />
              <Detail label="Visit title" value={registration.visit_day.title} />
              <Detail
                label="Registration window"
                value={`${formatDateTimeKigali(registration.visit_day.registration_open)} → ${formatDateTimeKigali(registration.visit_day.registration_close)}`}
                icon={Clock}
              />
              {registration.visit_day.instructions ? (
                <div className="sm:col-span-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <MapPin className="size-3" />
                    Visit instructions
                  </p>
                  <p className="mt-1 whitespace-pre-line rounded-lg bg-surface p-3 text-[13px] leading-relaxed text-slate-600">
                    {registration.visit_day.instructions}
                  </p>
                </div>
              ) : null}
              {registration.message ? (
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Visitor message
                  </p>
                  <p className="mt-1 whitespace-pre-line rounded-lg bg-surface p-3 text-[13px] leading-relaxed text-slate-600">
                    {registration.message}
                  </p>
                </div>
              ) : null}
            </div>
          </Card>

          <RegistrationEditForm registration={registration} />
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-navy">Attendance</h2>
            <p className="mt-0.5 text-xs text-muted">Record the visitor&apos;s movement on campus.</p>

            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
                <span className="text-xs text-slate-500">Arrival</span>
                <span className="text-[13px] font-semibold text-navy">
                  {arrived ? formatTimeKigali(attendance?.arrival_time) : "Not recorded"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
                <span className="text-xs text-slate-500">Departure</span>
                <span className="text-[13px] font-semibold text-navy">
                  {departed ? formatTimeKigali(attendance?.departure_time) : "Not recorded"}
                </span>
              </div>
              {registration.recorded_by_name ? (
                <p className="text-[11px] text-slate-400">
                  Last recorded by {registration.recorded_by_name}
                </p>
              ) : null}
            </div>

            {registration.status === "cancelled" ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-700">
                This registration was cancelled. Attendance actions are disabled.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {!arrived ? (
                  <ActionDialog
                    trigger={
                      <Button size="sm" variant="success" className="w-full">
                        <LogIn />
                        Arrive
                      </Button>
                    }
                    title="Record visitor arrival?"
                    description={`Confirm that ${registration.visitor.full_name} has arrived. The current Kigali time will be recorded.`}
                    confirmLabel="Record arrival"
                    variant="success"
                    action={recordArrivalAction}
                    hidden={{ registrationId: registration.id }}
                  />
                ) : null}
                {arrived && !departed ? (
                  <ActionDialog
                    trigger={
                      <Button size="sm" variant="navy" className="w-full">
                        <LogOut />
                        Depart
                      </Button>
                    }
                    title="Record visitor departure?"
                    description={`Confirm that ${registration.visitor.full_name} has left the school. The visit will be marked as completed.`}
                    confirmLabel="Record departure"
                    variant="navy"
                    action={recordDepartureAction}
                    hidden={{ registrationId: registration.id }}
                  />
                ) : null}
                {!arrived ? (
                  <ActionDialog
                    trigger={
                      <Button size="sm" variant="outline" className="w-full">
                        <XCircle />
                        No show
                      </Button>
                    }
                    title="Mark visitor as no-show?"
                    description="Use this only when the visitor did not arrive on the visit day."
                    confirmLabel="Mark no-show"
                    variant="warning"
                    action={markNoShowAction}
                    hidden={{ registrationId: registration.id }}
                  />
                ) : null}
                {registration.status !== "completed" ? (
                  <ActionDialog
                    trigger={
                      <Button size="sm" variant="outline" className="w-full">
                        <CheckCircle2 />
                        Complete
                      </Button>
                    }
                    title="Complete this visit?"
                    description="The registration will be marked as completed. You can still record attendance afterwards."
                    confirmLabel="Mark completed"
                    action={completeVisitAction}
                    hidden={{ registrationId: registration.id }}
                  />
                ) : null}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-navy">Registration status</h2>
            <div className="mt-3 space-y-2">
              {registration.status === "pending" ? (
                <ActionDialog
                  trigger={
                    <Button size="sm" variant="success" className="w-full">
                      <CheckCircle2 />
                      Confirm registration
                    </Button>
                  }
                  title="Confirm this registration?"
                  description="The visitor will be expected on the selected visit day."
                  confirmLabel="Confirm"
                  variant="success"
                  action={updateStatusAction}
                  hidden={{ registrationId: registration.id, status: "confirmed" }}
                />
              ) : null}
              {registration.status !== "cancelled" ? (
                <ActionDialog
                  trigger={
                    <Button size="sm" variant="outline" className="w-full text-danger">
                      <XCircle />
                      Cancel registration
                    </Button>
                  }
                  title="Cancel this registration?"
                  description="The visitor will no longer be expected. This can be reversed by editing the status later."
                  confirmLabel="Cancel registration"
                  variant="destructive"
                  action={updateStatusAction}
                  hidden={{ registrationId: registration.id, status: "cancelled" }}
                />
              ) : null}
              {registration.status === "cancelled" ? (
                <ActionDialog
                  trigger={
                    <Button size="sm" variant="outline" className="w-full">
                      <CheckCircle2 />
                      Restore as pending
                    </Button>
                  }
                  title="Restore this registration?"
                  description="The registration will return to pending and appear in the expected visitors list."
                  confirmLabel="Restore"
                  action={updateStatusAction}
                  hidden={{ registrationId: registration.id, status: "pending" }}
                />
              ) : null}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-navy">Timeline</h2>
            <ol className="mt-4 space-y-3 border-l border-line pl-4">
              <li className="relative">
                <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-sky-soft" />
                <p className="text-[12px] font-semibold text-navy">Registration submitted</p>
                <p className="text-[11px] text-slate-400">{formatDateTimeKigali(registration.created_at)}</p>
              </li>
              {arrived ? (
                <li className="relative">
                  <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-sky-500 ring-4 ring-sky-50" />
                  <p className="text-[12px] font-semibold text-navy">Visitor arrived</p>
                  <p className="text-[11px] text-slate-400">{formatDateTimeKigali(attendance?.arrival_time)}</p>
                </li>
              ) : null}
              {departed ? (
                <li className="relative">
                  <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                  <p className="text-[12px] font-semibold text-navy">Visitor departed</p>
                  <p className="text-[11px] text-slate-400">{formatDateTimeKigali(attendance?.departure_time)}</p>
                </li>
              ) : null}
              <li className="relative">
                <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-slate-300 ring-4 ring-slate-50" />
                <p className="text-[12px] font-semibold text-navy">Last updated</p>
                <p className="text-[11px] text-slate-400">{formatDateTimeKigali(registration.updated_at)}</p>
              </li>
            </ol>
          </Card>

          {role === "admin" ? (
            <Card className="border-red-100 p-5">
              <h2 className="text-[15px] font-semibold text-red-700">Danger zone</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Deleting a registration removes the visitor record, attendance and linked notifications.
                This action cannot be undone.
              </p>
              <div className="mt-3">
                <ActionDialog
                  trigger={
                    <Button size="sm" variant="destructive" className="w-full">
                      <Trash2 />
                      Delete registration
                    </Button>
                  }
                  title="Delete this registration permanently?"
                  description={`All data linked to ${registration.reference_code} will be removed. This cannot be undone.`}
                  confirmLabel="Delete permanently"
                  variant="destructive"
                  action={deleteRegistrationAction}
                  hidden={{ registrationId: registration.id }}
                  redirectTo={`${base}/registrations`}
                />
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
