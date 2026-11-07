"use client";

import { useEffect, useState, useActionState } from "react";
import { toast } from "sonner";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { loginAction } from "@/backend/auth/actions";
import { DEMO_CREDENTIALS } from "@/shared/constants";
import type { ActionState } from "@/shared/validation/schemas";

export function LoginForm({ showDemo = false }: { showDemo?: boolean }) {
  const [state, formAction, pending] = useActionState<ActionState | undefined, FormData>(
    loginAction,
    undefined,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (state && !state.ok) toast.error(state.message);
  }, [state]);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@mubiligi.rw"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={Boolean(state?.fieldErrors?.email)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="pr-11"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              invalid={Boolean(state?.fieldErrors?.password)}
              required
            />
            <button
              type="button"
              onClick={() => setVisible((value) => !value)}
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-navy"
              aria-label={visible ? "Hide password" : "Show password"}
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {state && !state.ok ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {state.message}
          </div>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <LogIn />}
          {pending ? "Signing in…" : "Sign in to dashboard"}
        </Button>
      </form>

      {showDemo ? (
        <div className="rounded-xl border border-dashed border-line bg-surface/70 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Development access
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            Local demo accounts (seeded). Use these only in development.
          </p>
          <div className="mt-3 space-y-2">
            {DEMO_CREDENTIALS.map((credential) => (
              <button
                key={credential.email}
                type="button"
                onClick={() => {
                  setEmail(credential.email);
                  setPassword(credential.password);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2 text-left text-[11px] transition-colors hover:border-primary/30 hover:bg-sky-soft/40"
              >
                <span>
                  <span className="block font-semibold text-navy">{credential.role}</span>
                  <span className="block font-mono text-slate-500">{credential.email}</span>
                </span>
                <span className="font-mono text-[10px] text-primary">Use →</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
