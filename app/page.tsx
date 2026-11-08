import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ClipboardList, ShieldCheck, UserPlus } from "lucide-react";
import { Brand } from "@/frontend/components/ui/brand";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { SCHOOL } from "@/shared/constants";
import { getSessionUser, dashboardFor } from "@/backend/auth/session";

export const metadata = { title: "MUBILIGI VISIT DAY", robots: { index: false, follow: false } };

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect(dashboardFor(user.role));

  return (
    <main className="hero-gradient flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-xl overflow-hidden">
        <div className="bg-navy px-7 py-8 text-white sm:px-10">
          <Brand variant="light" />
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">Visitor portal &amp; school workspace</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">MUBILIGI VISIT DAY</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-sky-100/70">
            Visitors can register for an open visit day. Staff can sign in to record arrivals, track departures, and prepare attendance reports.
          </p>
        </div>
        <div className="space-y-4 p-7 sm:p-10">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-4">
              <ClipboardList className="size-5 text-primary" />
              <p className="mt-3 text-sm font-semibold text-navy">Fast check-in</p>
              <p className="mt-1 text-xs text-muted">Arrival times are recorded by the system.</p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-4">
              <ShieldCheck className="size-5 text-primary" />
              <p className="mt-3 text-sm font-semibold text-navy">Staff access only</p>
              <p className="mt-1 text-xs text-muted">Attendance and student details are protected.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/register" className="block">
              <Button className="w-full">
                Register a visit <ArrowRight />
              </Button>
            </Link>
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full">
                Staff sign in
              </Button>
            </Link>
          </div>
          <Link href="/check-registration" className="flex items-center justify-center text-sm font-medium text-primary hover:underline">
            Check an existing registration
          </Link>
          <Link href="/signup" className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline">
            <UserPlus className="size-4" /> Request a Prefect account
          </Link>
          <p className="pt-2 text-center text-xs text-slate-400">{SCHOOL.name} · {SCHOOL.district}</p>
        </div>
      </Card>
    </main>
  );
}
