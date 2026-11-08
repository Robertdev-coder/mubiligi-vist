"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { emailAttendanceReportAction } from "@/backend/actions/report-email";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import type { ActionState } from "@/shared/validation/schemas";

export function ReportEmailForm({ date }: { date: string }) {
  const [state, formAction, pending] = useActionState<ActionState | undefined, FormData>(
    emailAttendanceReportAction,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) toast.success(state.message);
    else if (state) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="date" value={date} />
      <div>
        <Label htmlFor="report-email">Email full attendance to</Label>
        <Input
          id="report-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="recipient@example.com"
          required
          maxLength={254}
          className="mt-1.5"
        />
      </div>
      {state && !state.ok ? (
        <p className="text-xs text-danger">{state.message}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Mail />}
        {pending ? "Sending report…" : "Email full attendance"}
      </Button>
    </form>
  );
}
