"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  UserCog,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/frontend/components/ui/dialog";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Select } from "@/frontend/components/ui/select";
import { EmptyState } from "@/frontend/components/ui/empty-state";
import { ActionDialog } from "@/frontend/components/ui/action-dialog";
import {
  createStaffAction,
  toggleStaffActiveAction,
  updateStaffRoleAction,
} from "@/backend/actions/staff";
import type { ActionState } from "@/shared/validation/schemas";
import { ROLES } from "@/shared/constants";
import { formatDateKigali, initials } from "@/shared/utils";
import type { Profile } from "@/shared/types";

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

function StaffDialog({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState | undefined, FormData>(
    createStaffAction,
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add staff account</DialogTitle>
          <DialogDescription>
            Create a new administrator or Dean of Discipline account. They can sign in immediately
            with the password you set.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <Field label="Full name" htmlFor="full_name" error={errors.full_name}>
            <Input
              id="full_name"
              name="full_name"
              placeholder="e.g. Aline Uwera"
              invalid={Boolean(errors.full_name)}
              required
            />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@mubiligi.rw"
              invalid={Boolean(errors.email)}
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role" htmlFor="role" error={errors.role}>
              <Select id="role" name="role" defaultValue="dean">
                {ROLES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Password"
              htmlFor="password"
              hint="At least 8 characters"
              error={errors.password}
            >
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                invalid={Boolean(errors.password)}
                required
              />
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus />}
              Create account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function StaffPanel({
  staff,
  currentUserId,
}: {
  staff: Profile[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-navy">Staff access</h2>
          <p className="text-xs text-muted">
            Manage who can sign in to the staff workspace and what they are allowed to do.
          </p>
        </div>
        <StaffDialog
          trigger={
            <Button size="sm">
              <UserPlus />
              Add staff
            </Button>
          }
        />
      </div>

      {staff.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No staff accounts"
          description="Add an administrator or Dean of Discipline to access the workspace."
          action={
            <StaffDialog
              trigger={
                <Button size="sm">
                  <UserPlus />
                  Add staff
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="grid gap-3">
          {staff.map((member) => {
            const isSelf = member.id === currentUserId;
            return (
              <Card key={member.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-navy text-sm font-bold text-white">
                      {initials(member.full_name)}
                    </span>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-[15px] font-semibold text-navy">
                          {member.full_name}
                        </h3>
                        {isSelf ? <Badge variant="default">You</Badge> : null}
                        <Badge variant={member.role === "admin" ? "navy" : "sky"}>
                          {member.role === "admin" ? "Administrator" : "Dean of Discipline"}
                        </Badge>
                        <Badge variant={member.is_active ? "success" : "neutral"}>
                          {member.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="flex items-center gap-1.5 truncate text-[12px] text-slate-500">
                        <Mail className="size-3.5 shrink-0 text-slate-400" />
                        {member.email}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Added {formatDateKigali(member.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <ActionDialog
                      trigger={
                        <Button size="sm" variant="outline" disabled={isSelf}>
                          <ShieldCheck />
                          Change role
                        </Button>
                      }
                      title="Change staff role?"
                      description={`Update the access level for ${member.full_name}.`}
                      confirmLabel="Update role"
                      action={updateStaffRoleAction}
                      hidden={{ staffId: member.id }}
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor={`role-${member.id}`}>Role</Label>
                        <Select
                          id={`role-${member.id}`}
                          name="role"
                          defaultValue={member.role}
                          disabled={isSelf}
                        >
                          {ROLES.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                        {isSelf ? (
                          <p className="text-[11px] text-slate-400">
                            You cannot change your own role.
                          </p>
                        ) : null}
                      </div>
                    </ActionDialog>

                    <ActionDialog
                      trigger={
                        <Button
                          size="sm"
                          variant={member.is_active ? "outline" : "success"}
                          disabled={isSelf}
                        >
                          {member.is_active ? <Ban /> : <CheckCircle2 />}
                          {member.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      }
                      title={member.is_active ? "Deactivate account?" : "Activate account?"}
                      description={
                        member.is_active
                          ? `${member.full_name} will no longer be able to sign in until the account is reactivated.`
                          : `${member.full_name} will be able to sign in again.`
                      }
                      confirmLabel={member.is_active ? "Deactivate" : "Activate"}
                      variant={member.is_active ? "destructive" : "success"}
                      action={toggleStaffActiveAction}
                      hidden={{
                        staffId: member.id,
                        isActive: member.is_active ? "false" : "true",
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
