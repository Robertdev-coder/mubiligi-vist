"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { Brand } from "@/frontend/components/ui/brand";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { signupPrefectAction } from "@/backend/auth/actions";
import type { ActionState } from "@/shared/validation/schemas";

export default function SignupPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState | undefined, FormData>(
    signupPrefectAction,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-line bg-white p-6 shadow-xl sm:p-9">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <div className="mt-5"><Brand /></div>
        <h1 className="mt-7 text-2xl font-semibold text-navy">Request a Prefect account</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Prefect access is pending until an Administrator reviews and activates your account. Public requests cannot assign elevated roles.
        </p>

        {state?.ok ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{state.message}</div>
            <Link href="/login" className="block"><Button className="w-full">Go to staff sign in</Button></Link>
          </div>
        ) : (
          <form action={formAction} className="mt-6 space-y-4">
            {state && !state.ok ? (
              <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="size-4 shrink-0" /> {state.message}
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" autoComplete="name" required minLength={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">School email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone_number">Phone number</Label>
              <Input id="phone_number" name="phone_number" type="tel" autoComplete="tel" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
              <p className="text-xs text-slate-400">Use at least 10 characters.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirm password</Label>
              <Input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" minLength={10} required />
            </div>
            <Button className="w-full" type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus />}
              {pending ? "Submitting request..." : "Request Prefect account"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
