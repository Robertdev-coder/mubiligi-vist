"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarDays,
  CalendarPlus,
  Clock,
  Lock,
  Loader2,
  Pencil,
  Save,
  Unlock,
} from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/frontend/components/ui/dialog";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Select } from "@/frontend/components/ui/select";
import { Textarea } from "@/frontend/components/ui/textarea";
import { EmptyState } from "@/frontend/components/ui/empty-state";
import { ActionDialog } from "@/frontend/components/ui/action-dialog";
import {
  createVisitDayAction,
  toggleVisitDayAction,
  updateVisitDayAction,
} from "@/backend/actions/visit-days";
import type { ActionState } from "@/shared/validation/schemas";
import {
  formatDateKigali,
  formatDateTimeKigali,
  toDateInputValue,
  toDateTimeLocalKigali,
  todayKigali,
} from "@/shared/utils";
import type { VisitDay } from "@/shared/types";

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-[11px] font-medium text-danger">
          <AlertCircle className="size-3" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

function dayStatus(day: VisitDay) {
  if (!day.is_active) {
    return { label: "Registration closed", variant: "neutral" as const };
  }
  const now = Date.now();
  if (new Date(day.registration_open).getTime() > now) {
    return { label: "Upcoming", variant: "warning" as const };
  }
  if (new Date(day.registration_close).getTime() < now) {
    return { label: "Window ended", variant: "danger" as const };
  }
  return { label: "Open now", variant: "success" as const };
}

export function VisitDayDialog({
  trigger,
  visitDay,
}: {
  trigger: React.ReactNode;
  visitDay?: VisitDay;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState | undefined, FormData>(
    visitDay ? updateVisitDayAction : createVisitDayAction,
    undefined,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  const errors = state?.fieldErrors ?? {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{visitDay ? "Edit visit day" : "Create visit day"}</DialogTitle>
          <DialogDescription>
            {visitDay
              ? "Update the visit details and registration window. Changes take effect immediately."
              : "Set the visit date, the registration window, and any instructions for visitors."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {visitDay ? <input type="hidden" name="visitDayId" value={visitDay.id} /> : null}

          <Field label="Title" htmlFor="title" error={errors.title}>
            <Input
              id="title"
              name="title"
              placeholder="Parents & Guardians Visit Day"
              defaultValue={visitDay?.title ?? ""}
              invalid={Boolean(errors.title)}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Visit date" htmlFor="visit_date" error={errors.visit_date}>
              <Input
                id="visit_date"
                name="visit_date"
                type="date"
                defaultValue={visitDay ? toDateInputValue(visitDay.visit_date) : todayKigali()}
                invalid={Boolean(errors.visit_date)}
                required
              />
            </Field>
            <Field label="Registration status" htmlFor="is_active">
              <Select
                id="is_active"
                name="is_active"
                defaultValue={visitDay && !visitDay.is_active ? "false" : "true"}
              >
                <option value="true">Open for registration</option>
                <option value="false">Closed</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Registration opens"
              htmlFor="registration_open"
              hint="Africa/Kigali time"
              error={errors.registration_open}
            >
              <Input
                id="registration_open"
                name="registration_open"
                type="datetime-local"
                defaultValue={toDateTimeLocalKigali(visitDay?.registration_open)}
                invalid={Boolean(errors.registration_open)}
                required
              />
            </Field>
            <Field
              label="Registration closes"
              htmlFor="registration_close"
              hint="Africa/Kigali time"
              error={errors.registration_close}
            >
              <Input
                id="registration_close"
                name="registration_close"
                type="datetime-local"
                defaultValue={toDateTimeLocalKigali(visitDay?.registration_close)}
                invalid={Boolean(errors.registration_close)}
                required
              />
            </Field>
          </div>

          <Field label="Visitor instructions" htmlFor="instructions" error={errors.instructions}>
            <Textarea
              id="instructions"
              name="instructions"
              placeholder="Bring a valid ID and report to the reception desk on arrival."
              defaultValue={visitDay?.instructions ?? ""}
              invalid={Boolean(errors.instructions)}
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save />}
              {visitDay ? "Save changes" : "Create visit day"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function VisitDaysPanel({ visitDays }: { visitDays: VisitDay[] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-navy">Visit days</h2>
          <p className="text-xs text-muted">
            Control the dates visitors can register for and the daily registration window.
          </p>
        </div>
        <VisitDayDialog
          trigger={
            <Button size="sm">
              <CalendarPlus />
              New visit day
            </Button>
          }
        />
      </div>

      {visitDays.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No visit days yet"
          description="Create your first visit day so parents and guardians can register."
          action={
            <VisitDayDialog
              trigger={
                <Button size="sm">
                  <CalendarPlus />
                  Create visit day
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="grid gap-3">
          {visitDays.map((day) => {
            const status = dayStatus(day);
            return (
              <Card key={day.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-navy">{day.title}</h3>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
                      <CalendarDays className="size-3.5 text-primary" />
                      {formatDateKigali(day.visit_date, "EEEE, dd MMMM yyyy")}
                    </p>
                    <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
                      <Clock className="size-3.5 text-slate-400" />
                      {formatDateTimeKigali(day.registration_open)} → {formatDateTimeKigali(day.registration_close)}
                    </p>
                    {day.instructions ? (
                      <p className="line-clamp-2 max-w-2xl text-[12px] leading-relaxed text-slate-500">
                        {day.instructions}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <VisitDayDialog
                      visitDay={day}
                      trigger={
                        <Button size="sm" variant="outline">
                          <Pencil />
                          Edit
                        </Button>
                      }
                    />
                    <ActionDialog
                      trigger={
                        <Button size="sm" variant={day.is_active ? "outline" : "success"}>
                          {day.is_active ? <Lock /> : <Unlock />}
                          {day.is_active ? "Close" : "Open"}
                        </Button>
                      }
                      title={day.is_active ? "Close registration?" : "Open registration?"}
                      description={
                        day.is_active
                          ? "Visitors will no longer be able to register for this visit day from the public site."
                          : "Visitors can register for this visit day while the registration window is open."
                      }
                      confirmLabel={day.is_active ? "Close registration" : "Open registration"}
                      variant={day.is_active ? "warning" : "success"}
                      action={toggleVisitDayAction}
                      hidden={{
                        visitDayId: day.id,
                        isActive: day.is_active ? "false" : "true",
                      }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
