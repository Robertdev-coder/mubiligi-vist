"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircle, ChevronDown, Loader2, Save } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Select } from "@/frontend/components/ui/select";
import { Textarea } from "@/frontend/components/ui/textarea";
import { updateRegistrationAction } from "@/backend/actions/registrations";
import {
  registrationUpdateSchema,
  type ActionState,
  type RegistrationUpdateInput,
} from "@/shared/validation/schemas";
import { LEVELS, REGISTRATION_STATUSES, RELATIONSHIPS, TRADES } from "@/shared/constants";
import { cn } from "@/shared/utils";
import type { RegistrationRow } from "@/shared/types";

function Field({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-[11px] font-medium text-danger">
          <AlertCircle className="size-3" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function RegistrationEditForm({ registration }: { registration: RegistrationRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, dispatch, pending] = useActionState<ActionState | undefined, FormData>(
    updateRegistrationAction,
    undefined,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationUpdateInput>({
    resolver: zodResolver(registrationUpdateSchema),
    defaultValues: {
      full_name: registration.visitor.full_name,
      phone: registration.visitor.phone,
      email: registration.visitor.email ?? "",
      relationship: registration.visitor.relationship,
      student_full_name: registration.student.full_name,
      trade: registration.student.trade,
      level: registration.student.level,
      class_name: registration.student.class_name,
      message: registration.message ?? "",
      status: registration.status,
    },
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message);
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  function onSubmit(values: RegistrationUpdateInput) {
    const formData = new FormData();
    formData.append("registrationId", registration.id);
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value === undefined || value === null ? "" : String(value));
    });
    dispatch(formData);
  }

  const serverErrors = state?.fieldErrors ?? {};

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-surface/60"
        aria-expanded={open}
      >
        <div>
          <h2 className="text-[15px] font-semibold text-navy">Edit registration</h2>
          <p className="text-xs text-muted">
            Correct visitor or student details, or change the registration status.
          </p>
        </div>
        <ChevronDown
          className={cn("size-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 border-t border-line p-5" noValidate>
          {state && !state.ok ? (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{state.message}</p>
            </div>
          ) : null}

          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Visitor details
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Full name"
                htmlFor="edit_full_name"
                error={errors.full_name?.message ?? serverErrors.full_name}
                className="sm:col-span-2"
              >
                <Input id="edit_full_name" invalid={Boolean(errors.full_name)} {...register("full_name")} />
              </Field>
              <Field label="Phone" htmlFor="edit_phone" error={errors.phone?.message ?? serverErrors.phone}>
                <Input id="edit_phone" type="tel" invalid={Boolean(errors.phone)} {...register("phone")} />
              </Field>
              <Field label="Email" htmlFor="edit_email" error={errors.email?.message ?? serverErrors.email}>
                <Input id="edit_email" type="email" invalid={Boolean(errors.email)} {...register("email")} />
              </Field>
              <Field
                label="Relationship"
                htmlFor="edit_relationship"
                error={errors.relationship?.message ?? serverErrors.relationship}
              >
                <Select id="edit_relationship" invalid={Boolean(errors.relationship)} {...register("relationship")}>
                  {RELATIONSHIPS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <div className="border-t border-line pt-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Student details
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Student full name"
                htmlFor="edit_student_full_name"
                error={errors.student_full_name?.message ?? serverErrors.student_full_name}
                className="sm:col-span-2"
              >
                <Input
                  id="edit_student_full_name"
                  invalid={Boolean(errors.student_full_name)}
                  {...register("student_full_name")}
                />
              </Field>
              <Field label="Class" htmlFor="edit_class_name" error={errors.class_name?.message ?? serverErrors.class_name}>
                <Input
                  id="edit_class_name"
                  invalid={Boolean(errors.class_name)}
                  {...register("class_name")}
                />
              </Field>
              <Field label="Trade" htmlFor="edit_trade" error={errors.trade?.message ?? serverErrors.trade}>
                <Select id="edit_trade" invalid={Boolean(errors.trade)} {...register("trade")}>
                  {TRADES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} — {option.description}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Level" htmlFor="edit_level" error={errors.level?.message ?? serverErrors.level}>
                <Select id="edit_level" invalid={Boolean(errors.level)} {...register("level")}>
                  {LEVELS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <div className="border-t border-line pt-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Visit details
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status" htmlFor="edit_status" error={errors.status?.message ?? serverErrors.status}>
                <Select id="edit_status" invalid={Boolean(errors.status)} {...register("status")}>
                  {REGISTRATION_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Message"
                htmlFor="edit_message"
                error={errors.message?.message ?? serverErrors.message}
                className="sm:col-span-2"
              >
                <Textarea id="edit_message" invalid={Boolean(errors.message)} {...register("message")} />
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save />}
              Save changes
            </Button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}
