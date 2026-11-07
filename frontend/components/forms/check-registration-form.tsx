"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  Search,
  UserRound,
} from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Card } from "@/frontend/components/ui/card";
import { StatusBadge } from "@/frontend/components/ui/badge";
import { lookupRegistrationAction } from "@/backend/actions/public";
import { lookupSchema, type ActionState } from "@/shared/validation/schemas";

type LookupValues = { reference: string; phone: string };

type LookupData = {
  reference: string;
  visitorName: string;
  studentName: string;
  studentRegistrationNumber: string;
  trade: string;
  level: string;
  className: string;
  visitDate: string;
  visitDateLabel: string;
  purpose: string;
  status: string;
  statusLabel: string;
  attendanceStatus: string;
  attendanceLabel: string;
  arrivalTime: string | null;
  departureTime: string | null;
  submittedAt: string;
};

export function CheckRegistrationForm({ defaultReference = "" }: { defaultReference?: string }) {
  const [state, dispatch, pending] = useActionState<ActionState | undefined, FormData>(
    lookupRegistrationAction,
    undefined,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LookupValues>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { reference: defaultReference.toUpperCase(), phone: "" },
  });

  function onSubmit(values: LookupValues) {
    const formData = new FormData();
    formData.append("reference", values.reference);
    formData.append("phone", values.phone);
    dispatch(formData);
  }

  const result = state?.ok ? (state.data as unknown as LookupData) : null;

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-7">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reference">Registration reference</Label>
              <Input
                id="reference"
                placeholder="MVD-2026-XXXXXX"
                className="font-mono uppercase"
                invalid={Boolean(errors.reference)}
                {...register("reference")}
              />
              {errors.reference ? (
                <p className="flex items-center gap-1 text-[11px] font-medium text-danger">
                  <AlertCircle className="size-3" />
                  {errors.reference.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number used to register</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="0788 123 456"
                invalid={Boolean(errors.phone)}
                {...register("phone")}
              />
              {errors.phone ? (
                <p className="flex items-center gap-1 text-[11px] font-medium text-danger">
                  <AlertCircle className="size-3" />
                  {errors.phone.message}
                </p>
              ) : null}
            </div>
          </div>

          {state && !state.ok ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {state.message}
            </div>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Search />}
            {pending ? "Checking…" : "Check registration"}
          </Button>
        </form>
      </Card>

      {result ? (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-line bg-gradient-to-r from-emerald-50/70 to-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                  Registration found
                </p>
                <p className="font-mono text-sm font-semibold text-navy">{result.reference}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={result.status} />
              <StatusBadge status={result.attendanceStatus} />
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-surface text-primary ring-1 ring-line">
                  <UserRound className="size-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Visitor
                  </p>
                  <p className="text-sm font-semibold text-navy">{result.visitorName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-surface text-primary ring-1 ring-line">
                  <GraduationCap className="size-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Student
                  </p>
                  <p className="text-sm font-semibold text-navy">{result.studentName}</p>
                  <p className="text-[11px] text-slate-400">
                    {result.studentRegistrationNumber} · {result.trade} {result.level} ·{" "}
                    {result.className}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-surface text-primary ring-1 ring-line">
                  <CalendarDays className="size-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Visit date
                  </p>
                  <p className="text-sm font-semibold text-navy">{result.visitDateLabel}</p>
                  <p className="text-[11px] text-slate-400">Purpose: {result.purpose}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-surface text-primary ring-1 ring-line">
                  <Clock3 className="size-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Attendance
                  </p>
                  <p className="text-sm font-semibold text-navy">{result.attendanceLabel}</p>
                  <p className="text-[11px] text-slate-400">
                    {result.arrivalTime ? `Arrived ${result.arrivalTime}` : "Arrival not yet recorded"}
                    {result.departureTime ? ` · Departed ${result.departureTime}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-surface p-4 text-[12px] leading-relaxed text-slate-500 sm:col-span-2">
              <span className="font-semibold text-navy">Submitted:</span> {result.submittedAt} ·{" "}
              <span className="font-semibold text-navy">Status:</span> {result.statusLabel}. Please
              present this reference and a valid ID at the school reception on visit day.
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
