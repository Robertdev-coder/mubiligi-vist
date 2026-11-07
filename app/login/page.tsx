import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BellRing, CheckCircle2, LockKeyhole, ShieldCheck, Users } from "lucide-react";
import { Brand } from "@/frontend/components/ui/brand";
import { LoginForm } from "@/frontend/components/forms/login-form";
import { backendMode } from "@/backend/data";
import { SCHOOL } from "@/shared/constants";

export const metadata: Metadata = {
  title: "Staff Login",
  description: "Authorized staff access to the MUBILIGI VISIT DAY administration portal.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  const showDemo = backendMode === "local" && process.env.NODE_ENV !== "production";

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <div className="hero-gradient relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="relative">
          <Brand variant="light" />
          <div className="mt-16 max-w-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200/70">
              Staff workspace
            </p>
            <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-tight text-white">
              Manage every visit with clarity and confidence.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-sky-100/70">
              The administration portal for the Dean of Discipline and school administrators. Track
              registrations, record attendance, and print official visit-day registers.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {[
              { icon: Users, title: "All registrations", text: "Search, filter and manage visitor records." },
              { icon: BellRing, title: "Instant notifications", text: "The Dean is notified of every new registration." },
              { icon: ShieldCheck, title: "Secure by role", text: "Server-side authorization and protected routes." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sky-200">
                  <item.icon className="size-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-[12px] text-sky-100/60">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-[11px] text-sky-200/50">
          <CheckCircle2 className="size-3.5" />
          {SCHOOL.name} · {SCHOOL.district}
        </div>
      </div>

      <div className="flex flex-col bg-surface">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <div className="lg:hidden">
            <Brand />
          </div>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-primary"
          >
            <ArrowLeft className="size-3.5" />
            Back to public site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                <LockKeyhole className="size-3" />
                Authorized staff only
              </span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-navy">
                Sign in to your dashboard
              </h2>
              <p className="mt-1.5 text-sm text-muted">
                Use the staff credentials issued by the school administrator.
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(7,26,61,0.04),0_20px_50px_-30px_rgba(7,26,61,0.35)] sm:p-7">
              <LoginForm showDemo={showDemo} />
            </div>

            <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">
              Protected by secure session management. Unauthorized access attempts are logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
