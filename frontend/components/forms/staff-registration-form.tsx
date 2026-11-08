"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Select } from "@/frontend/components/ui/select";
import { Textarea } from "@/frontend/components/ui/textarea";
import { createStaffRegistrationAction } from "@/backend/actions/registrations";
import { enqueueCheckIn } from "@/frontend/offline/attendance-queue";
import { OfflineQueuePanel } from "@/frontend/components/attendance/offline-queue-panel";
import {
  registrationSchema,
  type ActionState,
  type RegistrationFormValues,
  type RegistrationInput,
} from "@/shared/validation/schemas";
import { LEVELS, RELATIONSHIPS, TRADES } from "@/shared/constants";
import { cn, formatDateKigali } from "@/shared/utils";
import type { VisitDay } from "@/shared/types";

function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
        {!required ? (
          <span className="ml-1 text-[10px] font-normal text-slate-400">(optional)</span>
        ) : null}
      </Label>
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

export function StaffRegistrationForm({ visitDays, actorId }: { visitDays: VisitDay[]; actorId: string }) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<ActionState | undefined, FormData>(
    createStaffRegistrationAction,
    undefined,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegistrationFormValues, unknown, RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      relationship: "parent",
      studentFullName: "",
      studentRegistrationNumber: "",
      trade: "SOD",
      level: "L3",
      className: "",
      visitDayId: visitDays[0]?.id ?? "",
      message: "",
    },
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success("Parent checked in. Arrival time recorded; ready for the next parent.");
      reset({
        fullName: "",
        phone: "",
        email: "",
        relationship: "parent",
        studentFullName: "",
        studentRegistrationNumber: "",
        trade: "SOD",
        level: "L3",
        className: "",
        visitDayId: visitDays.find((day) => day.is_active)?.id ?? "",
        message: "",
      });
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, router, reset, visitDays]);

  async function onSubmit(values: RegistrationInput) {
    if (!navigator.onLine) {
      try {
        await enqueueCheckIn(values, actorId);
        toast.success("Parent saved on this device. Arrival time will be synchronized when online.");
        reset({
          fullName: "",
          phone: "",
          email: "",
          relationship: "parent",
          studentFullName: "",
          studentRegistrationNumber: "",
          trade: "SOD",
          level: "L3",
          className: "",
          visitDayId: visitDays.find((day) => day.is_active)?.id ?? "",
          message: "",
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save this record offline.");
      }
      return;
    }
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value === undefined || value === null ? "" : String(value));
    });
    formData.append("website", "");
    dispatch(formData);
  }

  const serverErrors = state?.fieldErrors ?? {};

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <OfflineQueuePanel actorId={actorId} />
      {state && !state.ok ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{state.message}</p>
        </div>
      ) : null}

      <Card className="p-5">
        <h2 className="border-b border-line pb-3 text-[15px] font-semibold text-navy">
          Visitor information
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Full name"
            htmlFor="fullName"
            required
            error={errors.fullName?.message ?? serverErrors.fullName}
            className="sm:col-span-2"
          >
            <Input id="fullName" placeholder="e.g. Jean Claude Habimana" invalid={Boolean(errors.fullName)} {...register("fullName")} />
          </Field>
          <Field label="Phone" htmlFor="phone" required error={errors.phone?.message ?? serverErrors.phone}>
            <Input id="phone" type="tel" placeholder="0788 123 456" invalid={Boolean(errors.phone)} {...register("phone")} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email?.message ?? serverErrors.email}>
            <Input id="email" type="email" placeholder="you@example.com" invalid={Boolean(errors.email)} {...register("email")} />
          </Field>
          <Field
            label="Relationship"
            htmlFor="relationship"
            required
            error={errors.relationship?.message ?? serverErrors.relationship}
          >
            <Select id="relationship" invalid={Boolean(errors.relationship)} {...register("relationship")}>
              {RELATIONSHIPS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="border-b border-line pb-3 text-[15px] font-semibold text-navy">
          Student information
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Student full name"
            htmlFor="studentFullName"
            required
            error={errors.studentFullName?.message ?? serverErrors.studentFullName}
            className="sm:col-span-2"
          >
            <Input id="studentFullName" invalid={Boolean(errors.studentFullName)} {...register("studentFullName")} />
          </Field>
          <Field label="Class" htmlFor="className" required error={errors.className?.message ?? serverErrors.className}>
            <Input id="className" placeholder="SOD L3 A" invalid={Boolean(errors.className)} {...register("className")} />
          </Field>
          <Field label="Trade" htmlFor="trade" required error={errors.trade?.message ?? serverErrors.trade}>
            <Select id="trade" invalid={Boolean(errors.trade)} {...register("trade")}>
              {TRADES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} — {option.description}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Level" htmlFor="level" required error={errors.level?.message ?? serverErrors.level}>
            <Select id="level" invalid={Boolean(errors.level)} {...register("level")}>
              {LEVELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="border-b border-line pb-3 text-[15px] font-semibold text-navy">
          Visit information
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Visit day"
            htmlFor="visitDayId"
            required
            error={errors.visitDayId?.message ?? serverErrors.visitDayId}
            className="sm:col-span-2"
          >
            <Select id="visitDayId" invalid={Boolean(errors.visitDayId)} {...register("visitDayId")}>
              {visitDays.map((day) => (
                <option key={day.id} value={day.id}>
                  {formatDateKigali(day.visit_date, "EEEE, dd MMMM yyyy")} — {day.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Message"
            htmlFor="message"
            error={errors.message?.message ?? serverErrors.message}
            className="sm:col-span-2"
          >
            <Textarea id="message" invalid={Boolean(errors.message)} {...register("message")} />
          </Field>
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus />}
          Check in parent
        </Button>
      </div>
    </form>
  );
}
