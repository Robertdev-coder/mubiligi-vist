"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { formatDateKigali } from "@/shared/utils";
import type { VisitDay } from "@/shared/types";

export function Hero({ visitDay }: { visitDay: VisitDay | null }) {
  return (
    <section className="hero-gradient relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-60" />
      <div className="absolute -left-24 top-10 size-72 rounded-full bg-sky/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-primary/30 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:px-8 lg:pb-28 lg:pt-24">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100 backdrop-blur"
          >
            <Sparkles className="size-3.5 text-sky-300" />
            Official visitor portal · {formatDateKigali(new Date(), "yyyy")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[56px]"
          >
            Welcome to <span className="text-gradient">MUBILIGI VISIT DAY</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-sky-100/75 sm:text-base"
          >
            A smarter and more organized way to register your visit to MSGR MUBILIGI TSS. Register
            online, receive a unique reference, and the Dean of Discipline is notified instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link href="/register" className="sm:w-auto">
              <Button size="lg" className="w-full bg-white text-navy hover:bg-sky-50 sm:w-auto">
                Register Your Visit
                <ArrowRight />
              </Button>
            </Link>
            <Link href="/check-registration" className="sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:w-auto"
              >
                <Search />
                Check My Registration
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12px] text-sky-100/60"
          >
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-sky-300" />
              Secure & verified
            </span>
            <span className="inline-flex items-center gap-2">
              <BellRing className="size-4 text-sky-300" />
              Instant Dean notification
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-sky-300" />
              {visitDay
                ? `Open for ${formatDateKigali(visitDay.visit_date, "dd MMM yyyy")}`
                : "Visit-day registration"}
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.15 }}
          className="relative mx-auto w-full max-w-[440px]"
        >
          <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-sky/20 to-transparent blur-2xl" />
          <div className="relative rounded-[26px] border border-white/15 bg-white/[0.07] p-3 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="rounded-[18px] bg-white p-5 shadow-xl sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-navy text-white">
                    <GraduationCap className="size-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Visitor registration
                    </p>
                    <p className="text-[13px] font-semibold text-navy">MSGR MUBILIGI TSS</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  Pending
                </span>
              </div>

              <div className="mt-5 space-y-2.5">
                {[
                  { icon: UserCheck, label: "Visitor", value: "Parent / Guardian" },
                  { icon: GraduationCap, label: "Student", value: "SOD · Level 3" },
                  { icon: CalendarDays, label: "Visit date", value: visitDay ? formatDateKigali(visitDay.visit_date, "EEE, dd MMM yyyy") : "Visit day" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white text-primary shadow-sm ring-1 ring-slate-100">
                      <row.icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                        {row.label}
                      </p>
                      <p className="truncate text-[12px] font-medium text-slate-700">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-3.5 py-3 ring-1 ring-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Registration saved
                  </span>
                </div>
                <span className="font-mono text-[10px] font-semibold text-emerald-700">
                  MVD-2026-A7K2Q9
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-100 px-3.5 py-2.5">
                <span className="flex size-7 items-center justify-center rounded-full bg-sky-soft text-primary">
                  <BellRing className="size-3.5" />
                </span>
                <p className="text-[10.5px] leading-tight text-slate-500">
                  <span className="font-semibold text-navy">Dean of Discipline</span> has been
                  notified of this visit.
                </p>
              </div>
            </div>
          </div>

          <div className="animate-float absolute -right-4 -top-5 hidden rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 backdrop-blur-md sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-200/70">
              Attendance
            </p>
            <p className="text-sm font-semibold text-white">Arrived · 09:42</p>
          </div>

          <div className="animate-float absolute -bottom-5 -left-4 hidden rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 backdrop-blur-md sm:block [animation-delay:2s]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-200/70">
              Reference
            </p>
            <p className="font-mono text-sm font-semibold text-white">MVD-2026-A7K2Q9</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
