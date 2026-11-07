"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Loader2,
  MessageSquareText,
  Send,
  UserRound,
} from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Select } from "@/frontend/components/ui/select";
import { Textarea } from "@/frontend/components/ui/textarea";
import { submitRegistrationAction } from "@/backend/actions/public";
import {
  registrationSchema,
  type ActionState,
  type RegistrationInput,
} from "@/shared/validation/schemas";
import { LEVELS, PURPOSES, RELATIONSHIPS, TRADES } from "@/shared/constants";
import { cn, formatDateKigali } from "@/shared/utils";
import type { VisitDay } from "@/shared/types";

function Field({
  label,
  htmlFor,
  error,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
        {!required ? <span className="ml-1 text-[10px] font-normal text-slate-400">(optional)</span> : null}
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

function SectionHeading({
  icon: Icon,
  step,
  title,
  description,
}: {
  icon: React.ElementType;
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-line pb-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-soft text-primary ring-1 ring-blue-100">
        <Icon className="size-[18px]" />
      </span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/60">{step}</p>
        <h3 className="text-[15px] font-semibold text-navy">{title}</h3>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
    </div>
  );
}

export function RegistrationForm({ visitDays }: { visitDays: VisitDay[] }) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<ActionState | undefined, FormData>(
    submitRegistrationAction,
    undefined,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      nationalId: "",
      relationship: "parent",
      studentFullName: "",
      studentRegistrationNumber: "",
      trade: "SOD",
      level: "L3",
      className: "",
      visitDayId: visitDays[0]?.id ?? "",
      purpose: "academic",
      message: "",
    },
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      const reference = String(state.data?.reference ?? "");
      toast.success("Registration submitted successfully.");
      if (reference) router.push(`/registration-success/${reference}`);
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  function onSubmit(values: RegistrationInput) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value === undefined || value === null ? "" : String(value));
    });
    formData.append("website", "");
    dispatch(formData);
  }

  const serverFieldErrors = state?.fieldErrors ?? {};

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
      {state && !state.ok ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{state.message}</p>
        </div>
      ) : null}

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <section className="space-y-5">
        <SectionHeading
          icon={UserRound}
          step="Step 1"
          title="Visitor information"
          description="Tell us who is visiting the school."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Full name"
            htmlFor="fullName"
            required
            error={errors.fullName?.message ?? serverFieldErrors.fullName}
            className="sm:col-span-2"
          >
            <Input
              id="fullName"
              placeholder="e.g. Jean Claude Habimana"
              autoComplete="name"
              invalid={Boolean(errors.fullName ?? serverFieldErrors.fullName)}
              {...register("fullName")}
            />
          </Field>

          <Field
            label="Phone number"
            htmlFor="phone"
            required
            error={errors.phone?.message ?? serverFieldErrors.phone}
            hint="Use a valid Rwandan number. You will need it to check your registration."
          >
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="0788 123 456"
              autoComplete="tel"
              invalid={Boolean(errors.phone ?? serverFieldErrors.phone)}
              {...register("phone")}
            />
          </Field>

          <Field
            label="Email address"
            htmlFor="email"
            error={errors.email?.message ?? serverFieldErrors.email}
          >
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              invalid={Boolean(errors.email ?? serverFieldErrors.email)}
              {...register("email")}
            />
          </Field>

          <Field
            label="National ID number"
            htmlFor="nationalId"
            error={errors.nationalId?.message ?? serverFieldErrors.nationalId}
            hint="16 digits, if available."
          >
            <Input
              id="nationalId"
              inputMode="numeric"
              placeholder="1 1990 8 1234567 1 23"
              invalid={Boolean(errors.nationalId ?? serverFieldErrors.nationalId)}
              {...register("nationalId")}
            />
          </Field>

          <Field
            label="Relationship to student"
            htmlFor="relationship"
            required
            error={errors.relationship?.message ?? serverFieldErrors.relationship}
          >
            <Select
              id="relationship"
              invalid={Boolean(errors.relationship ?? serverFieldErrors.relationship)}
              {...register("relationship")}
            >
              {RELATIONSHIPS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading
          icon={GraduationCap}
          step="Step 2"
          title="Student information"
          description="Which student are you visiting?"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Student full name"
            htmlFor="studentFullName"
            required
            error={errors.studentFullName?.message ?? serverFieldErrors.studentFullName}
            className="sm:col-span-2"
          >
            <Input
              id="studentFullName"
              placeholder="e.g. Aline Uwase"
              invalid={Boolean(errors.studentFullName ?? serverFieldErrors.studentFullName)}
              {...register("studentFullName")}
            />
          </Field>

          <Field
            label="Student registration number"
            htmlFor="studentRegistrationNumber"
            required
            error={
              errors.studentRegistrationNumber?.message ??
              serverFieldErrors.studentRegistrationNumber
            }
            hint="As written on the student card, e.g. SOD/L3/001."
          >
            <Input
              id="studentRegistrationNumber"
              placeholder="SOD/L3/001"
              className="font-mono uppercase"
              invalid={Boolean(
                errors.studentRegistrationNumber ?? serverFieldErrors.studentRegistrationNumber,
              )}
              {...register("studentRegistrationNumber")}
            />
          </Field>

          <Field
            label="Student class"
            htmlFor="className"
            required
            error={errors.className?.message ?? serverFieldErrors.className}
            hint="e.g. SOD L3 A"
          >
            <Input
              id="className"
              placeholder="SOD L3 A"
              invalid={Boolean(errors.className ?? serverFieldErrors.className)}
              {...register("className")}
            />
          </Field>

          <Field
            label="Trade"
            htmlFor="trade"
            required
            error={errors.trade?.message ?? serverFieldErrors.trade}
          >
            <Select
              id="trade"
              invalid={Boolean(errors.trade ?? serverFieldErrors.trade)}
              {...register("trade")}
            >
              {TRADES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} — {option.description}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Level"
            htmlFor="level"
            required
            error={errors.level?.message ?? serverFieldErrors.level}
          >
            <Select
              id="level"
              invalid={Boolean(errors.level ?? serverFieldErrors.level)}
              {...register("level")}
            >
              {LEVELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading
          icon={CalendarDays}
          step="Step 3"
          title="Visit information"
          description="Choose the visit day and tell us the purpose of your visit."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Visit date"
            htmlFor="visitDayId"
            required
            error={errors.visitDayId?.message ?? serverFieldErrors.visitDayId}
            className="sm:col-span-2"
          >
            <Select
              id="visitDayId"
              invalid={Boolean(errors.visitDayId ?? serverFieldErrors.visitDayId)}
              {...register("visitDayId")}
            >
              {visitDays.map((day) => (
                <option key={day.id} value={day.id}>
                  {formatDateKigali(day.visit_date, "EEEE, dd MMMM yyyy")} — {day.title}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Purpose of visit"
            htmlFor="purpose"
            required
            error={errors.purpose?.message ?? serverFieldErrors.purpose}
          >
            <Select
              id="purpose"
              invalid={Boolean(errors.purpose ?? serverFieldErrors.purpose)}
              {...register("purpose")}
            >
              {PURPOSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Additional message"
            htmlFor="message"
            error={errors.message?.message ?? serverFieldErrors.message}
            className="sm:col-span-2"
            hint="Optional. Share any information the school should know before your visit."
          >
            <Textarea
              id="message"
              placeholder="e.g. I would like to discuss my child's academic progress with the class teacher."
              invalid={Boolean(errors.message ?? serverFieldErrors.message)}
              {...register("message")}
            />
          </Field>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-sky-soft/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-[12px] leading-relaxed text-slate-600">
            By submitting, you confirm that the information provided is accurate. The Dean of
            Discipline will be notified automatically.
          </p>
        </div>
        <Button type="submit" size="lg" disabled={pending} className="shrink-0">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send />}
          {pending ? "Submitting…" : "Submit registration"}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
        <ClipboardList className="size-3.5" />
        A unique registration reference will be generated for you.
        <MessageSquareText className="size-3.5" />
        Secure submission
      </div>
    </form>
  );
}
