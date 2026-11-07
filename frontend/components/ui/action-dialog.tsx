"use client";

import * as React from "react";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/frontend/components/ui/dialog";
import { Button } from "@/frontend/components/ui/button";
import type { ActionState } from "@/shared/validation/schemas";

type ActionFn = (prevState: ActionState | undefined, formData: FormData) => Promise<ActionState>;

export function ActionDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  action,
  hidden = {},
  children,
  successMessage,
  redirectTo,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive" | "success" | "navy" | "warning";
  action: ActionFn;
  hidden?: Record<string, string | number | undefined>;
  children?: React.ReactNode;
  successMessage?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(successMessage ?? state.message);
      setOpen(false);
      router.refresh();
      if (redirectTo) {
        router.push(redirectTo);
      }
    } else {
      toast.error(state.message);
    }
  }, [state, successMessage, redirectTo, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {Object.entries(hidden).map(([key, value]) =>
            value === undefined ? null : (
              <input key={key} type="hidden" name={key} value={String(value)} />
            ),
          )}
          {children}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {cancelLabel}
            </Button>
            <Button type="submit" variant={variant} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
